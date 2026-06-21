import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import SunglassesDetailClient from './SunglassesDetailClient';
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

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ color?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const { data } = await supabaseServer
    .from('sunglasses')
    .select('name, description')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();
  if (!data) return { title: 'Sunglasses — SKMEI.LB' };
  return {
    title: `${data.name} — SKMEI.LB`,
    description: data.description || `${data.name} sunglasses at SKMEI.LB`,
  };
}

export default async function SunglassesDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { color: initialColorId } = await searchParams;

  const { data, error } = await supabaseServer
    .from('sunglasses')
    .select('*')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  if (error || !data) notFound();

  const sunglasses = mapRow(data as Record<string, unknown>);

  // Fetch related (same brand or gender, max 4)
  const { data: relatedRows } = await supabaseServer
    .from('sunglasses')
    .select('*')
    .eq('is_visible', true)
    .neq('id', sunglasses.id)
    .or(`brand.eq.${sunglasses.brand},gender.eq.${sunglasses.gender ?? 'unisex'}`)
    .limit(4);

  const related = (relatedRows ?? []).map(r => mapRow(r as Record<string, unknown>));

  return (
    <SunglassesDetailClient
      sunglasses={sunglasses}
      related={related}
      initialColorId={initialColorId}
    />
  );
}
