import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// public/ is read-only on Vercel serverless, so serve from /tmp there
const UPLOAD_BASE = process.env.VERCEL
  ? path.join('/tmp')
  : path.join(process.cwd(), 'public');

// MIME type mapping
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

// GET /api/files/[...path] - serve uploaded files through the API
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;

  // Security: prevent path traversal
  const relativePath = pathSegments.join('/');
  const resolvedBase = path.resolve(UPLOAD_BASE);
  const filePath = path.resolve(UPLOAD_BASE, relativePath);

  // Ensure the file stays inside the uploads base directory
  if (filePath !== resolvedBase && !filePath.startsWith(resolvedBase + path.sep)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Read the file and return it
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
