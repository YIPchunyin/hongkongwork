import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Note from '@/lib/models/Note';
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
    const search = searchParams.get('search') || '';

    await connectDB();

    const query: Record<string, unknown> = { userId: payload.userId };
    if (search) {
      query.$or = [{ title: { $regex: search, $options: 'i' } }, { content: { $regex: search, $options: 'i' } }];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Note.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Note.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((item) => ({ ...item, _id: String(item._id) })),
        total, page, limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取记事本失败:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    const body = await request.json();
    const { title, content, images } = body;

    if (!content && (!images || images.length === 0)) {
      return NextResponse.json({ success: false, error: '内容或图片不能为空' }, { status: 400 });
    }

    await connectDB();

    const note = await Note.create({
      userId: payload.userId,
      title: title || '',
      content: content || '',
      images: images || [],
    });

    return NextResponse.json({
      success: true,
      data: { ...note.toObject(), _id: String(note._id) },
    }, { status: 201 });
  } catch (error) {
    console.error('创建记事失败:', error);
    return NextResponse.json({ success: false, error: '创建失败' }, { status: 500 });
  }
}
