import { NextRequest, NextResponse } from 'next/server';
import { saveFileToLocal, fileToBuffer } from '@/lib/localStorage';
import { fileDB } from '@/lib/fileDB';

export const dynamic = 'force-dynamic';

// POST /api/upload - 上传文件到本地磁盘并保存记录（优先 MongoDB，降级为文件存储）
export async function POST(request: NextRequest) {
  try {
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

    // 保存文件到本地磁盘
    const buffer = await fileToBuffer(file);
    const { relativePath } = await saveFileToLocal(buffer, file.name, type);
    // 使用 API 路由提供文件访问，解决生产模式 static files 404 问题
    const fileUrl = `/api/files/${relativePath}`;

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

    let media;

    // 尝试 MongoDB，失败则用文件存储
    try {
      const connectDB = (await import('@/lib/mongodb')).default;
      const Media = (await import('@/lib/models/Media')).default;
      await connectDB();

      const doc = await Media.create({
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        description,
        type,
        url: fileUrl,
        thumbnailUrl: fileUrl,
        ossKey: relativePath,
        tags,
        size: buffer.length,
        width: 0,
        height: 0,
        duration: 0,
      });

      media = {
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
    } catch {
      // MongoDB 不可用，降级为文件存储
      media = fileDB.create({
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        description,
        type,
        url: fileUrl,
        thumbnailUrl: fileUrl,
        ossKey: relativePath,
        tags,
        size: buffer.length,
      });
    }

    return NextResponse.json({ success: true, data: media }, { status: 201 });
  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json(
      { success: false, error: `上传失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}
