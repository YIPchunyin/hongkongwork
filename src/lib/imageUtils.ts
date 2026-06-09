import sharp from "sharp";

const THUMB_MAX_WIDTH = 300;
const THUMB_MAX_HEIGHT = 300;
const THUMB_QUALITY = 70;

export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(THUMB_MAX_WIDTH, THUMB_MAX_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: THUMB_QUALITY })
    .toBuffer();
}

export function getThumbKey(originalKey: string): string {
  const parts = originalKey.split("/");
  const fileName = parts.pop() || "";
  parts.push("thumb_" + fileName);
  return parts.join("/");
}