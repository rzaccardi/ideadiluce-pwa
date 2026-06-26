import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { env } from '../../config/env.js'

const IMAGE_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

let client: S3Client | null = null

export function isSpacesConfigured(): boolean {
  return Boolean(
    env.SPACES_KEY?.trim() &&
      env.SPACES_SECRET?.trim() &&
      env.SPACES_BUCKET?.trim() &&
      env.SPACES_ENDPOINT?.trim() &&
      env.SPACES_CDN_URL?.trim(),
  )
}

function getClient(): S3Client {
  if (!isSpacesConfigured()) {
    throw new Error('SPACES_NOT_CONFIGURED')
  }
  if (!client) {
    client = new S3Client({
      endpoint: env.SPACES_ENDPOINT!.trim(),
      region: env.SPACES_REGION?.trim() || 'us-east-1',
      credentials: {
        accessKeyId: env.SPACES_KEY!.trim(),
        secretAccessKey: env.SPACES_SECRET!.trim(),
      },
      forcePathStyle: false,
    })
  }
  return client
}

export function spacesPublicUrl(key: string): string {
  const base = env.SPACES_CDN_URL!.trim().replace(/\/$/, '')
  return `${base}/${key.replace(/^\//, '')}`
}

export function spacesKeyFromPublicUrl(url: string): string | null {
  if (!isSpacesConfigured()) return null
  const base = env.SPACES_CDN_URL!.trim().replace(/\/$/, '')
  if (!url.startsWith(`${base}/`)) return null
  return url.slice(base.length + 1)
}

export async function uploadProductImage(
  productId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string },
): Promise<{ key: string; url: string }> {
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
  if (!IMAGE_MIME[ext]) {
    throw new Error('UNSUPPORTED_IMAGE_TYPE')
  }
  const key = `products/${productId}/${randomUUID()}${ext}`
  const contentType = file.mimetype || IMAGE_MIME[ext]

  await getClient().send(
    new PutObjectCommand({
      Bucket: env.SPACES_BUCKET!.trim(),
      Key: key,
      Body: file.buffer,
      ContentType: contentType,
      ACL: 'public-read',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )

  return { key, url: spacesPublicUrl(key) }
}

export async function deleteSpacesObjectByUrl(url: string): Promise<void> {
  const key = spacesKeyFromPublicUrl(url)
  if (!key) return
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: env.SPACES_BUCKET!.trim(),
      Key: key,
    }),
  )
}
