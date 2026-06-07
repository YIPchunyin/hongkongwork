import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Income from '@/lib/models/Income';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, records } = body;

    if (!username || !records || !Array.isArray(records)) {
      return NextResponse.json({ success: false, error: '\u7f3a\u5c11\u7528\u6237\u540d\u6216\u8bb0\u5f55\u6570\u636e' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ success: false, error: '\u7528\u6237\u4e0d\u5b58\u5728' }, { status: 404 });
    }

    const docs = records.map(r => ({
      userId: String(user._id),
      date: r.date || '',
      amount: Number(r.amount) || 0,
      category: r.category || '\u5176\u4ed6',
      note: r.note || '',
      shift: r.shift || '',
      hours: Number(r.hours) || 0,
      industry: r.industry || '',
      company: r.company || '',
    }));

    const result = await Income.insertMany(docs, { ordered: false });

    return NextResponse.json({
      success: true,
      data: { imported: result.length, total: docs.length },
      message: '\u6210\u529f\u5bfc\u5165 ' + result.length + ' \u6761\u6536\u5165\u8bb0\u5f55',
    });
  } catch (error) {
    console.error('\u5bfc\u5165\u5931\u8d25:', error);
    return NextResponse.json({ success: false, error: '\u5bfc\u5165\u5931\u8d25: ' + (error instanceof Error ? error.message : '') }, { status: 500 });
  }
}
