import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { r2, r2Bucket, r2PublicUrl } from '@/lib/r2';

const FOLDER_PATTERN = /^[a-z0-9-]+(\/[a-z0-9-]+){0,4}$/;

const VIDEO_EXT: Record<string, string> = {
  'video/mp4':       'mp4',
  'video/webm':      'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/x-matroska': 'mkv',
};

export async function POST(req: NextRequest) {
  const token    = req.cookies.get('admin_auth')?.value;
  const expected = process.env.ADMIN_SESSION_SECRET;
  if (!token || !expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { folder, contentType } = await req.json() as { folder?: string; contentType?: string };

    const safeFolder = typeof folder === 'string' && FOLDER_PATTERN.test(folder)
      ? folder
      : 'products/temp/videos';

    const type = typeof contentType === 'string'
      ? contentType.split(';')[0].trim().toLowerCase()
      : '';
    if (!/^video\/[a-z0-9.+-]+$/.test(type)) {
      return NextResponse.json({ error: 'Only video files can be uploaded here.' }, { status: 400 });
    }

    const key = `${safeFolder}/${randomUUID()}.${VIDEO_EXT[type] ?? 'mp4'}`;

    // Content-Type is part of the signature, so the browser must send exactly this value.
    const uploadUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({ Bucket: r2Bucket(), Key: key, ContentType: type }),
      { expiresIn: 600 },
    );

    return NextResponse.json({ uploadUrl, publicUrl: r2PublicUrl(key), contentType: type });
  } catch (err) {
    console.error('[upload/sign]', err);
    return NextResponse.json({ error: 'Failed to prepare upload' }, { status: 500 });
  }
}
