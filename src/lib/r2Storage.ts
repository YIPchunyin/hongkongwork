import { v4 as uuidv4 } from 'uuid';

// Cloudflare API (not S3) for R2
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || '8358c6a0b8601d80e0657749df32b2cd';
const CF_API_TOKEN = process.env.CF_API_TOKEN || '';
const R2_BUCKET = process.env.R2_BUCKET || 'hongkongwork';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-20c1521e581c4c7799055e13a8970678.r2.dev';

const CF_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${R2_BUCKET}`;

/**
 * Check if Cloudflare R2 API is configured
 */
export function isR2Configured(): boolean {
  return !!(CF_ACCOUNT_ID && CF_API_TOKEN);
}

/**
 * Upload a buffer to R2 using Cloudflare API and return the public URL
 */
export async function uploadToR2(
  buffer: Buffer,
  originalName: string,
  folder: string = 'images'
): Promise<{ url: string; key: string }> {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const uniqueName = `${uuidv4()}.${ext}`;
  const key = `${folder}/${year}/${month}/${uniqueName}`;

  // Upload via Cloudflare API
  // Object name needs to be URL-encoded for the path
  const objectName = encodeURIComponent(key);
  const uploadUrl = `${CF_API_BASE}/objects/${objectName}`;

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': `image/${ext === 'png' ? 'png' : ext === 'gif' ? 'gif' : ext === 'webp' ? 'webp' : 'jpeg'}`,
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`R2 upload failed (${res.status}): ${errText}`);
  }

  // Generate public URL
  const url = `${R2_PUBLIC_URL.replace(/\/+$/, '')}/${key}`;

  return { url, key };
}

/**
 * Delete an object from R2 using Cloudflare API
 */
export async function deleteFromR2(key: string): Promise<void> {
  const objectName = encodeURIComponent(key);
  const deleteUrl = `${CF_API_BASE}/objects/${objectName}`;

  const res = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('R2 delete failed:', res.status, errText);
  }
}

/**
 * Generate a pre-signed upload URL for client-side uploads via Cloudflare API
 */
export async function generateR2UploadUrl(
  fileName: string,
  contentType: string,
  folder: string = 'images'
): Promise<{ signedUrl: string; publicUrl: string; key: string }> {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const ext = fileName.split('.').pop() || 'jpg';
  const uniqueName = `${uuidv4()}.${ext}`;
  const key = `${folder}/${year}/${month}/${uniqueName}`;

  // For client-side upload, use the direct Cloudflare API URL with Bearer token
  // (In production, you'd want a short-lived pre-signed URL instead)
  const objectName = encodeURIComponent(key);
  const signedUrl = `${CF_API_BASE}/objects/${objectName}`;

  const publicUrl = `${R2_PUBLIC_URL.replace(/\/+$/, '')}/${key}`;

  return { signedUrl, publicUrl, key };
}

/**
 * Get a download URL (direct public URL if bucket is public)
 */
export function getR2DownloadUrl(key: string): string {
  return `${R2_PUBLIC_URL.replace(/\/+$/, '')}/${key}`;
}

