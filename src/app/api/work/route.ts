import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkRecord from '@/lib/models/WorkRecord';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/work - List work records
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const date = searchParams.get('date');

    await connectDB();

    const query: Record<string, unknown> = { userId: payload.userId };
    if (date) query.date = date;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      WorkRecord.find(query).sort({ clockIn: -1 }).skip(skip).limit(limit).lean(),
      WorkRecord.countDocuments(query),
    ]);

    // Calculate summary stats
    const allUserRecords = await WorkRecord.find({ userId: payload.userId }).lean();
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = allUserRecords.filter((r) => r.date === today);
    const todayTotalMinutes = todayRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
    const uniqueLocations = [...new Set(allUserRecords.map((r) => r.location).filter(Boolean))];

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((item) => ({
          ...item,
          _id: String(item._id),
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats: {
          todayHours: Math.round((todayTotalMinutes / 60) * 10) / 10,
          todayMinutes: todayTotalMinutes,
          todayRecords: todayRecords.length,
          totalLocations: uniqueLocations.length,
          locations: uniqueLocations,
        },
      },
    });
  } catch (error) {
    console.error('获取工作记录失败:', error);
    return NextResponse.json({ success: false, error: '获取工作记录失败' }, { status: 500 });
  }
}

// POST /api/work - Clock in or out
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });
    }

    const body = await request.json();
    const { action, location, note } = body; // action: 'in' | 'out'

    if (!action || !['in', 'out'].includes(action)) {
      return NextResponse.json({ success: false, error: '无效操作' }, { status: 400 });
    }

    await connectDB();

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (action === 'in') {
      // Check if already clocked in today
      const existing = await WorkRecord.findOne({
        userId: payload.userId,
        date: today,
        clockOut: null,
      });

      if (existing) {
        return NextResponse.json({ success: false, error: '今天已经打卡上班了，请先下班再重新打卡' });
      }

      const record = await WorkRecord.create({
        userId: payload.userId,
        date: today,
        clockIn: now.toISOString(),
        clockOut: null,
        location: location || '',
        duration: 0,
        note: note || '',
      });

      return NextResponse.json({
        success: true,
        data: { ...record.toObject(), _id: String(record._id) },
        message: `上班打卡成功 ${now.toLocaleTimeString('zh-CN')}`,
      }, { status: 201 });
    } else {
      // Clock out
      const record = await WorkRecord.findOne({
        userId: payload.userId,
        date: today,
        clockOut: null,
      });

      if (!record) {
        return NextResponse.json({ success: false, error: '没有找到今天的上班打卡记录' });
      }

      const clockInTime = new Date(record.clockIn).getTime();
      const clockOutTime = now.getTime();
      const durationMinutes = Math.round((clockOutTime - clockInTime) / 60000);

      record.clockOut = now.toISOString();
      record.duration = durationMinutes;
      if (location) record.location = location;
      if (note) record.note = note;
      await record.save();

      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;

      return NextResponse.json({
        success: true,
        data: { ...record.toObject(), _id: String(record._id) },
        message: `下班打卡成功！今日工作 ${hours} 小时 ${mins} 分钟`,
      });
    }
  } catch (error) {
    console.error('打卡失败:', error);
    return NextResponse.json({ success: false, error: '打卡失败' }, { status: 500 });
  }
}
