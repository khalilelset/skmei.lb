import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

function mapProduct(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    costPrice: row.cost_price != null ? Number(row.cost_price) : undefined,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    images: Array.isArray(row.images)
      ? (row.images as unknown[]).filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
      : [],
    category: row.category,
    brand: row.brand,
    sku: row.sku,
    stock: row.stock,
    features: row.features,
    specifications: row.specifications,
    videoUrl: row.video_url ?? null,
    priceTiers: Array.isArray(row.price_tiers) ? row.price_tiers : null,
    isNew: row.is_new,
    onSale: row.on_sale,
    isBestseller: row.is_bestseller,
    isCouple: row.is_couple ?? false,
    gender: row.gender,
    colors: row.colors ?? [],
    rating: Number(row.rating),
    reviewCount: row.review_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const { data, error } = await supabaseServer
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map(mapProduct));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const row = {
      name: body.name,
      slug: body.slug,
      description: body.description ?? '',
      price: Number(body.price),
      cost_price: body.costPrice != null && body.costPrice !== '' ? Number(body.costPrice) : null,
      original_price: body.originalPrice ? Number(body.originalPrice) : null,
      images: body.images ?? [],
      category: body.category,
      brand: body.brand ?? 'SKMEI',
      sku: body.sku ?? null,
      stock: Number(body.stock ?? 0),
      features: body.features ?? [],
      specifications: body.specifications ?? {},
      video_url: body.videoUrl ?? null,
      is_new: body.isNew ?? false,
      on_sale: body.onSale ?? false,
      is_bestseller: body.isBestseller ?? false,
      is_couple: body.isCouple ?? false,
      gender: body.gender ?? null,
      colors: body.colors ?? [],
      price_tiers: body.priceTiers ?? null,
      rating: Number(body.rating ?? 0),
      review_count: Number(body.reviewCount ?? 0),
    };

    const { data, error } = await supabaseServer
      .from('products')
      .insert(row)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapProduct(data as Record<string, unknown>), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
