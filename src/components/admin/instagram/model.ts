import { Clapperboard, GalleryHorizontalEnd, Image as ImageIcon, type LucideIcon } from 'lucide-react';

export type PostType = 'image' | 'carousel' | 'video';

/** One post exactly as GET /api/admin/instagram returns it. */
export interface InstagramPost {
  id: string;
  type: PostType;
  images: string[];
  videoSrc?: string | null;
  poster?: string | null;
  postUrl: string;
  likes: number;
  comments: number;
  caption: string;
  sort_order: number;
  createdAt: string;
}

export const POST_TYPES: PostType[] = ['image', 'carousel', 'video'];

export const TYPE_META: Record<PostType, { label: string; icon: LucideIcon; tile: string; tone: 'blue' | 'violet' | 'red' }> = {
  image: { label: 'Image', icon: ImageIcon, tile: 'bg-[#EAF1FF] text-[#1D4ED8]', tone: 'blue' },
  carousel: { label: 'Carousel', icon: GalleryHorizontalEnd, tile: 'bg-[#F3EDFF] text-[#6D28D9]', tone: 'violet' },
  video: { label: 'Video', icon: Clapperboard, tile: 'bg-adm-accent-soft text-adm-accent-hover', tone: 'red' },
};

export function matchesSearch(p: InstagramPost, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (p.caption ?? '').toLowerCase().includes(q) || (p.postUrl ?? '').toLowerCase().includes(q);
}
