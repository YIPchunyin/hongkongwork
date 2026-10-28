import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

// GET /api/tags - 获取所有标签及其对应的媒体数量
// 只走 MongoDB，不再降级到本地文件存储。
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.ok) return auth.response;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const connectDB = (await import('@/lib/mongodb')).default;
    const Media = (await import('@/lib/models/Media')).default;
    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [{ $unwind: '$tags' }];
    if (search) {
      pipeline.push({ $match: { tags: { $regex: search, $options: 'i' } } });
    }
    pipeline.push(
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, name: '$_id', count: 1 } }
    );

    const tags = await Media.aggregate(pipeline);

    return NextResponse.json({ success: true, data: tags });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取标签列表失败' },
      { status: 500 }
    );
  }
}
