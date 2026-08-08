import { NextRequest, NextResponse } from 'next/server';
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

    // Try R2 upload first
    try {
      const { isR2Configured, uploadToR2 } = await import('@/lib/r2Storage');
      if (!isR2Configured()) {
        throw new Error('R2 is not configured, use local storage');
      }
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
        const webpName = baseName + '.webp';
        const webpResult = await uploadToR2(webpBuffer, webpName, 'notes');
        webpUrl = webpResult.url;
        webpKey = webpResult.key;
      } catch (err) {
        console.error('WebP convert failed, upload original', err);
      }

      const fixedName = baseName + '_fixed.' + ext;
      const original = await uploadToR2(fixedBuffer, fixedName, 'notes');

      let thumbUrl = original.url;
      let thumbKey = '';
      try {
        const thumbBuffer = await generateThumbnail(fixedBuffer);
        const thumbName = 'thumb_' + fixedName;
        const thumbResult = await uploadToR2(thumbBuffer, thumbName, 'notes');
        thumbUrl = thumbResult.url;
        thumbKey = thumbResult.key;
      } catch (err) {
        console.error('Thumbnail generation failed, use original:', err);
      }

      return NextResponse.json({
        success: true,
        data: { url: webpUrl || original.url, key: webpKey || original.key, thumbUrl, thumbKey, originalUrl: original.url, width: info.width, height: info.height, format: info.format },
      });
    } catch (r2err) {
      console.error('R2 upload failed, fallback to local storage:', r2err);
    }

    // Fallback: local storage
    const { saveFileToLocal, fileToBuffer } = await import('@/lib/localStorage');
    const localBuffer = await fileToBuffer(file);
    const { relativePath } = await saveFileToLocal(localBuffer, file.name, 'image');
    const fileUrl = '/api/files/' + relativePath;

    const { fileDB } = await import('@/lib/fileDB');
    const media = fileDB.create({
      title: file.name.replace(/\.[^/.]+$/, ''),
      description: '',
      type: 'image',
      url: fileUrl,
      thumbnailUrl: fileUrl,
      ossKey: relativePath,
      tags: [],
      size: buffer.length,
    });

    return NextResponse.json({
      success: true,
      data: { url: fileUrl, key: relativePath, thumbUrl: fileUrl, thumbKey: relativePath, originalUrl: fileUrl },
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' + (error instanceof Error ? ': ' + error.message : '') }, { status: 500 });
  }
}
