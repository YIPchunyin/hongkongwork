// Shared local file storage helpers (works on Vercel serverless via /tmp)
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// On Vercel, public/ is read-only — use /tmp instead
const isServerless = !!(process.env.VERCEL || process.env.RENDER);
const UPLOAD_BASE_DIR = isServerless
  ? path.join('/tmp', 'uploads')
  : path.join(process.cwd(), 'public', 'uploads');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function saveFileToLocal(
  fileBuffer: Buffer,
  originalName: string,
  type: 'image' | 'video'
): Promise<{
  filePath: string;
  publicUrl: string;
  relativePath: string;
  size: number;
}> {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  const uniqueName = `${uuidv4()}${ext}`;

  const dir = path.join(UPLOAD_BASE_DIR, type === 'video' ? 'videos' : 'images', year, month);
  ensureDir(dir);

  const filePath = path.join(dir, uniqueName);
  fs.writeFileSync(filePath, fileBuffer);

  const folder = type === 'video' ? 'videos' : 'images';
  const relativePath = `uploads/${folder}/${year}/${month}/${uniqueName}`;
  const publicUrl = `/${relativePath}`;

  return {
    filePath,
    publicUrl,
    relativePath,
    size: fileBuffer.length,
  };
}

export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function deleteFileFromLocal(relativePath: string): void {
  const base = isServerless ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'public', 'uploads');
  const fullPath = path.join(base, relativePath.replace(/^uploads\//, ''));
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

export function getFullPath(relativePath: string): string {
  const base = isServerless ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'public', 'uploads');
  return path.join(base, relativePath.replace(/^uploads\//, ''));
}
