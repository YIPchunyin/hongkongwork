import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const R2_ENDPOINT = process.env.R2_ENDPOINT || "https://8358c6a0b8601d80e0657749df32b2cd.r2.cloudflarestorage.com";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET = process.env.R2_BUCKET || "hongkongwork";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

let r2Client: S3Client | null = null;

function getClient(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });
  }
  return r2Client;
}

export function isR2Configured(): boolean {
  return !!(R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

export async function uploadToR2(
  buffer: Buffer,
  originalName: string,
  folder: string = "images"
): Promise<{ url: string; key: string }> {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const uniqueName = `${uuidv4()}.${ext}`;
  const key = `${folder}/${year}/${month}/${uniqueName}`;

  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: `image/${ext === "png" ? "png" : ext === "gif" ? "gif" : ext === "webp" ? "webp" : "jpeg"}`,
    })
  );

  const url = R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL.replace(/\/+$/, "")}/${key}`
    : `${R2_ENDPOINT.replace(/\/+$/, "")}/${R2_BUCKET}/${key}`;

  return { url, key };
}

export async function generateR2UploadUrl(
  fileName: string,
  contentType: string,
  folder: string = "images"
): Promise<{ signedUrl: string; publicUrl: string; key: string }> {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const ext = fileName.split(".").pop() || "jpg";
  const uniqueName = `${uuidv4()}.${ext}`;
  const key = `${folder}/${year}/${month}/${uniqueName}`;

  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

  const publicUrl = R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL.replace(/\/+$/, "")}/${key}`
    : `${R2_ENDPOINT.replace(/\/+$/, "")}/${R2_BUCKET}/${key}`;

  return { signedUrl, publicUrl, key };
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}

export async function getR2DownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const client = getClient();
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });
  return await getSignedUrl(client, command, { expiresIn });
}
