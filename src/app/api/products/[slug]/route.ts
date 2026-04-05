import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

function mapProduct(row: Record<string, unknown>, reviews: { rating: number }[] = []) {
  const reviewCount = reviews.length;
  const rating = reviewCount > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
    : 0;
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
    videoUrl: row.video_url ?? null,
    isNew: row.is_new,
    isFeatured: row.is_featured,
    gender: row.gender,
    colors: row.colors ?? [],
    rating,
    reviewCount,
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
    return NextResponse.json({ error: 'Product not found', detail: error?.message }, { status: 404 });
  }

  // Fetch reviews separately
  const { data: reviewRows } = await supabaseServer
    .from('reviews')
    .select('rating')
    .eq('product_id', data.id);

  // Fetch related products
  const { data: related } = await supabaseServer
    .from('products')
    .select('*')
    .eq('category', data.category)
    .neq('slug', slug)
    .limit(4);

  const relatedWithReviews = await Promise.all(
    (related ?? []).map(async (p) => {
      const { data: rr } = await supabaseServer
        .from('reviews').select('rating').eq('product_id', p.id);
      return mapProduct(p as Record<string, unknown>, rr ?? []);
    })
  );

  return NextResponse.json({
    product: mapProduct(data as Record<string, unknown>, reviewRows ?? []),
    related: relatedWithReviews,
  });
}
