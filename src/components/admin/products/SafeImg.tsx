'use client';

import * as React from 'react';

/**
 * <img> that swaps to `fallback` when the file can't load (e.g. old res.cloudinary.com links,
 * which now answer 401). Resets on its own when `src` changes.
 */
export function SafeImg({
  src,
  fallback,
  alt = '',
  ...props
}: Omit<React.ComponentProps<'img'>, 'src'> & { src: string; fallback: React.ReactNode }) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  if (failedSrc === src) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} onError={() => setFailedSrc(src)} {...props} />;
}
