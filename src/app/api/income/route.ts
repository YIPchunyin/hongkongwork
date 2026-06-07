import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Income from '@/lib/models/Income';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '\u672a\u767b\u5f55' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '\u767b\u5f55\u5df2\u8fc7\u671f' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const industry = searchParams.get('industry');

    await connectDB();

    const query: Record<string, unknown> = { userId: payload.userId };
    if (year && month) {
      const prefix = year + '-' + month.padStart(2, '0');
      query.date = { '\x24regex': '^' + prefix };
    }
    if (industry) query.industry = industry;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Income.find(query).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Income.countDocuments(query),
    ]);

    const allIncomes = await Income.find({ userId: payload.userId }).lean();
    let totalIncome = 0, totalHours = 0;
    allIncomes.forEach(r => { totalIncome += r.amount || 0; totalHours += r.hours || 0; });

    const industries = [...new Set(allIncomes.map(r => r.industry).filter(Boolean))];
    const companies = [...new Set(allIncomes.map(r => r.company).filter(Boolean))];

    return NextResponse.json({
      success: true,
      data: {
        items: items.map(i => ({ ...i, _id: String(i._id), category: i.category || "未分类", note: i.note || "", shift: i.shift || "", company: i.company || "", industry: i.industry || "" })),
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        stats: { totalIncome, totalHours, totalRecords: allIncomes.length, industries, companies },
      },
    });
  } catch (error) {
    console.error('\u83b7\u53d6\u6536\u5165\u8bb0\u5f55\u5931\u8d25:', error);
    return NextResponse.json({ success: false, error: '\u83b7\u53d6\u6536\u5165\u8bb0\u5f55\u5931\u8d25' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '\u672a\u767b\u5f55' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '\u767b\u5f55\u5df2\u8fc7\u671f' }, { status: 401 });

    const body = await request.json();
    const { date, amount, category, note, shift, hours, industry, company } = body;

    if (!date || amount == null) {
      return NextResponse.json({ success: false, error: '\u65e5\u671f\u548c\u91d1\u989d\u4e0d\u80fd\u4e3a\u7a7a' }, { status: 400 });
    }

    await connectDB();

    const record = await Income.create({
      userId: payload.userId,
      date, amount: Number(amount),
      category: category || '\u5176\u4ed6',
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
    console.error('\u521b\u5efa\u6536\u5165\u8bb0\u5f55\u5931\u8d25:', error);
    return NextResponse.json({ success: false, error: '\u521b\u5efa\u5931\u8d25' }, { status: 500 });
  }
}
