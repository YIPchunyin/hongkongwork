import sharp from 'sharp';

const THUMB_MAX_WIDTH = 300;
const THUMB_MAX_HEIGHT = 300;
const THUMB_QUALITY = 70;

export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // Auto-fix EXIF orientation
    .resize(THUMB_MAX_WIDTH, THUMB_MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: THUMB_QUALITY })
    .toBuffer();
}

export function getThumbKey(originalKey: string): string {
  const parts = originalKey.split('/');
  const fileName = parts.pop() || '';
  parts.push('thumb_' + fileName);
  return parts.join('/');
}

export async function optimizeForWeb(buffer: Buffer, quality = 80): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .webp({ quality })
    .toBuffer();
}

export async function fixOrientation(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .jpeg({ quality: 90 })
    .toBuffer();
}

export async function resizeImage(
  buffer: Buffer,
  width: number,
  height: number,
  options?: { fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'; format?: 'jpeg' | 'webp' | 'png'; quality?: number }
): Promise<Buffer> {
  const { fit = 'cover', format = 'jpeg', quality = 80 } = options || {};
  let pipeline = sharp(buffer).rotate().resize(width, height, { fit, withoutEnlargement: true });

  if (format === 'webp') pipeline = pipeline.webp({ quality });
  else if (format === 'png') pipeline = pipeline.png({ quality: Math.min(Math.round(quality / 100 * 10), 10) });
  else pipeline = pipeline.jpeg({ quality });

  return pipeline.toBuffer();
}

export async function rotateImage(buffer: Buffer, degrees: 90 | 180 | 270): Promise<Buffer> {
  return sharp(buffer)
    .rotate(degrees)
    .jpeg({ quality: 90 })
    .toBuffer();
}

export async function getImageInfo(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    orientation: metadata.orientation,
    hasAlpha: metadata.hasAlpha,
    space: metadata.space,
  };
}
