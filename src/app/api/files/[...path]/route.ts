import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 基准目录是 public/（URL 中已含 uploads 前缀，不要再加）
const UPLOAD_BASE = path.join(process.cwd(), 'public');

// MIME 类型映射
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
};

export const dynamic = 'force-dynamic';

// GET /api/files/[...path] - 通过 API 提供上传文件访问
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;

  // 安全检查：防止路径遍历攻击
  const relativePath = pathSegments.join('/');
  const filePath = path.resolve(UPLOAD_BASE, relativePath);

  // 确保文件在 uploads 目录内
  if (!filePath.startsWith(UPLOAD_BASE)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // 读取文件并返回
  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(stat.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Accept-Ranges': 'bytes',
    },
  });
}
