import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Note from '@/lib/models/Note';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { deleteFromR2 } from '@/lib/r2Storage';

export const dynamic = 'force-dynamic';

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
    const { title, content, images } = body;

    await connectDB();

    const note = await Note.findOne({ _id: id, userId: payload.userId });
    if (!note) {
      return NextResponse.json({ success: false, error: '记事不存在' }, { status: 404 });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (images !== undefined) note.images = images;

    await note.save();

    return NextResponse.json({
      success: true,
      data: { ...note.toObject(), _id: String(note._id) },
    });
  } catch (error) {
    console.error('更新记事失败:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}

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

    const note = await Note.findOne({ _id: id, userId: payload.userId });
    if (!note) {
      return NextResponse.json({ success: false, error: '记事不存在' }, { status: 404 });
    }

    // Delete images from R2
    if (note.images && note.images.length > 0) {
      await Promise.allSettled(
        note.images.map(async (img: { key?: string }) => {
          if (img.key) {
            try {
              await deleteFromR2(img.key);
            } catch (e) {
              console.error('删除R2图片失败:', e);
            }
          }
        })
      );
    }

    await Note.deleteOne({ _id: id });

    return NextResponse.json({ success: true, data: { message: '已删除' } });
  } catch (error) {
    console.error('删除记事失败:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}