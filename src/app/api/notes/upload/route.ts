import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2Storage';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: '请选择图片' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToR2(buffer, file.name, 'notes');

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('上传图片失败:', error);
    return NextResponse.json({ success: false, error: '上传失败' }, { status: 500 });
  }
}