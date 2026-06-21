import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import type { Sunglasses } from '@/types';

function mapRow(row: Record<string, unknown>): Sunglasses & { videoUrl?: string | null } {
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

export async function GET() {
  const { data, error } = await supabaseServer
    .from('sunglasses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(r => mapRow(r as Record<string, unknown>)));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, slug, description, brand, price, original_price,
      stock, gender, is_new, is_bestseller, on_sale, is_visible,
      features, specifications, variants, video_url,
    } = body;

    if (!name || !slug || !price) {
      return NextResponse.json({ error: 'name, slug, and price are required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('sunglasses')
      .insert({
        name:           String(name).trim(),
        slug:           String(slug).trim().toLowerCase(),
        description:    description ?? '',
        brand:          brand ?? 'SKMEI',
        price:          Number(price),
        original_price: original_price ? Number(original_price) : null,
        stock:          Number(stock ?? 0),
        gender:         gender || 'unisex',
        is_new:         is_new ?? false,
        is_bestseller:  is_bestseller ?? false,
        on_sale:        on_sale ?? false,
        is_visible:     is_visible ?? true,
        features:       Array.isArray(features) ? features : [],
        specifications: specifications ?? {},
        variants:       Array.isArray(variants) ? variants : [],
        video_url:      video_url || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
