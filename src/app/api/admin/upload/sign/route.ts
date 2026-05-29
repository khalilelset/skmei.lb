import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const token    = req.cookies.get('admin_auth')?.value;
  const expected = process.env.ADMIN_SESSION_SECRET;
  if (!token || !expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { folder } = await req.json() as { folder?: string };
    const safeFolder = typeof folder === 'string' && folder ? folder : 'products/temp/videos';
    const timestamp  = Math.round(Date.now() / 1000);
    const signature  = cloudinary.utils.api_sign_request(
      { timestamp, folder: safeFolder },
      process.env.CLOUDINARY_API_SECRET!,
    );

    return NextResponse.json({
      signature,
      timestamp,
      apiKey:     process.env.CLOUDINARY_API_KEY,
      cloudName:  process.env.CLOUDINARY_CLOUD_NAME,
      folder:     safeFolder,
    });
  } catch (err) {
    console.error('[upload/sign]', err);
    return NextResponse.json({ error: 'Failed to sign upload' }, { status: 500 });
  }
}
