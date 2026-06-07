import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Income from '@/lib/models/Income';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const industry = searchParams.get('industry');

    await connectDB();

    // Build date range query using / (leverages compound index)
    const query: Record<string, unknown> = { userId: payload.userId };
    if (year) {
      if (month) {
        const m = month.padStart(2, '0');
        const n = parseInt(month);
        query.date = { '\x24gte': year + '-' + m, '\x24lt': n === 12 ? String(Number(year) + 1) + '-01' : year + '-' + String(n + 1).padStart(2, '0') };
      } else {
        query.date = { '\x24gte': year, '\x24lt': String(Number(year) + 1) };
      }
    }
    if (industry) query.industry = industry;

    const skip = (page - 1) * limit;

    // Single aggregation pipeline: paginated items + stats in one pass
    const pipeline = [
      { '\x24match': query },
      {
        '\x24facet': {
          paginated: [
            { '\x24sort': { date: -1 } },
            { '\x24skip': skip },
            { '\x24limit': limit },
          ],
          totalCount: [
            { '\x24count': 'count' },
          ],
          stats: [
            {
              '\x24group': {
                _id: null,
                totalIncome: { '\x24sum': '\x24amount' },
                totalHours: { '\x24sum': '\x24hours' },
                totalRecords: { '\x24sum': 1 },
                industryTotals: { '\x24push': { k: { '\x24ifNull': ['\x24industry', '其他'] }, v: '\x24amount' } },
                companyTotals: { '\x24push': { k: { '\x24ifNull': ['\x24company', '其他'] }, v: '\x24amount' } },
                shiftTotals: { '\x24push': { k: { '\x24ifNull': ['\x24shift', '其他'] }, v: '\x24amount' } },
                monthlyTotals: { '\x24push': { k: { '\x24substrCP': ['\x24date', 0, 7] }, v: '\x24amount' } },
              },
            },
          ],
        },
      },
    ];

    const results = await (Income.aggregate(pipeline as any));
    const facet = results[0] || { paginated: [], totalCount: [], stats: [] };
    const items = facet.paginated.map((i: any) => ({
      ...i,
      _id: String(i._id),
      note: i.note || '',
      shift: i.shift || '',
      company: i.company || '',
      industry: i.industry || '',
    }));
    const total = facet.totalCount.length > 0 ? facet.totalCount[0].count : 0;

    // Compute stats from grouped data
    let totalIncome = 0, totalHours = 0, totalRecords = 0;
    const industryTotals: Record<string, number> = {};
    const companyTotals: Record<string, number> = {};
    const shiftTotals: Record<string, number> = {};
    const monthlyTotals: Record<string, number> = {};

    if (facet.stats.length > 0) {
      const s = facet.stats[0];
      totalIncome = s.totalIncome || 0;
      totalHours = s.totalHours || 0;
      totalRecords = s.totalRecords || 0;

      const accumulate = (arr: any[], target: Record<string, number>) => {
        if (!arr) return;
        arr.forEach((item: any) => {
          if (item.k && item.v != null) {
            const key = item.k || '其他';
            target[key] = (target[key] || 0) + Number(item.v);
          }
        });
      };
      accumulate(s.industryTotals, industryTotals);
      accumulate(s.companyTotals, companyTotals);
      accumulate(s.shiftTotals, shiftTotals);
      accumulate(s.monthlyTotals, monthlyTotals);
    }

    return NextResponse.json({
      success: true,
      data: {
        items,
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        stats: {
          totalIncome, totalHours, totalRecords,
          industries: Object.keys(industryTotals).sort(),
          companies: Object.keys(companyTotals).sort(),
          industryTotals,
          companyTotals,
          shiftTotals,
          monthlyTotals,
        },
      },
    });
  } catch (error) {
    console.error('获取收入记录失败:', error);
    return NextResponse.json({ success: false, error: '获取收入记录失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    const body = await request.json();
    const { date, amount, note, shift, hours, industry, company } = body;

    if (!date || amount == null) {
      return NextResponse.json({ success: false, error: '日期和金额不能为空' }, { status: 400 });
    }

    await connectDB();

    const record = await Income.create({
      userId: payload.userId,
      date, amount: Number(amount),
      note: note || '',
      shift: shift || '',
      hours: hours ? Number(hours) : 0,
      industry: industry || '',
      company: company || '',
    });

    return NextResponse.json({
      success: true,
      data: { ...record.toObject(), _id: String(record._id) },
    }, { status: 201 });
  } catch (error) {
    console.error('创建收入记录失败:', error);
    return NextResponse.json({ success: false, error: '创建失败' }, { status: 500 });
  }
}
