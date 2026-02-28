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
    rating: Number(row.rating),
    reviewCount: row.review_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data, error } = await supabaseServer
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // Fetch related products (same category, exclude this one)
  const { data: related } = await supabaseServer
    .from('products')
    .select('*')
    .eq('category', data.category)
    .neq('slug', slug)
    .limit(4);

  return NextResponse.json({
    product: mapProduct(data),
    related: (related ?? []).map(mapProduct),
  });
}
