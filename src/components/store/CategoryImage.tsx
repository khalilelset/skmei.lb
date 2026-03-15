'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Props {
  src: string;
  alt: string;
  sizes?: string;
}

/** Drop-in replacement for the category card <Image> — shows shimmer while loading. */
export default function CategoryImage({ src, alt, sizes }: Props) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <div className="skeleton-shimmer absolute inset-0 z-0" />}
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-all duration-700 ease-out group-hover:scale-110 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        sizes={sizes ?? '(max-width: 640px) 208px, 20vw'}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}
