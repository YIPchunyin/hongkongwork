import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/lib/models/Expense';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/expenses/review - Get pending/recognized items needing user review
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    await connectDB();

    // Get all non-confirmed items for this user
    const items = await Expense.find({
      userId: payload.userId,
      status: { $in: ['pending', 'recognized'] },
    }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      data: items.map((item) => ({ ...item, _id: String(item._id) })),
      total: items.length,
    });
  } catch (error) {
    console.error('获取待审核账单失败:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}
