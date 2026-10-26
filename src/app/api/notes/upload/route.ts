import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { isR2Configured } from '@/lib/r2Storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    // 只允许写入对象存储：R2 未配置时直接拒绝，绝不落本地磁盘
    if (!isR2Configured()) {
      return NextResponse.json(
        { success: false, error: '图片存储未配置（缺少 R2 凭证），已拒绝上传' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: '请选择图片' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      const { uploadToR2 } = await import('@/lib/r2Storage');
      const { generateThumbnail, fixOrientation, optimizeForWeb, getImageInfo } = await import('@/lib/imageUtils');

      const fixedBuffer = await fixOrientation(buffer);
      const info = await getImageInfo(fixedBuffer);
      const nameParts = file.name.split('.');
      const ext = nameParts.pop() || 'jpg';
      const baseName = nameParts.join('.');

      let webpUrl = '';
      let webpKey = '';
      try {
        const webpBuffer = await optimizeForWeb(buffer, 80);
        const webpResult = await uploadToR2(webpBuffer, baseName + '.webp', 'notes');
        webpUrl = webpResult.url;
        webpKey = webpResult.key;
      } catch (err) {
        console.error('WebP 转换失败，改用原图:', err);
      }

      const fixedName = baseName + '_fixed.' + ext;
      const original = await uploadToR2(fixedBuffer, fixedName, 'notes');

      let thumbUrl = original.url;
      let thumbKey = '';
      try {
        const thumbBuffer = await generateThumbnail(fixedBuffer);
        const thumbResult = await uploadToR2(thumbBuffer, 'thumb_' + fixedName, 'notes');
        thumbUrl = thumbResult.url;
        thumbKey = thumbResult.key;
      } catch (err) {
        console.error('缩略图生成失败，改用原图:', err);
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
    } catch (r2err) {
      // 不再降级到本地磁盘：上传失败就是失败
      console.error('R2 上传失败:', r2err);
      return NextResponse.json(
        {
          success: false,
          error: '上传到对象存储失败：' + (r2err instanceof Error ? r2err.message : '未知错误'),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed' + (error instanceof Error ? ': ' + error.message : '') },
      { status: 500 }
    );
  }
}
