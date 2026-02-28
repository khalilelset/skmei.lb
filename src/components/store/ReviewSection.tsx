'use client';

import { useState, useEffect } from 'react';
import { Star, Send, User, CheckCircle, X, Pencil } from 'lucide-react';

interface Review {
  id: string;
  customer_name: string;
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
          className={`${sizes[size]} transition-colors ${interactive ? 'cursor-pointer' : ''} ${
            s <= active ? 'fill-brand-red stroke-brand-red' : 'fill-transparent stroke-gray-300'
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
      <span className="text-brand-gray w-3 text-right shrink-0">{label}</span>
      <Star className="w-3 h-3 fill-brand-red stroke-brand-red shrink-0" />
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-red rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-brand-gray w-4 shrink-0 text-right">{count}</span>
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

  // Form state
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/products/${slug}/reviews`)
      .then((r) => r.json())
      .then((d) => { setReviews(d.reviews ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  // Lock body scroll when modal is open
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
    if (rating === 0) return setError('Please select a star rating.');

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: name, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }

      setReviews((prev) => [data.review, ...prev]);
      const newCount = totalCount + 1;
      setAvgRating(Math.round(((avgRating * totalCount + rating) / newCount) * 10) / 10);
      setTotalCount(newCount);
      setSubmitted(true);
      setName(''); setRating(0); setComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => { setShowModal(false); setSubmitted(false); setError(''); };

  return (
    <section className="py-10 bg-white border-t border-brand-silver/40">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-brand-black">Customer Reviews</h2>
            {totalCount > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <Stars rating={avgRating} size="sm" />
                <span className="text-sm font-semibold text-brand-black">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-brand-gray">· {totalCount} review{totalCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-black text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-red transition-colors duration-200 shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            Write a Review
          </button>
        </div>

        {/* Main Content: Summary + Reviews */}
        <div className="flex flex-col sm:flex-row gap-5">

          {/* Rating Summary sidebar */}
          {totalCount > 0 && (
            <div className="sm:w-44 shrink-0 bg-brand-silver-light rounded-2xl p-4 flex sm:flex-col items-center sm:items-stretch gap-4 sm:gap-3 self-start">
              <div className="text-center shrink-0">
                <p className="text-4xl font-black text-brand-black leading-none">{avgRating.toFixed(1)}</p>
                <Stars rating={avgRating} size="sm" />
                <p className="text-xs text-brand-gray mt-1">{totalCount} review{totalCount !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex flex-col gap-1 flex-1 sm:flex-none">
                {distribution.map((d) => (
                  <RatingBar key={d.label} label={d.label} count={d.count} total={totalCount} />
                ))}
              </div>
            </div>
          )}

          {/* Reviews list — fixed height, internal scroll */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-20" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-brand-gray">
                <Star className="w-10 h-10 stroke-gray-200 mb-3" />
                <p className="font-semibold text-brand-black">No reviews yet</p>
                <p className="text-sm mt-1">Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(showAll ? reviews : reviews.slice(0, INITIAL_SHOW)).map((review) => (
                  <div
                    key={review.id}
                    className="bg-brand-silver-light rounded-xl p-4 border border-brand-silver/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-brand-red" />
                        </div>
                        <div>
                          <p className="font-semibold text-brand-black text-sm leading-tight">{review.customer_name}</p>
                          <p className="text-xs text-brand-gray">
                            {new Date(review.created_at).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <Stars rating={review.rating} size="sm" />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-brand-gray leading-relaxed mt-2 ml-10">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
                {reviews.length > INITIAL_SHOW && (
                  <button
                    onClick={() => setShowAll((v) => !v)}
                    className="text-sm font-semibold text-brand-red hover:underline self-start mt-1"
                  >
                    {showAll ? 'Show less' : `Show all ${reviews.length} reviews`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Write a Review Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-brand-black">Write a Review</h3>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-silver transition-colors">
                <X className="w-4 h-4 text-brand-gray" />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
                <p className="font-bold text-brand-black text-lg">Thank you!</p>
                <p className="text-sm text-brand-gray">Your review has been submitted.</p>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-sm text-brand-red underline"
                  >
                    Write another
                  </button>
                  <button
                    onClick={closeModal}
                    className="text-sm text-brand-gray underline"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Star picker */}
                <div>
                  <label className="text-sm font-medium text-brand-gray mb-1.5 block">
                    Your Rating <span className="text-brand-red">*</span>
                  </label>
                  <Stars rating={rating} size="lg" interactive onRate={setRating} />
                </div>

                {/* Name */}
                <div>
                  <label className="text-sm font-medium text-brand-gray mb-1.5 block">
                    Your Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ahmad"
                    className="w-full border border-brand-silver rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="text-sm font-medium text-brand-gray mb-1.5 block">
                    Comment <span className="text-brand-gray/60">(optional)</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={3}
                    className="w-full border border-brand-silver rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 bg-brand-red text-white py-2.5 rounded-lg font-semibold hover:bg-brand-red-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
