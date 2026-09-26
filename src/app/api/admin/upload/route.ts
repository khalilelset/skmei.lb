import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;   // 8 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;  // 50 MB (Supabase free-tier limit)
const SLUG_PATTERN = /^[a-z0-9-]+$/;
const BUCKET = 'images'; // must be a public bucket in your Supabase project

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
        { error: `File too large. Maximum size is ${isVideo ? '50' : '8'} MB.` },
        { status: 400 },
      );
    }

    const slug = SLUG_PATTERN.test(rawSlug) ? rawSlug : 'temp';
    // Derive a clean extension from MIME type
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
      'image/gif': 'gif', 'image/avif': 'avif',
    };
    const ext = extMap[baseType] ?? baseType.split('/')[1] ?? 'bin';
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const storagePath = isVideo
      ? `products/${slug}/videos/${unique}.${ext}`
      : `products/${slug}/${unique}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseServer.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: baseType, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseServer.storage.from(BUCKET).getPublicUrl(storagePath);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Upload error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
