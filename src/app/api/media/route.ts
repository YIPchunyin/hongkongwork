import { NextRequest, NextResponse } from 'next/server';
import { fileDB } from '@/lib/fileDB';

export const dynamic = 'force-dynamic';

// GET /api/media - 获取媒体列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const tag = searchParams.get('tag') || undefined;
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') as 'image' | 'video' | undefined;

    let result;

    try {
      // 尝试 MongoDB
      const connectDB = (await import('@/lib/mongodb')).default;
      const Media = (await import('@/lib/models/Media')).default;
      await connectDB();

      const skip = (page - 1) * limit;
      const query: Record<string, unknown> = {};

      if (tag) query.tags = tag;
      if (type && (type === 'image' || type === 'video')) query.type = type;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ];
      }

      const [items, total] = await Promise.all([
        Media.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Media.countDocuments(query),
      ]);

      result = {
        items: items.map((item: Record<string, unknown>) => ({
          _id: String(item._id),
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt as string).toISOString() : undefined,
          updatedAt: item.updatedAt ? new Date(item.updatedAt as string).toISOString() : undefined,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch {
      // 降级为文件存储
      result = fileDB.find({ tag, search, type: type as 'image' | 'video', page, limit });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('获取媒体列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取媒体列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/media - 创建新媒体记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, type, url, thumbnailUrl, ossKey, tags, size, width, height, duration } = body;

    if (!title || !type || !url || !ossKey || size === undefined) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数: title, type, url, ossKey, size' },
        { status: 400 }
      );
    }

    if (!['image', 'video'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'type 必须为 image 或 video' },
        { status: 400 }
      );
    }

    let media;

    try {
      const connectDB = (await import('@/lib/mongodb')).default;
      const Media = (await import('@/lib/models/Media')).default;
      await connectDB();

      const doc = await Media.create({
        title, description, type, url, thumbnailUrl: thumbnailUrl || url,
        ossKey, tags: tags || [], size,
        width: width || 0, height: height || 0, duration: duration || 0,
      });

      media = { ...doc.toObject(), _id: String(doc._id) };
    } catch {
      media = fileDB.create({
        title, description, type, url, thumbnailUrl: thumbnailUrl || url,
        ossKey, tags: tags || [], size,
        width: width || 0, height: height || 0, duration: duration || 0,
      });
    }

    return NextResponse.json({ success: true, data: media }, { status: 201 });
  } catch (error) {
    console.error('创建媒体记录失败:', error);
    return NextResponse.json(
      { success: false, error: '创建媒体记录失败' },
      { status: 500 }
    );
  }
}
