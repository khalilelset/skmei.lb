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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gender  = searchParams.get('gender');
  const filter  = searchParams.get('filter');
  const brand   = searchParams.get('brand');
  const search  = searchParams.get('search');

  let query = supabaseServer
    .from('sunglasses')
    .select('*')
    .eq('is_visible', true);

  if (gender) query = query.eq('gender', gender);
  if (brand)  query = query.eq('brand', brand);
  if (filter === 'new')        query = query.eq('is_new', true);
  if (filter === 'bestseller') query = query.eq('is_bestseller', true);
  if (filter === 'sale')       query = query.eq('on_sale', true);
  if (search)  query = query.ilike('name', `%${search}%`);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(r => mapRow(r as Record<string, unknown>)));
}
