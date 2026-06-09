import { NextRequest, NextResponse } from 'next/server';
import { fixOrientation, rotateImage, resizeImage, getImageInfo, optimizeForWeb } from '@/lib/imageUtils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const action = (formData.get('action') as string) || 'info';

    if (!file) {
      return NextResponse.json({ success: false, error: '请选择图片' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    switch (action) {
      case 'orient': {
        const result = await fixOrientation(buffer);
        return new NextResponse(new Uint8Array(result), {
          headers: {
            'Content-Type': 'image/jpeg',
          },
        });
      }

      case 'rotate': {
        const degrees = parseInt(formData.get('degrees') as string || '90');
        const result = await rotateImage(buffer, degrees as 90 | 180 | 270);
        return new NextResponse(new Uint8Array(result), {
          headers: {
            'Content-Type': 'image/jpeg',
          },
        });
      }

      case 'resize': {
        const width = parseInt(formData.get('width') as string || '800');
        const height = parseInt(formData.get('height') as string || '600');
        const fit = (formData.get('fit') as string) || 'cover';
        const format = (formData.get('format') as string) || 'jpeg';
        const result = await resizeImage(buffer, width, height, {
          fit: fit as any,
          format: format as any,
        });
        const contentType = format === 'webp' ? 'image/webp' : format === 'png' ? 'image/png' : 'image/jpeg';
        return new NextResponse(new Uint8Array(result), {
          headers: {
            'Content-Type': contentType,
          },
        });
      }

      case 'webp': {
        const quality = parseInt(formData.get('quality') as string || '80');
        const result = await optimizeForWeb(buffer, quality);
        return new NextResponse(new Uint8Array(result), {
          headers: {
            'Content-Type': 'image/webp',
          },
        });
      }

      case 'info':
      default: {
        const info = await getImageInfo(buffer);
        return NextResponse.json({ success: true, data: info });
      }
    }
  } catch (error) {
    console.error('图片处理失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '图片处理失败',
    }, { status: 500 });
  }
}