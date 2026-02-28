import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const slug = (formData.get('slug') as string | null) ?? 'temp';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64 data URI
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary under products/{slug}/
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `products/${slug}`,
      resource_type: 'image',
    });

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
