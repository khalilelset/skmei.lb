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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const filter = searchParams.get('filter');

  let query = supabaseServer.from('products').select('*');

  if (category) query = query.eq('category', category);
  if (filter === 'featured') query = query.eq('is_featured', true);
  if (filter === 'new') query = query.eq('is_new', true);
  if (filter === 'sale') query = query.not('original_price', 'is', null);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data.map(mapProduct));
}
