import { createElement, type ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';
import { iconFor } from './model';

/** Renders a category's nav icon by name (or `fallback` when it has none). */
export function CategoryIcon({ icon, fallback = null, ...props }: Omit<LucideProps, "name"> & { icon: string | null | undefined; fallback?: ReactNode }) {
  const comp = iconFor(icon);
  return comp ? createElement(comp, props) : <>{fallback}</>;
}
