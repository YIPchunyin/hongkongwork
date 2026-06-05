import { NextRequest, NextResponse } from 'next/server';
import { generateSignedUploadUrl, getPublicUrl } from '@/lib/oss';
import { v4 as uuidv4 } from 'uuid';

// POST /api/upload-sign - 获取 OSS 上传签名 URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType, fileSize } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数: fileName, fileType' },
        { status: 400 }
      );
    }

    // 根据文件类型确定存储路径
    const isVideo = fileType.startsWith('video/');
    const folder = isVideo ? 'videos' : 'images';

    // 生成唯一文件名
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const ext = fileName.split('.').pop() || 'jpg';
    const uniqueName = `${uuidv4()}.${ext}`;
    const objectName = `${folder}/${year}/${month}/${uniqueName}`;

    // 生成签名上传 URL（前端直接用 PUT 请求上传到 OSS）
    const signedUrl = await generateSignedUploadUrl(objectName, fileType);
    const publicUrl = getPublicUrl(objectName);

    return NextResponse.json({
      success: true,
      data: {
        signedUrl,
        publicUrl,
        ossKey: objectName,
        fileName: uniqueName,
      },
    });
  } catch (error) {
    console.error('获取上传签名失败:', error);
    return NextResponse.json(
      { success: false, error: '获取上传签名失败，请检查 OSS 配置' },
      { status: 500 }
    );
  }
}
