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

  // Fetch brand warranty info
  let brandWarranty: { value: number; unit: string } | null = null;
  if (data.brand) {
    const { data: brandRow } = await supabaseServer
      .from('brands')
      .select('warranty_value, warranty_unit')
      .eq('name', data.brand)
      .single();
    if (brandRow?.warranty_value != null && brandRow?.warranty_unit) {
      brandWarranty = { value: brandRow.warranty_value, unit: brandRow.warranty_unit };
    }
  }

  // Extract model number from product name (e.g. "9196" from "skmei 9196BKBK")
  const modelMatch = (data.name as string).match(/\b(\d{3,5})\b/);
  const modelNumber = modelMatch ? modelMatch[1] : null;

  // Fetch by same category (pool to pick from)
  const { data: byCat } = await supabaseServer
    .from('products')
    .select('*')
    .eq('category', data.category)
    .neq('slug', slug)
    .limit(20);

  // Fetch by model number if found
  let byModel: typeof byCat = [];
  if (modelNumber) {
    const { data: modelRows } = await supabaseServer
      .from('products')
      .select('*')
      .ilike('name', `%${modelNumber}%`)
      .neq('slug', slug)
      .limit(10);
    byModel = modelRows ?? [];
  }

  // Merge all candidates, deduplicate by id
  const seen = new Set<string>();
  const allCandidates: typeof byCat = [];
  for (const p of [...(byModel ?? []), ...(byCat ?? [])]) {
    if (!seen.has(p.id as string)) {
      seen.add(p.id as string);
      allCandidates.push(p);
    }
  }

  // Score each candidate
  const currentColors: string[] = ((data.colors ?? []) as { name: string; hex: string }[]).map((c) => c.name);
  const scored = allCandidates.map((p) => {
    let score = 0;
    // Same model number — highest priority
    if (modelNumber && (p.name as string).includes(modelNumber)) score += 10;
    // Shared colors
    const pColors: string[] = ((p.colors ?? []) as { name: string; hex: string }[]).map((c) => c.name);
    const sharedColors = pColors.filter((c) => currentColors.includes(c)).length;
    score += sharedColors * 3;
    // Same category
    if (p.category === data.category) score += 1;
    return { p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top6 = scored.slice(0, 6).map((s) => s.p);

  const relatedWithReviews = await Promise.all(
    top6.map(async (p) => {
      const { data: rr } = await supabaseServer
        .from('reviews').select('rating').eq('product_id', p.id);
      return mapProduct(p as Record<string, unknown>, rr ?? []);
    })
  );

  return NextResponse.json({
    product: mapProduct(data as Record<string, unknown>, reviewRows ?? []),
    related: relatedWithReviews,
    brandWarranty,
  });
}
