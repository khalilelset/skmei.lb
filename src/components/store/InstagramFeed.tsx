'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Play, ExternalLink } from 'lucide-react';

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

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function InstagramFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // key: `${postId}_${imgIndex}` → retry count / remount key
  const [imgRetries, setImgRetries] = useState<Map<string, number>>(new Map());
  const [imgKeys,   setImgKeys]   = useState<Map<string, number>>(new Map());
  const [failedImgs, setFailedImgs] = useState<Set<string>>(new Set());

  const handleImgError = (uid: string) => {
    const retries = imgRetries.get(uid) ?? 0;
    if (retries < 3) {
      setImgRetries((prev) => new Map(prev).set(uid, retries + 1));
      setTimeout(() => {
        setImgKeys((prev) => new Map(prev).set(uid, (prev.get(uid) ?? 0) + 1));
      }, 2000 * (retries + 1));
    } else {
      setFailedImgs((prev) => new Set(prev).add(uid));
    }
  };

  useEffect(() => {
    fetch('/api/instagram')
      .then((r) => r.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]));
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

  useEffect(() => {
    if (active?.type === 'video' && active.videoSrc && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [activeIndex, active]);

  return (
    <section className="py-14 sm:py-20 bg-brand-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <p className="text-brand-red text-[10px] font-bold uppercase tracking-[0.3em] mb-3">Instagram</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
              Follow Us on Instagram
            </h2>
            <div className="h-0.5 w-12 bg-brand-red mb-3" />
            <p className="text-white/45 text-sm max-w-md">
              Join our community for daily inspiration and a closer look at our creations
            </p>
          </div>

          {/* Profile card */}
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-white/5 border border-white/10 hover:border-brand-red/50 hover:bg-white/8 transition-all duration-300 rounded-2xl px-4 py-3 shrink-0"
          >
            {/* Instagram gradient ring */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full p-0.5" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
                <div className="w-full h-full rounded-full bg-brand-black flex items-center justify-center border border-brand-black">
                  <Image src={PROFILE_AVATAR} alt={INSTAGRAM_USERNAME} width={28} height={28} className="object-contain" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-white">@{INSTAGRAM_USERNAME}</p>
              <p className="text-xs text-white/40 group-hover:text-brand-red transition-colors">View Profile →</p>
            </div>
          </a>
        </div>

        {/* Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
            {posts.map((post, index) => (
              <button
                key={post.id}
                onClick={() => openPost(index)}
                className={`group relative aspect-square overflow-hidden rounded-lg sm:rounded-xl bg-white/5 ${index >= DESKTOP_LIMIT ? 'lg:hidden' : ''}`}
              >
                {post.type === 'video' ? (
                  <video
                    src={post.videoSrc}
                    autoPlay muted loop playsInline preload="auto"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (() => {
                  const uid = `${post.id}_0`;
                  return failedImgs.has(uid) ? (
                    <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  ) : (
                    <Image
                      key={imgKeys.get(uid) ?? 0}
                      src={post.images?.[0] ?? ''}
                      alt={`Post ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 33vw, 25vw"
                      loading="lazy"
                      onError={() => handleImgError(uid)}
                    />
                  );
                })()}

                {/* Type badge */}
                {post.type === 'video' && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]" viewBox="0 0 24 24" fill="white">
                      <rect x="2" y="7" width="13" height="10" rx="2.5"/>
                      <path d="M15.5 10.8 20 8v8l-4.5-2.8v-2.4z"/>
                    </svg>
                  </div>
                )}
                {post.type === 'carousel' && (post.images?.length ?? 0) > 1 && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-4 h-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]" viewBox="0 0 24 24" fill="none">
                      <rect x="7.5" y="2.5" width="13" height="13" rx="2.5" stroke="white" strokeWidth="2"/>
                      <rect x="3" y="8.5" width="13" height="13" rx="2.5" fill="white"/>
                    </svg>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 text-white">
                  <span className="flex items-center gap-1.5 text-sm font-bold drop-shadow">
                    <Heart className="w-4 h-4 fill-white" /> {formatCount(post.likes)}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-bold drop-shadow">
                    <MessageCircle className="w-4 h-4 fill-white" /> {formatCount(post.comments)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 rounded-2xl bg-white/5 border border-white/10 text-white/40 text-sm">
            No posts yet.
          </div>
        )}

        {/* Visit button */}
        <div className="mt-8 sm:mt-10 text-center">
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm text-brand-black bg-white hover:bg-brand-silver transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            Follow @{INSTAGRAM_USERNAME}
          </a>
        </div>
      </div>

      {/* ── Post Modal ── */}
      {active && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={closePost}
        >
          {/* Close */}
          <button
            onClick={closePost}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrevPost(); }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 border border-white/15 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); goNextPost(); }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 border border-white/15 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Card */}
          <div
            className="relative bg-[#111] rounded-2xl overflow-hidden w-full max-w-[360px] sm:max-w-[420px] mx-14 sm:mx-20 shadow-2xl shadow-black/60 border border-white/8 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
              <a
                href={PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              >
                {/* Instagram gradient ring */}
                <div className="w-9 h-9 rounded-full p-0.5 shrink-0" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
                  <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center">
                    <Image src={PROFILE_AVATAR} alt={INSTAGRAM_USERNAME} width={22} height={22} className="object-contain" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{INSTAGRAM_USERNAME}</p>
                  <p className="text-[10px] text-white/35 leading-tight">Official SKMEI Lebanon</p>
                </div>
              </a>
              <a
                href={active.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-white/50 hover:text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View post
              </a>
            </div>

            {/* Media */}
            <div className="relative bg-black shrink-0 aspect-square">
              {active.type === 'video' ? (
                active.videoSrc ? (
                  <video
                    ref={videoRef}
                    src={active.videoSrc}
                    poster={active.poster}
                    controls autoPlay muted preload="metadata" playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <Image src={active.poster ?? ''} alt="video" fill className="object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 bg-black/60 border border-white/20 rounded-full flex items-center justify-center">
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
                    {slides.map((src, i) => {
                      const uid = `${active!.id}_${i}`;
                      return (
                        <div key={i} className="relative shrink-0 w-full h-full snap-center">
                          {failedImgs.has(uid) ? (
                            <div className="w-full h-full flex items-center justify-center bg-black">
                              <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          ) : (
                            <Image
                              key={imgKeys.get(uid) ?? 0}
                              src={src}
                              alt={`slide ${i + 1}`}
                              fill
                              className="object-contain"
                              onError={() => handleImgError(uid)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {slides.length > 1 && slideIndex > 0 && (
                    <button
                      onClick={() => scrollToSlide(slideIndex - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 border border-white/20 hover:bg-black/70 rounded-full flex items-center justify-center text-white shadow transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  {slides.length > 1 && slideIndex < slides.length - 1 && (
                    <button
                      onClick={() => scrollToSlide(slideIndex + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 border border-white/20 hover:bg-black/70 rounded-full flex items-center justify-center text-white shadow transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 pt-3 pb-4 overflow-y-auto">
              {/* Likes + comments */}
              <div className="flex items-center gap-5 mb-3">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-5 h-5 fill-brand-red stroke-brand-red" />
                  <span className="text-sm font-bold text-white">{formatCount(active.likes)}</span>
                  <span className="text-xs text-white/35">likes</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-5 h-5 text-white/50" />
                  <span className="text-sm font-bold text-white">{formatCount(active.comments)}</span>
                  <span className="text-xs text-white/35">comments</span>
                </span>
              </div>

              {/* Caption */}
              <p className="text-sm text-white/65 leading-relaxed">
                <span className="font-bold text-white mr-1">{INSTAGRAM_USERNAME}</span>
                {active.caption}
              </p>

              {/* Slide dots */}
              {slides.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToSlide(i)}
                      className={`rounded-full transition-all duration-300 ${
                        slideIndex === i ? 'w-4 h-1.5 bg-brand-red' : 'w-1.5 h-1.5 bg-white/25'
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
