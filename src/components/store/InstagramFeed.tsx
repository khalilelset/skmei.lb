'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Play } from 'lucide-react';

const PROFILE_URL = 'https://www.instagram.com/skmei.lb/';
const INSTAGRAM_USERNAME = 'skmei.lb';
const PROFILE_AVATAR = '/images/logo/black.png';

type Post = {
  id: string;
  type: 'image' | 'carousel' | 'video';
  images?: string[];
  videoSrc?: string;
  poster?: string;
  postUrl: string;
  likes: number;
  comments: number;
  caption: string;
};

const DESKTOP_LIMIT = 8;

const FALLBACK_POSTS: Post[] = [
  {
    id: 'f1', type: 'image',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&fit=crop'],
    postUrl: 'https://www.instagram.com/skmei.lb/',
    likes: 312, comments: 18,
    caption: 'Precision meets style. The SKMEI 1068 — built for those who move fast. ⌚🔥 #SKMEI #WatchOfTheDay',
  },
  {
    id: 'f2', type: 'image',
    images: ['https://images.unsplash.com/photo-1524592094714-0f0654e59cf?w=600&q=80&fit=crop'],
    postUrl: 'https://www.instagram.com/skmei.lb/',
    likes: 489, comments: 34,
    caption: 'Classic analog elegance that never goes out of style. 🕰️ Available now at SKMEI.LB #WatchLovers',
  },
  {
    id: 'f3', type: 'carousel',
    images: [
      'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80&fit=crop',
      'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=600&q=80&fit=crop',
    ],
    postUrl: 'https://www.instagram.com/skmei.lb/',
    likes: 627, comments: 41,
    caption: 'Sports collection drop 🏃‍♂️ Waterproof, shock-resistant, and always on time. Swipe to see all colors! #SportWatch',
  },
  {
    id: 'f4', type: 'image',
    images: ['https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=600&q=80&fit=crop'],
    postUrl: 'https://www.instagram.com/skmei.lb/',
    likes: 214, comments: 12,
    caption: 'Your wrist deserves the best. Luxury look, unbeatable price. 💎 #SKMEI #Lebanon',
  },
  {
    id: 'f5', type: 'image',
    images: ['https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=600&q=80&fit=crop'],
    postUrl: 'https://www.instagram.com/skmei.lb/',
    likes: 398, comments: 27,
    caption: 'New arrivals just landed! 🚀 Shop the latest SKMEI collection before it sells out. Link in bio. #NewArrivals',
  },
  {
    id: 'f6', type: 'image',
    images: ['https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=600&q=80&fit=crop'],
    postUrl: 'https://www.instagram.com/skmei.lb/',
    likes: 551, comments: 45,
    caption: 'Every second counts. Make it stylish. ⏱️ SKMEI digital sport series. #DigitalWatch #SKMEILB',
  },
  {
    id: 'f7', type: 'image',
    images: ['https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80&fit=crop'],
    postUrl: 'https://www.instagram.com/skmei.lb/',
    likes: 183, comments: 9,
    caption: 'Minimalist design. Maximum impact. 🖤 #WatchStyle #SKMEI',
  },
  {
    id: 'f8', type: 'carousel',
    images: [
      'https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=600&q=80&fit=crop',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&fit=crop',
    ],
    postUrl: 'https://www.instagram.com/skmei.lb/',
    likes: 742, comments: 63,
    caption: 'His & Hers collection 💑 The perfect gift for every occasion. Free shipping across Lebanon! #GiftIdeas',
  },
];

