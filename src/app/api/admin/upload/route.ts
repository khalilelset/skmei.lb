import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;    // 8 MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;  // 200 MB
const SLUG_PATTERN = /^[a-z0-9-]+$/;

// Stream-based upload — avoids base64 size inflation and Cloudinary's data-URI limit
function streamUpload(
  buffer: Buffer,
  options: Record<string, unknown>,
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options as unknown as Parameters<typeof cloudinary.uploader.upload_stream>[0],
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('No result from Cloudinary'));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

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

    // Strip codec parameters (e.g. "video/webm;codecs=vp9,opus" → "video/webm")
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
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await streamUpload(buffer, {
      folder: isVideo ? `products/${slug}/videos` : `products/${slug}`,
      resource_type: isVideo ? 'video' : 'image',
      ...(isImage ? { allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'] } : {}),
    });

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Cloudinary upload error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
