import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/lib/models/Expense';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    const body = await request.json();
    const { amount, merchant, category, billDate, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: '请输入有效金额' }, { status: 400 });
    }

    await connectDB();

    const CATEGORIES = ['餐饮', '交通', '购物', '医疗', '娱乐', '居住', '通讯', '教育', '其他'];
    const validCategory = CATEGORIES.includes(category) ? category : '其他';

    const expense = await Expense.create({
      userId: payload.userId,
      status: 'confirmed',
      amount: parseFloat(amount),
      merchant: merchant || '',
      category: validCategory,
      description: description || '',
      billDate: billDate || new Date().toISOString().split('T')[0],
      imageUrl: '',
      imageOssKey: '',
      fileName: '',
    });

    return NextResponse.json({
      success: true,
      data: [{
        _id: String(expense._id),
        fileName: expense.fileName,
        imageUrl: expense.imageUrl,
        amount: expense.amount,
        merchant: expense.merchant,
        category: expense.category,
        billDate: expense.billDate,
        description: expense.description,
      }],
      totalAmount: expense.amount,
    }, { status: 201 });
  } catch (error) {
    console.error('手动录入失败:', error);
    return NextResponse.json({ success: false, error: '录入失败' }, { status: 500 });
  }
}