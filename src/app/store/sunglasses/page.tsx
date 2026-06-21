import { supabaseServer } from '@/lib/supabase/server';
import SunglassesCatalogClient from './SunglassesCatalogClient';
import type { Sunglasses } from '@/types';

function mapRow(row: Record<string, unknown>): Sunglasses {
  return {
    id:            row.id as string,
    name:          row.name as string,
    slug:          row.slug as string,
    description:   (row.description as string) ?? '',
    brand:         (row.brand as string) ?? '',
    price:         Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    stock:         Number(row.stock ?? 0),
    gender:        row.gender as Sunglasses['gender'],
    isNew:         row.is_new as boolean,
    isBestseller:  row.is_bestseller as boolean,
    onSale:        row.on_sale as boolean,
    isVisible:     row.is_visible as boolean,
    features:      Array.isArray(row.features) ? row.features as string[] : [],
    specifications: (row.specifications as Record<string, string>) ?? {},
    variants:      Array.isArray(row.variants) ? row.variants as Sunglasses['variants'] : [],
    rating:        Number(row.rating ?? 0),
    reviewCount:   Number(row.review_count ?? 0),
    createdAt:     row.created_at as string,
    updatedAt:     row.updated_at as string,
  };
}

export const metadata = {
  title: 'Sunglasses — SKMEI.LB',
  description: 'Browse our collection of premium sunglasses.',
};

export default async function SunglassesPage() {
  const { data } = await supabaseServer
    .from('sunglasses')
    .select('*')
    .eq('is_visible', true)
    .order('created_at', { ascending: false });

  const sunglasses = (data ?? []).map(r => mapRow(r as Record<string, unknown>));

  return <SunglassesCatalogClient initialSunglasses={sunglasses} />;
}
