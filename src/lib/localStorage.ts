import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_BASE_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * 确保上传目录存在
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 保存文件到本地磁盘
 * @param fileBuffer 文件内容
 * @param originalName 原始文件名
 * @param type 'image' | 'video'
 * @returns { filePath, publicUrl, relativePath, size }
 */
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

  // 根据类型分目录存储
  const dir = path.join(UPLOAD_BASE_DIR, type === 'video' ? 'videos' : 'images', year, month);
  ensureDir(dir);

  const filePath = path.join(dir, uniqueName);
  fs.writeFileSync(filePath, fileBuffer);

  // public 目录下的文件可直接通过 /uploads/... 访问
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

/**
 * 读取上传的文件 Buffer
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * 删除本地文件
 * @param relativePath 相对于 public 的路径，如 uploads/images/2024/01/xxx.jpg
 */
export function deleteFileFromLocal(relativePath: string): void {
  const fullPath = path.join(process.cwd(), 'public', relativePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

/**
 * 获取文件完整路径
 */
export function getFullPath(relativePath: string): string {
  return path.join(process.cwd(), 'public', relativePath);
}
