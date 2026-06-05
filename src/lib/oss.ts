
import type OSS from 'ali-oss';

let OSSModule: typeof OSS | null = null;

async function getOSSModule(): Promise<typeof OSS> {
  if (!OSSModule) {
    const mod = await import('ali-oss');
    OSSModule = mod.default || mod;
  }
  return OSSModule;
}

let ossClient: OSS | null = null;

export async function getOSSClient(): Promise<OSS> {
  if (!ossClient) {
    const OSSClass = await getOSSModule();
    ossClient = new OSSClass({
      region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
      bucket: process.env.OSS_BUCKET || '',
      endpoint: process.env.OSS_ENDPOINT,
    });
  }
  return ossClient;
}

/**
 * 生成 OSS 签名上传 URL
 */
export async function generateSignedUploadUrl(
  objectName: string,
  contentType: string,
  expires: number = 300
): Promise<string> {
  const client = await getOSSClient();
  const signedUrl = client.signatureUrl(objectName, {
    method: 'PUT',
    expires,
    'Content-Type': contentType,
  });
  return signedUrl;
}

/**
 * 生成 OSS 签名下载 URL（私有 bucket 使用）
 */
export async function generateSignedDownloadUrl(
  objectName: string,
  expires: number = 3600
): Promise<string> {
  const client = await getOSSClient();
  const signedUrl = client.signatureUrl(objectName, {
    expires,
  });
  return signedUrl;
}

/**
 * 获取文件的公开访问 URL
 */
export function getPublicUrl(objectName: string): string {
  const cdnDomain = process.env.OSS_CDN_DOMAIN;
  const endpoint = process.env.OSS_ENDPOINT;
  const bucket = process.env.OSS_BUCKET;

  if (cdnDomain) {
    return `${cdnDomain.replace(/\/+$/, '')}/${objectName}`;
  }

  return `${endpoint?.replace(/\/+$/, '')}/${bucket}/${objectName}`;
}

/**
 * 从 OSS 删除对象
 */
export async function deleteOSSObject(objectName: string): Promise<void> {
  const client = await getOSSClient();
  await client.delete(objectName);
}
