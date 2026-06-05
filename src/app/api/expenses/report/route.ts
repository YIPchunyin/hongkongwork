import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/lib/models/Expense';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/expenses/report?month=2026-06
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // e.g. "2026-06"
    if (!month) {
      return NextResponse.json({ success: false, error: '请指定月份，如 month=2026-06' }, { status: 400 });
    }

    await connectDB();

    const regex = `^${month}-`;
    const items = await Expense.find({
      userId: payload.userId,
      status: 'confirmed',
      billDate: { $regex: regex },
    }).sort({ billDate: -1 }).lean();

    const totalAmount = items.reduce((sum, i) => sum + (i.amount || 0), 0);
    const byCategory: Record<string, { count: number; total: number; items: typeof items }> = {};
    for (const item of items) {
      const cat = item.category || '其他';
      if (!byCategory[cat]) byCategory[cat] = { count: 0, total: 0, items: [] };
      byCategory[cat].count++;
      byCategory[cat].total += item.amount || 0;
      byCategory[cat].items.push(item);
    }

    return NextResponse.json({
      success: true,
      data: {
        month,
        totalCount: items.length,
        totalAmount,
        byCategory: Object.entries(byCategory).map(([name, st]) => ({
          category: name,
          count: st.count,
          total: st.total,
          items: st.items.map((i) => ({ ...i, _id: String(i._id) })),
        })),
        items: items.map((i) => ({ ...i, _id: String(i._id) })),
      },
    });
  } catch (error) {
    console.error('获取月报失败:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}
