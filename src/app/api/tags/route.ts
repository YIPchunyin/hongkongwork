import { NextRequest, NextResponse } from 'next/server';
import { fileDB } from '@/lib/fileDB';

export const dynamic = 'force-dynamic';

// GET /api/tags - 获取所有标签及其对应的媒体数量
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    let tags;

    try {
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

      tags = await Media.aggregate(pipeline);
    } catch {
      let result = fileDB.getTags();
      if (search) {
        result = result.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
      }
      tags = result;
    }

    return NextResponse.json({ success: true, data: tags });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取标签列表失败' },
      { status: 500 }
    );
  }
}
