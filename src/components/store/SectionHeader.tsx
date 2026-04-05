'use client';

import { motion } from 'framer-motion';

interface SectionHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  light?: boolean; // true = white text (for dark backgrounds)
}

const ease = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

export default function SectionHeader({
  label,
  title,
  subtitle,
  align = 'center',
  light = false,
}: SectionHeaderProps) {
  const isCenter = align === 'center';

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className={isCenter ? 'text-center' : 'text-left'}
    >
      <motion.p
        variants={fadeUp}
        className="text-brand-red text-[10px] font-bold uppercase tracking-[0.3em] mb-3"
      >
        {label}
      </motion.p>

      <motion.h2
        variants={fadeUp}
        className={`text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight mb-4 text-white`}
      >
        {title}
      </motion.h2>

      <motion.div
        variants={fadeUp}
        className={`h-0.5 w-12 bg-brand-red mb-4 ${isCenter ? 'mx-auto' : ''}`}
      />

      {subtitle && (
        <motion.p
          variants={fadeUp}
          className={`text-sm sm:text-base leading-relaxed max-w-md ${
            isCenter ? 'mx-auto' : ''
          } text-white/50`}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
