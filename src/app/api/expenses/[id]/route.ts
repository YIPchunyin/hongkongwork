import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/lib/models/Expense';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { deleteFromR2 } from '@/lib/r2Storage';

export const dynamic = 'force-dynamic';

// PATCH /api/expenses/[id] - Edit AI result or confirm
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const expense = await Expense.findById(id);
    if (!expense) return NextResponse.json({ success: false, error: '账单不存在' }, { status: 404 });
    if (expense.userId !== payload.userId) return NextResponse.json({ success: false, error: '无权修改' }, { status: 403 });

    // Update allowed fields
    const updatable = ['amount', 'merchant', 'category', 'description', 'billDate', 'project', 'userNote', 'status'];
    for (const field of updatable) {
      if (body[field] !== undefined) {
        (expense as unknown as Record<string, unknown>)[field] = body[field];
      }
    }
    await expense.save();

    return NextResponse.json({ success: true, data: { ...expense.toObject(), _id: String(expense._id) } });
  } catch (error) {
    console.error('更新账单失败:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}



// PUT /api/expenses/[id] - Update expense (full update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.amount !== undefined) updateData.amount = Number(body.amount);
    if (body.merchant !== undefined) updateData.merchant = body.merchant;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.billDate !== undefined) updateData.billDate = body.billDate;
    if (body.userNote !== undefined) updateData.userNote = body.userNote;
    if (body.project !== undefined) updateData.project = body.project;
    if (body.status !== undefined) updateData.status = body.status;

    await connectDB();

    const record = await Expense.findOneAndUpdate(
      { _id: id, userId: payload.userId },
      { '$set': updateData },
      { new: true }
    );

    if (!record) {
      return NextResponse.json({ success: false, error: '记录不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { ...record.toObject(), _id: String(record._id) },
    });
  } catch (error) {
    console.error('更新账单失败:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}

// DELETE /api/expenses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const expense = await Expense.findById(id);
    if (!expense) return NextResponse.json({ success: false, error: '账单不存在' }, { status: 404 });
    if (expense.userId !== payload.userId) return NextResponse.json({ success: false, error: '无权删除' }, { status: 403 });

    // Delete associated image from R2 if exists
    const imageKey = expense.imageOssKey;
    if (imageKey) {
      try {
        await deleteFromR2(imageKey);
      } catch (r2Error) {
        console.error('删除R2图片失败 (记录继续删除):', r2Error, 'key:', imageKey);
        // Don't block the deletion if R2 fails
      }
    }

    await Expense.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: '已删除' });
  } catch (error) {
    console.error('删除失败:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
