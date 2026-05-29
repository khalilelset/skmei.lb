import type { ImageLoaderProps } from 'next/image';

export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (src.startsWith('https://res.cloudinary.com/')) {
    const q = quality ?? 75;
    // Use Cloudinary's CDN transformations — skips Next.js proxy entirely
    return src.replace('/upload/', `/upload/f_auto,q_${q},w_${width}/`);
  }
  // Local public files (/images/...) — serve directly, no proxy needed
  if (src.startsWith('/')) {
    return src;
  }
  // All other external sources (Supabase, etc.) go through Next.js optimization
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
}
