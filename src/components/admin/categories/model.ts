import type { ComponentType } from 'react';
import {
  Activity,
  Award,
  Clock,
  Flame,
  Gem,
  Heart,
  Layers,
  Package,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Tag,
  Timer,
  Users,
  Watch,
  Zap,
  type LucideProps,
} from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

/** Exactly the body the old page sent to POST /api/admin/categories and PATCH /api/admin/categories/:id. */
export interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  sort_order: number;
}

export const emptyForm: CategoryForm = {
  name: '',
  slug: '',
  description: '',
  image: '',
  icon: '',
  sort_order: 0,
};

export function categoryToForm(cat: Category): CategoryForm {
  return {
    name: cat.name,
    slug: cat.slug,
    description: cat.description ?? '',
    image: cat.image ?? '',
    icon: cat.icon ?? '',
    sort_order: cat.sort_order ?? 0,
  };
}

/** Same slug rule as the old page (only applied while creating). */
export function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export type IconName =
  | 'Watch'
  | 'Timer'
  | 'Clock'
  | 'Activity'
  | 'Zap'
  | 'Gem'
  | 'Smartphone'
  | 'Heart'
  | 'Star'
  | 'Shield'
  | 'Package'
  | 'Users'
  | 'Tag'
  | 'Sun'
  | 'Flame'
  | 'Award'
  | 'Layers'
  | 'Sparkles';

/** Nav icons the store understands (same list and order as before). */
export const ICON_OPTIONS: { name: IconName; Comp: ComponentType<LucideProps> }[] = [
  { name: 'Watch', Comp: Watch },
  { name: 'Timer', Comp: Timer },
  { name: 'Clock', Comp: Clock },
  { name: 'Activity', Comp: Activity },
  { name: 'Zap', Comp: Zap },
  { name: 'Gem', Comp: Gem },
  { name: 'Smartphone', Comp: Smartphone },
  { name: 'Heart', Comp: Heart },
  { name: 'Star', Comp: Star },
  { name: 'Shield', Comp: Shield },
  { name: 'Package', Comp: Package },
  { name: 'Users', Comp: Users },
  { name: 'Tag', Comp: Tag },
  { name: 'Sun', Comp: Sun },
  { name: 'Flame', Comp: Flame },
  { name: 'Award', Comp: Award },
  { name: 'Layers', Comp: Layers },
  { name: 'Sparkles', Comp: Sparkles },
];

export function iconFor(name: string | null | undefined) {
  return ICON_OPTIONS.find((o) => o.name === name)?.Comp ?? null;
}

/** Store order: sort_order ascending (stable, like the old reorder screen). */
export function storeOrder(list: Category[]) {
  return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export async function readError(res: Response) {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return body?.error || `Request failed (HTTP ${res.status})`;
}
