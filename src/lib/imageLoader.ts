import type { ImageLoaderProps } from 'next/image';

// Passthrough — Next.js built-in optimization handles resizing, WebP/AVIF, and CDN caching.
// This file is kept for reference but is no longer used (loader: 'custom' removed from next.config.ts).
export default function imageLoader({ src }: ImageLoaderProps): string {
  return src;
}
