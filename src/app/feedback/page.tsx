import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Star } from 'lucide-react';
import { feedbackImages } from '@/data/feedback';

export const metadata: Metadata = {
  title: 'Customer Feedback',
  description: 'Real reviews and feedback from our happy SKMEI.LB customers.',
};

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-brand-silver-light">

      {/* Page Header */}
      <div className="bg-brand-black py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-medium mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <p className="text-brand-red text-xs font-bold uppercase tracking-widest mb-3">
            Real Reviews
          </p>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-4">
            Customer Feedback
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-brand-red stroke-brand-red" />
              ))}
            </div>
            <span className="text-sm font-semibold text-white">5.0</span>
            <span className="text-sm text-white/50">· {feedbackImages.length}+ Happy Customers</span>
          </div>
        </div>
      </div>

      {/* Feedback Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {feedbackImages.map((item) => (
            <div
              key={item.id}
              className="relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white"
              style={{ aspectRatio: '16/9' }}
            >
              <Image
                src={item.image}
                alt={item.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
