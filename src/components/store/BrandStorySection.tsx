'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check } from 'lucide-react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const items = [
  {
    title: 'Official Authorized Dealer',
    desc: 'Licensed by SKMEI International',
  },
  {
    title: 'Wholesale & Retail',
    desc: 'Competitive prices for both individual and bulk orders',
  },
  {
    title: 'Local Support',
    desc: 'Online store with delivery to all Lebanon',
  },
];

export default function BrandStorySection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-12 sm:py-16" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 items-center">

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              className="text-2xl sm:text-3xl font-bold text-brand-black mb-4"
            >
              Why Choose{' '}
              <span className="text-brand-red">SKMEI.LB</span>?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
              className="text-sm sm:text-base text-brand-gray mb-6 leading-relaxed"
            >
              As the authorized SKMEI dealer in Lebanon, we bring you the finest
              collection of affordable luxury timepieces. Each watch in our
              collection is carefully selected and comes with official warranty
              and authenticity guarantee.
            </motion.p>

            <ul className="space-y-4 mb-6">
              {items.map((item, i) => (
                <motion.li
                  key={item.title}
                  initial={{ opacity: 0, x: -24 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.45, ease: 'easeOut', delay: 0.3 + i * 0.12 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-6 h-6 bg-brand-red/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-brand-red" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-black">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-brand-gray">{item.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.7 }}
            >
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-brand-red font-semibold hover:text-brand-red-dark transition-colors"
              >
                Learn more about us
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Certificate Image */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl"
          >
            <Image
              src="/images/certificate/cerificate.jpg"
              alt="SKMEI.LB Official Dealer Certificate"
              width={800}
              height={600}
              className="w-full h-auto object-cover"
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
