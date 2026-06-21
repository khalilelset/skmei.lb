import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
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
    videoUrl:      (row.video_url as string) ?? null,
    rating:        Number(row.rating ?? 0),
    reviewCount:   Number(row.review_count ?? 0),
    createdAt:     row.created_at as string,
    updatedAt:     row.updated_at as string,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data, error } = await supabaseServer
    .from('sunglasses')
    .select('*')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Fetch related sunglasses (same brand or gender, max 4)
  const row = data as Record<string, unknown>;
  const { data: relatedRows } = await supabaseServer
    .from('sunglasses')
    .select('*')
    .eq('is_visible', true)
    .neq('id', row.id as string)
    .or(`brand.eq.${row.brand},gender.eq.${row.gender}`)
    .limit(4);

  return NextResponse.json({
    sunglasses: mapRow(row),
    related: (relatedRows ?? []).map(r => mapRow(r as Record<string, unknown>)),
  });
}
