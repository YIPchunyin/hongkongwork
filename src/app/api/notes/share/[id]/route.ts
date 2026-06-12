import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Note from '@/lib/models/Note';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const note = await Note.findById(id).lean();
    if (!note) {
      return NextResponse.json({ success: false, error: '记事不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: String(note._id),
        title: note.title,
        content: note.content,
        images: note.images,
        createdAt: note.createdAt,
      },
    });
  } catch (error) {
    console.error('获取分享记事失败:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}
