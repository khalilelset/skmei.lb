'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Props {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
}

/** Drop-in replacement for the category card <Image> — shows shimmer while loading. */
export default function CategoryImage({ src, alt, sizes, priority = false }: Props) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <div className="skeleton-shimmer absolute inset-0 z-0" />}
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover will-change-transform transition-[transform,filter] duration-700 ease-out group-hover:scale-[1.07] group-hover:brightness-110 group-hover:saturate-110 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        sizes={sizes ?? '(max-width: 640px) 208px, 20vw'}
        priority={priority}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}
