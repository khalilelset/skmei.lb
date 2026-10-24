import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { r2, r2Bucket, r2PublicUrl } from '@/lib/r2';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;    // 8 MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;  // 200 MB
const SLUG_PATTERN = /^[a-z0-9-]+$/;

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
  'image/avif': 'avif',
  'video/mp4':       'mp4',
  'video/webm':      'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
};

export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_auth')?.value;
  const expected = process.env.ADMIN_SESSION_SECRET;
  if (!token || !expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawSlug = (formData.get('slug') as string | null) ?? 'temp';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const baseType = file.type.split(';')[0].trim().toLowerCase();
    const isImage = ALLOWED_IMAGE_TYPES.includes(baseType);
    const isVideo = baseType.startsWith('video/') && baseType.length > 6;

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Only image (JPEG, PNG, WebP, GIF, AVIF) or video files are allowed.' },
        { status: 400 },
      );
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${isVideo ? '200' : '8'} MB.` },
        { status: 400 },
      );
    }

    const slug = SLUG_PATTERN.test(rawSlug) ? rawSlug : 'temp';
    const ext = MIME_TO_EXT[baseType] ?? (isVideo ? 'mp4' : 'jpg');
    const key = isVideo
      ? `products/${slug}/videos/${randomUUID()}.${ext}`
      : `products/${slug}/${randomUUID()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(new PutObjectCommand({
      Bucket: r2Bucket(),
      Key: key,
      Body: buffer,
      ContentType: baseType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));

    return NextResponse.json({ url: r2PublicUrl(key), public_id: key });
  } catch (err) {
    const message = err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null
        ? JSON.stringify(err)
        : String(err);
    console.error('R2 upload error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
