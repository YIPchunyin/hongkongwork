import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Income from '@/lib/models/Income';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '\u672a\u767b\u5f55' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '\u767b\u5f55\u5df2\u8fc7\u671f' }, { status: 401 });

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.date !== undefined) updateData.date = body.date;
    if (body.amount !== undefined) updateData.amount = Number(body.amount);
    if (body.category !== undefined) updateData.category = body.category;
    if (body.note !== undefined) updateData.note = body.note;
    if (body.shift !== undefined) updateData.shift = body.shift;
    if (body.hours !== undefined) updateData.hours = Number(body.hours);
    if (body.industry !== undefined) updateData.industry = body.industry;
    if (body.company !== undefined) updateData.company = body.company;

    await connectDB();

    const record = await Income.findOneAndUpdate(
      { _id: id, userId: payload.userId },
      { '\x24set': updateData },
      { new: true }
    );

    if (!record) {
      return NextResponse.json({ success: false, error: '\u8bb0\u5f55\u4e0d\u5b58\u5728' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { ...record.toObject(), _id: String(record._id) },
    });
  } catch (error) {
    console.error('\u66f4\u65b0\u6536\u5165\u8bb0\u5f55\u5931\u8d25:', error);
    return NextResponse.json({ success: false, error: '\u66f4\u65b0\u5931\u8d25' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '\u672a\u767b\u5f55' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '\u767b\u5f55\u5df2\u8fc7\u671f' }, { status: 401 });

    await connectDB();

    const record = await Income.findOneAndDelete({ _id: id, userId: payload.userId });
    if (!record) {
      return NextResponse.json({ success: false, error: '\u8bb0\u5f55\u4e0d\u5b58\u5728' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: '\u5220\u9664\u6210\u529f' });
  } catch (error) {
    console.error('\u5220\u9664\u6536\u5165\u8bb0\u5f55\u5931\u8d25:', error);
    return NextResponse.json({ success: false, error: '\u5220\u9664\u5931\u8d25' }, { status: 500 });
  }
}
