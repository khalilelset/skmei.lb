import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const SLUG_PATTERN = /^[a-z0-9-]+$/;

export async function POST(req: NextRequest) {
  // Auth is enforced by middleware — this is an extra defence-in-depth check
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

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only image files are allowed (JPEG, PNG, WebP, GIF, AVIF)' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 8 MB.' },
        { status: 400 }
      );
    }

    // Sanitize slug: only allow lowercase letters, digits, hyphens
    const slug = SLUG_PATTERN.test(rawSlug) ? rawSlug : 'temp';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `products/${slug}`,
      resource_type: 'image', // never auto — only images
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'],
    });

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
