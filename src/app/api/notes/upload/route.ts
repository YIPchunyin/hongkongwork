import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2Storage';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { generateThumbnail, fixOrientation, optimizeForWeb, getImageInfo } from '@/lib/imageUtils';

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

    // Auto-fix EXIF orientation (especially important for phone photos)
    const fixedBuffer = await fixOrientation(buffer);
    const info = await getImageInfo(fixedBuffer);

    // Determine file name parts
    const nameParts = file.name.split('.');
    const ext = nameParts.pop() || 'jpg';
    const baseName = nameParts.join('.');

    // Upload WebP optimized version
    let webpUrl = '';
    let webpKey = '';
    try {
      const webpBuffer = await optimizeForWeb(buffer, 80);
      const webpName = baseName + '.webp';
      const webpResult = await uploadToR2(webpBuffer, webpName, 'notes');
      webpUrl = webpResult.url;
      webpKey = webpResult.key;
    } catch (err) {
      console.error('WebP转换失败，上传原图:', err);
    }

    // Upload fixed-orientation original
    const fixedName = baseName + '_fixed.' + ext;
    const original = await uploadToR2(fixedBuffer, fixedName, 'notes');

    // Generate and upload thumbnail
    let thumbUrl = original.url;
    let thumbKey = '';
    try {
      const thumbBuffer = await generateThumbnail(fixedBuffer);
      const thumbName = 'thumb_' + fixedName;
      const thumbResult = await uploadToR2(thumbBuffer, thumbName, 'notes');
      thumbUrl = thumbResult.url;
      thumbKey = thumbResult.key;
    } catch (err) {
      console.error('缩略图生成失败，使用原图:', err);
    }

    return NextResponse.json({
      success: true,
      data: {
        url: webpUrl || original.url,
        key: webpKey || original.key,
        thumbUrl,
        thumbKey,
        originalUrl: original.url,
        width: info.width,
        height: info.height,
        format: info.format,
      },
    });
  } catch (error) {
    console.error('上传图片失败:', error);
    return NextResponse.json({ success: false, error: '上传失败' }, { status: 500 });
  }
}