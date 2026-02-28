import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

function mapProduct(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    images: row.images,
    category: row.category,
    brand: row.brand,
    sku: row.sku,
    stock: row.stock,
    features: row.features,
    specifications: row.specifications,
    isNew: row.is_new,
    isFeatured: row.is_featured,
    gender: row.gender,
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
      original_price: body.originalPrice ? Number(body.originalPrice) : null,
      images: body.images ?? [],
      category: body.category,
      brand: body.brand ?? 'SKMEI',
      sku: body.sku ?? null,
      stock: Number(body.stock ?? 0),
      features: body.features ?? [],
      specifications: body.specifications ?? {},
      is_new: body.isNew ?? false,
      is_featured: body.isFeatured ?? false,
      gender: body.gender ?? null,
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
