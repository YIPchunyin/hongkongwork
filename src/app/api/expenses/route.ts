import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/lib/models/Expense';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { saveFileToLocal, fileToBuffer } from '@/lib/localStorage';

export const dynamic = 'force-dynamic';

// GET /api/expenses - List expenses
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const confirmed = searchParams.get('confirmed');
    const category = searchParams.get('category');

    await connectDB();

    const query: Record<string, unknown> = { userId: payload.userId };
    if (confirmed === 'true') query.confirmed = true;
    if (confirmed === 'false') query.confirmed = false;
    if (category) query.category = category;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Expense.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Expense.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((item) => ({
          ...item,
          _id: String(item._id),
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取账单列表失败:', error);
    return NextResponse.json({ success: false, error: '获取账单列表失败' }, { status: 500 });
  }
}

// POST /api/expenses - Create expenses (after AI confirmation)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: '请提供账单数据' }, { status: 400 });
    }

    await connectDB();

    const created = [];
    for (const item of items) {
      // Upload image if provided as base64
      const doc = await Expense.create({
        billDate: item.date || new Date().toISOString().split('T')[0],
        amount: item.amount || 0,
        merchant: item.merchant || '',
        category: item.category || '其他',
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        imageOssKey: item.imageOssKey || '',
        confirmed: true,
        aiRaw: item.aiRaw || '',
        userId: payload.userId,
      });
      created.push({ ...doc.toObject(), _id: String(doc._id) });
    }

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('创建账单失败:', error);
    return NextResponse.json({ success: false, error: '创建账单失败' }, { status: 500 });
  }
}
