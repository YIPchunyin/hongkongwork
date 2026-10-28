import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, isR2Configured } from '@/lib/r2Storage';
import { requireAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

// POST /api/upload - 上传文件到对象存储（R2）
// 只允许写入 R2：未配置或上传失败时直接报错，绝不降级写本地磁盘。
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.ok) return auth.response;
    if (!isR2Configured()) {
      return NextResponse.json(
        { success: false, error: '图片存储未配置（缺少 R2 凭证），已拒绝上传' },
        { status: 503 }
      );
    }

    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const tagsRaw = (formData.get('tags') as string) || '';
    const fileType = (formData.get('fileType') as string) || '';

    if (!file) {
      return NextResponse.json(
        { success: false, error: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    // 检测文件类型
    let type: 'image' | 'video' = fileType as 'image' | 'video';
    if (!['image', 'video'].includes(type)) {
      type = file.type.startsWith('video/') ? 'video' : 'image';
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 只写 R2，失败即报错
    let fileUrl: string;
    let ossKey: string;
    try {
      const r2Result = await uploadToR2(buffer, file.name, type === 'video' ? 'videos' : 'images');
      fileUrl = r2Result.url;
      ossKey = r2Result.key;
    } catch (uploadErr) {
      console.error('[Upload] R2 上传失败:', uploadErr);
      return NextResponse.json(
        {
          success: false,
          error: '上传到对象存储失败：' + (uploadErr instanceof Error ? uploadErr.message : '未知错误'),
        },
        { status: 500 }
      );
    }

    // 解析标签
    let tags: string[] = [];
    if (tagsRaw) {
      try {
        tags = JSON.parse(tagsRaw);
        if (!Array.isArray(tags)) tags = [];
      } catch {
        tags = tagsRaw
          .split(/[,，]/)
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
      }
    }

    const connectDB = (await import('@/lib/mongodb')).default;
    const Media = (await import('@/lib/models/Media')).default;
    await connectDB();

    const doc = await Media.create({
      title: title || file.name.replace(/\.[^/.]+$/, ''),
      description,
      type,
      url: fileUrl,
      thumbnailUrl: fileUrl,
      ossKey,
      tags,
      size: buffer.length,
      width: 0,
      height: 0,
      duration: 0,
    });

    const media = {
      _id: String(doc._id),
      title: doc.title,
      description: doc.description,
      type: doc.type,
      url: doc.url,
      thumbnailUrl: doc.thumbnailUrl,
      ossKey: doc.ossKey,
      tags: doc.tags,
      size: doc.size,
      width: doc.width,
      height: doc.height,
      duration: doc.duration,
      createdAt: doc.createdAt?.toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    };

    return NextResponse.json({ success: true, data: media }, { status: 201 });
  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json(
      { success: false, error: `上传失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}
