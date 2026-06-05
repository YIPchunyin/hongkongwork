import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/lib/models/Expense';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// DELETE /api/expenses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const expense = await Expense.findById(id);
    if (!expense) {
      return NextResponse.json({ success: false, error: '账单不存在' }, { status: 404 });
    }
    if (expense.userId !== payload.userId) {
      return NextResponse.json({ success: false, error: '无权删除' }, { status: 403 });
    }

    await Expense.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: '已删除' });
  } catch (error) {
    console.error('删除账单失败:', error);
    return NextResponse.json({ success: false, error: '删除账单失败' }, { status: 500 });
  }
}

// PATCH /api/expenses/[id] - Update expense (e.g. confirm/correct)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const expense = await Expense.findById(id);
    if (!expense) {
      return NextResponse.json({ success: false, error: '账单不存在' }, { status: 404 });
    }
    if (expense.userId !== payload.userId) {
      return NextResponse.json({ success: false, error: '无权修改' }, { status: 403 });
    }

    const updated = await Expense.findByIdAndUpdate(id, body, { new: true }).lean();
    return NextResponse.json({ success: true, data: { ...updated, _id: String(updated!._id) } });
  } catch (error) {
    console.error('更新账单失败:', error);
    return NextResponse.json({ success: false, error: '更新账单失败' }, { status: 500 });
  }
}
