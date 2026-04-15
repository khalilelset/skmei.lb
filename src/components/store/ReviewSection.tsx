'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, Send, User, CheckCircle, X, Pencil } from 'lucide-react';

interface Review {
  id: string;
  customer_name: string;
  customer_email?: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface Props {
  slug: string;
  initialRating: number;
  initialCount: number;
}

function Stars({ rating, size = 'sm', interactive = false, onRate }: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' };
  const active = hovered || rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sizes[size]} transition-colors ${interactive ? 'cursor-pointer hover:scale-110' : ''} ${
            s <= active ? 'fill-brand-red stroke-brand-red' : 'fill-transparent stroke-white/20'
          }`}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate?.(s)}
        />
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-white/40 w-3 text-right shrink-0">{label}</span>
      <Star className="w-3 h-3 fill-brand-red stroke-brand-red shrink-0" />
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-red rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-white/30 w-4 shrink-0 text-right">{count}</span>
    </div>
  );
}

const INITIAL_SHOW = 4;

export default function ReviewSection({ slug, initialRating, initialCount }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(initialRating);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [showModal, setShowModal] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [error, setError] = useState('');
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`/api/products/${slug}/reviews`)
      .then((r) => r.json())
      .then((d) => {
        const fetched: Review[] = d.reviews ?? [];
        setReviews(fetched);
        if (fetched.length > 0) {
          const avg = fetched.reduce((sum, r) => sum + r.rating, 0) / fetched.length;
          setAvgRating(Math.round(avg * 10) / 10);
          setTotalCount(fetched.length);
        } else {
          setAvgRating(0);
          setTotalCount(0);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (showModal) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    label: String(star),
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your name.');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Please enter a valid email address.');
    if (rating === 0) return setError('Please select a star rating.');

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: name, customerEmail: email, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }

      setReviews((prev) => [data.review, ...prev]);
      const newCount = totalCount + 1;
      setAvgRating(Math.round(((avgRating * totalCount + rating) / newCount) * 10) / 10);
      setTotalCount(newCount);
      setSubmitted(true);
      setName(''); setEmail(''); setRating(0); setComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSubmitted(false);
    setCountdown(4);
    setError('');
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  useEffect(() => {
    if (!submitted) return;
    setCountdown(4);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownRef.current!);
          closeModal();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  return (
    <section className="py-14 bg-brand-black relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom right, rgba(220,38,38,0.05) 0%, transparent 65%)' }} />

      <div className="relative z-10 container mx-auto px-4">

        {/* Header */}
        <div className="flex items-start sm:items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-red mb-2">Verified Buyers</p>
            <h2 className="text-2xl font-black text-white tracking-tight">Customer Reviews</h2>
            <div className="h-px w-10 bg-brand-red mt-2" />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="group relative inline-flex items-center gap-2 overflow-hidden bg-brand-red text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-brand-red-dark transition-colors shadow-lg shadow-brand-red/25 shrink-0"
          >
            <span aria-hidden className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/15 group-hover:animate-shimmer-sweep pointer-events-none" />
            <Pencil className="w-3.5 h-3.5" />
            Write a Review
          </button>
        </div>

        {/* Rating summary + reviews */}
        <div className="flex flex-col sm:flex-row gap-6">

          {/* Sidebar — summary */}
          {totalCount > 0 && (
            <div className="sm:w-48 shrink-0 bg-white/4 border border-white/8 rounded-2xl p-5 flex sm:flex-col items-center sm:items-stretch gap-4 sm:gap-4 self-start">
              <div className="text-center shrink-0">
                <p className="text-5xl font-black text-white leading-none mb-1">{avgRating.toFixed(1)}</p>
                <Stars rating={avgRating} size="sm" />
                <p className="text-xs text-white/35 mt-2">{totalCount} review{totalCount !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 sm:flex-none">
                {distribution.map((d) => (
                  <RatingBar key={d.label} label={d.label} count={d.count} total={totalCount} />
                ))}
              </div>
            </div>
          )}

          {/* Reviews list */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-white/5 rounded-xl h-20" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-brand-red/10 border border-brand-red/20 flex items-center justify-center mb-4">
                  <Star className="w-7 h-7 stroke-brand-red/50" />
                </div>
                <p className="font-bold text-white/70 text-lg mb-1">No reviews yet</p>
                <p className="text-sm text-white/35">Be the first to share your experience</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(showAll ? reviews : reviews.slice(0, INITIAL_SHOW)).map((review) => (
                  <div
                    key={review.id}
                    className="bg-white/4 border border-white/8 rounded-xl p-4 hover:bg-white/6 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-brand-red/15 border border-brand-red/20 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-brand-red" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm leading-tight">{review.customer_name}</p>
                          <p className="text-xs text-white/30 mt-0.5">
                            {new Date(review.created_at).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <Stars rating={review.rating} size="sm" />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-white/55 leading-relaxed mt-3 ml-11 border-l border-white/10 pl-3">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
                {reviews.length > INITIAL_SHOW && (
                  <button
                    onClick={() => setShowAll((v) => !v)}
                    className="text-sm font-bold text-brand-red hover:text-brand-red-dark transition-colors self-start mt-1"
                  >
                    {showAll ? '↑ Show less' : `Show all ${reviews.length} reviews →`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Write a Review Modal */}
      {showModal && (
        <div className="fixed inset-0 z-200 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md" onClick={closeModal}>
          <div
            className="bg-[#111] border border-white/10 rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar (mobile) */}
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-5 sm:hidden" />

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-red mb-1">Share your experience</p>
                <h3 className="text-lg font-black text-white">Write a Review</h3>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/6 hover:bg-white/12 border border-white/10 transition-colors">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                {/* Animated check */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-green-500/10 border border-green-500/20 animate-ping opacity-30" />
                  <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-400" strokeWidth={1.5} />
                  </div>
                </div>

                <div className="mt-1">
                  <p className="font-black text-white text-2xl tracking-tight">Thank you!</p>
                  <p className="text-sm text-white/45 mt-1.5">Your review has been published.</p>
                </div>

                {/* Countdown progress bar */}
                <div className="w-full mt-3">
                  <div className="h-1 w-full bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-none"
                      style={{
                        width: `${(countdown / 4) * 100}%`,
                        transition: 'width 1s linear',
                      }}
                    />
                  </div>
                  <p className="text-xs text-white/25 mt-2">Closing in {countdown}s…</p>
                </div>

              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Star picker */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-white/40 mb-2 block">
                    Your Rating <span className="text-brand-red">*</span>
                  </label>
                  <Stars rating={rating} size="lg" interactive onRate={setRating} />
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-white/40 mb-2 block">
                    Your Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ahmad"
                    className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/15 transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-white/40 mb-2 block">
                    Email <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ahmad@example.com"
                    className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/15 transition"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-white/40 mb-2 block">
                    Comment <span className="text-white/25">(optional)</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this watch..."
                    rows={3}
                    className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/15 transition resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-brand-red bg-brand-red/10 border border-brand-red/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative flex items-center justify-center gap-2 overflow-hidden bg-brand-red text-white py-3 rounded-xl font-bold hover:bg-brand-red-dark transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-red/30"
                >
                  <span aria-hidden className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/15 group-hover:animate-shimmer-sweep pointer-events-none" />
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
