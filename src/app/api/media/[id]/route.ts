import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

// 只走 MongoDB，不再降级到本地文件存储。

// GET /api/media/[id] - 获取单个媒体详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!auth.ok) return auth.response;
    const { id } = await params;

    const connectDB = (await import('@/lib/mongodb')).default;
    const Media = (await import('@/lib/models/Media')).default;
    await connectDB();

    const doc = await Media.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ success: false, error: '媒体不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { ...doc, _id: String(doc._id) } });
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
    const auth = requireAuth(request);
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await request.json();

    const connectDB = (await import('@/lib/mongodb')).default;
    const Media = (await import('@/lib/models/Media')).default;
    await connectDB();

    const doc = await Media.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    if (!doc) {
      return NextResponse.json({ success: false, error: '媒体不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { ...doc, _id: String(doc._id) } });
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
    const auth = requireAuth(request);
    if (!auth.ok) return auth.response;
    const { id } = await params;

    const connectDB = (await import('@/lib/mongodb')).default;
    const Media = (await import('@/lib/models/Media')).default;
    await connectDB();

    const doc = await Media.findById(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: '媒体不存在' }, { status: 404 });
    }

    // 先删云端对象，再删记录：避免「记录没了、文件还在」让存储无限累积
    const { isR2Configured, deleteFromR2, r2KeyFromUrl } = await import('@/lib/r2Storage');
    if (!isR2Configured()) {
      return NextResponse.json(
        { success: false, error: '图片存储未配置（缺少 R2 凭证），已拒绝删除以免留下孤儿文件' },
        { status: 503 }
      );
    }

    const keys = new Set<string>();
    if (doc.ossKey) keys.add(doc.ossKey);
    const thumbKey = r2KeyFromUrl(doc.thumbnailUrl);
    if (thumbKey && thumbKey !== doc.ossKey) keys.add(thumbKey);

    for (const key of keys) {
      try {
        // S3 DeleteObject 是幂等的：对象不存在同样返回成功
        await deleteFromR2(key);
      } catch (err) {
        console.error('[Media] 删除 R2 对象失败:', key, err);
        return NextResponse.json(
          {
            success: false,
            error: '删除云端文件失败：' + (err instanceof Error ? err.message : '未知错误'),
          },
          { status: 500 }
        );
      }
    }

    await Media.findByIdAndDelete(id);

    return NextResponse.json({ success: true, data: { message: '删除成功', removedObjects: keys.size } });
  } catch (error) {
    console.error('删除媒体失败:', error);
    return NextResponse.json({ success: false, error: '删除媒体失败' }, { status: 500 });
  }
}
