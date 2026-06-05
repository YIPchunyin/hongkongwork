import { NextRequest, NextResponse } from 'next/server';
import { deleteFileFromLocal } from '@/lib/localStorage';
import { fileDB } from '@/lib/fileDB';

export const dynamic = 'force-dynamic';

// GET /api/media/[id] - 获取单个媒体详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let media;

    try {
      const connectDB = (await import('@/lib/mongodb')).default;
      const Media = (await import('@/lib/models/Media')).default;
      await connectDB();
      const doc = await Media.findById(id).lean();
      if (doc) {
        media = { ...doc, _id: String(doc._id) };
      }
    } catch {
      media = fileDB.findById(id);
    }

    if (!media) {
      return NextResponse.json({ success: false, error: '媒体不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: media });
  } catch (error) {
    console.error('获取媒体详情失败:', error);
    return NextResponse.json({ success: false, error: '获取媒体详情失败' }, { status: 500 });
  }
}

// PUT /api/media/[id] - 更新媒体信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    let media;

    try {
      const connectDB = (await import('@/lib/mongodb')).default;
      const Media = (await import('@/lib/models/Media')).default;
      await connectDB();
      const doc = await Media.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
      if (doc) media = { ...doc, _id: String(doc._id) };
    } catch {
      media = fileDB.update(id, body);
    }

    if (!media) {
      return NextResponse.json({ success: false, error: '媒体不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: media });
  } catch (error) {
    console.error('更新媒体信息失败:', error);
    return NextResponse.json({ success: false, error: '更新媒体信息失败' }, { status: 500 });
  }
}

// DELETE /api/media/[id] - 删除媒体
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let ossKey;

    try {
      const connectDB = (await import('@/lib/mongodb')).default;
      const Media = (await import('@/lib/models/Media')).default;
      await connectDB();
      const doc = await Media.findById(id);
      if (!doc) {
        return NextResponse.json({ success: false, error: '媒体不存在' }, { status: 404 });
      }
      ossKey = doc.ossKey;

      try { deleteFileFromLocal(ossKey); } catch { /* 忽略 */ }
      await Media.findByIdAndDelete(id);
    } catch {
      const item = fileDB.findById(id);
      if (!item) {
        return NextResponse.json({ success: false, error: '媒体不存在' }, { status: 404 });
      }
      ossKey = item.ossKey;

      try { deleteFileFromLocal(ossKey); } catch { /* 忽略 */ }
      fileDB.delete(id);
    }

    return NextResponse.json({ success: true, data: { message: '删除成功' } });
  } catch (error) {
    console.error('删除媒体失败:', error);
    return NextResponse.json({ success: false, error: '删除媒体失败' }, { status: 500 });
  }
}