export default function InstagramFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch('/api/instagram')
      .then((r) => r.json())
      .then((data) => setPosts(Array.isArray(data) && data.length > 0 ? data : FALLBACK_POSTS))
      .catch(() => setPosts(FALLBACK_POSTS));
  }, []);

  const openPost = (index: number) => {
    setActiveIndex(index);
    setSlideIndex(0);
    setTimeout(() => slideRef.current?.scrollTo({ left: 0 }), 0);
  };

  const closePost = () => {
    videoRef.current?.pause();
    setActiveIndex(null);
    setSlideIndex(0);
  };

  const goPrevPost = () => {
    videoRef.current?.pause();
    setActiveIndex((i) => (i !== null ? (i - 1 + posts.length) % posts.length : 0));
    setSlideIndex(0);
  };

  const goNextPost = () => {
    videoRef.current?.pause();
    setActiveIndex((i) => (i !== null ? (i + 1) % posts.length : 0));
    setSlideIndex(0);
  };

  const scrollToSlide = (idx: number) => {
    setSlideIndex(idx);
    slideRef.current?.scrollTo({ left: idx * (slideRef.current.clientWidth), behavior: 'smooth' });
  };

  const handleSlideScroll = () => {
    const el = slideRef.current;
    if (!el) return;
    setSlideIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const active = activeIndex !== null ? posts[activeIndex] : null;
  const slides = active?.images ?? (active?.poster ? [active.poster] : []);

  return (
    <section className="py-14 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-black mb-2">
            Follow us on Instagram
          </h2>
          <p className="text-brand-gray text-sm sm:text-base">
            Join our community for daily inspiration and a closer look at our creations
          </p>
        </div>

        {/* Grid — 3 cols mobile (3×3), 4 cols desktop (4×2) */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
            {posts.map((post, index) => (
              <button
                key={post.id}
                onClick={() => openPost(index)}
                className={`group relative aspect-square overflow-hidden rounded-lg sm:rounded-xl bg-brand-silver-light ${
                  index >= DESKTOP_LIMIT ? 'lg:hidden' : ''
                }`}
              >
                {/* Thumbnail */}
                {post.type === 'video' ? (
                  <Image
                    src={post.poster ?? ''}
                    alt={`Post ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 33vw, 25vw"
                    loading="lazy"
                  />
                ) : (
                  <Image
                    src={post.images?.[0] ?? ''}
                    alt={`Post ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 33vw, 25vw"
                    loading="lazy"
                  />
                )}

                {/* Video / Carousel badge */}
                {post.type === 'video' && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-6 h-6 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="7" width="13" height="10" rx="2.5"/>
                      <path d="M15.5 10.8 20 8v8l-4.5-2.8v-2.4z"/>
                    </svg>
                  </div>
                )}
                {post.type === 'carousel' && (post.images?.length ?? 0) > 1 && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="7.5" y="2.5" width="13" height="13" rx="2.5" stroke="white" strokeWidth="2"/>
                      <rect x="3" y="8.5" width="13" height="13" rx="2.5" fill="white"/>
                    </svg>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 text-white">
                  <span className="flex items-center gap-1 text-sm font-semibold drop-shadow">
                    <Heart className="w-4 h-4 fill-white" /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold drop-shadow">
                    <MessageCircle className="w-4 h-4 fill-white" /> {post.comments}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 rounded-2xl bg-brand-silver-light text-brand-gray text-sm">
            No posts yet.
          </div>
        )}

        {/* Visit Instagram Button */}
        <div className="mt-8 sm:mt-10 text-center">
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-brand-black text-white px-7 py-3 rounded-full font-semibold hover:bg-brand-red transition-colors duration-300 text-sm sm:text-base"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            Visit Instagram
          </a>
        </div>
      </div>

      {/* ── Full-Screen Modal ─────────────────────────────────────────────── */}
      {active && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={closePost}>

          {/* Close — top right corner */}
          <button
            onClick={closePost}
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Prev post arrow */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrevPost(); }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next post arrow */}
          <button
            onClick={(e) => { e.stopPropagation(); goNextPost(); }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Modal Card */}
          <div
            className="relative bg-white rounded-2xl overflow-hidden w-full max-w-[360px] sm:max-w-[480px] mx-14 sm:mx-20 shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <a
                href={PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 hover:opacity-75 transition-opacity"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-brand-red shrink-0 bg-brand-silver-light">
                  <Image src={PROFILE_AVATAR} alt={INSTAGRAM_USERNAME} width={36} height={36} className="object-contain p-1 w-full h-full" />
                </div>
                <span className="text-sm font-bold text-brand-black">{INSTAGRAM_USERNAME}</span>
              </a>
              <a
                href={active.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-[#0095F6] hover:underline"
              >
                View post
              </a>
            </div>

            {/* Media area */}
            <div className="relative bg-black shrink-0" style={{ aspectRatio: '1/1' }}>

              {active.type === 'video' ? (
                active.videoSrc ? (
                  <video
                    ref={videoRef}
                    src={active.videoSrc}
                    poster={active.poster}
                    controls
                    preload="metadata"
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <Image src={active.poster ?? ''} alt="video" fill className="object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center">
                        <Play className="w-7 h-7 text-white fill-white ml-1" />
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <>
                  <div
                    ref={slideRef}
                    onScroll={handleSlideScroll}
                    className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {slides.map((src, i) => (
                      <div key={i} className="relative shrink-0 w-full h-full snap-center">
                        <Image src={src} alt={`slide ${i + 1}`} fill className="object-contain" />
                      </div>
                    ))}
                  </div>

                  {slides.length > 1 && slideIndex > 0 && (
                    <button
                      onClick={() => scrollToSlide(slideIndex - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-brand-black shadow transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {slides.length > 1 && slideIndex < slides.length - 1 && (
                    <button
                      onClick={() => scrollToSlide(slideIndex + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-brand-black shadow transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 pt-3 pb-4 overflow-y-auto">
              <div className="flex items-center gap-4 mb-2">
                <span className="flex items-center gap-1.5 text-sm">
                  <Heart className="w-5 h-5 text-brand-red fill-brand-red" />
                  <span className="font-semibold text-brand-black">{active.likes}</span>
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <MessageCircle className="w-5 h-5 text-gray-500" />
                  <span className="font-semibold text-brand-black">{active.comments}</span>
                </span>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-bold text-brand-black mr-1">{INSTAGRAM_USERNAME}</span>
                {active.caption}
              </p>

              {slides.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToSlide(i)}
                      className={`rounded-full transition-all duration-300 ${
                        slideIndex === i ? 'w-4 h-1.5 bg-brand-black' : 'w-1.5 h-1.5 bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
