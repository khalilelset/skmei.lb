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
    .eq('is_visible', true)
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

  // Derive base slug by stripping trailing color code from the last segment.
  // e.g. "sk-1654bk" → "sk-1654", "sk-1654busi" → "sk-1654"
  // Only strips when the last segment contains both digits and trailing letters.
  function getBaseSlug(s: string): string {
    const parts = s.split('-');
    const last = parts[parts.length - 1];
    if (/\d/.test(last) && /[a-z]$/.test(last)) {
      const stripped = last.replace(/[a-z]+$/, '');
      return [...parts.slice(0, -1), stripped].join('-');
    }
    return s;
  }

  const currentBase = getBaseSlug(slug);
  const currentColors: string[] = ((data.colors ?? []) as { name: string }[]).map((c) => c.name);

  // Fetch all visible products except this one (generous pool)
  const { data: pool } = await supabaseServer
    .from('products')
    .select('*')
    .eq('is_visible', true)
    .neq('id', data.id)
    .limit(300);

  const scored = (pool ?? []).map((p) => {
    let score = 0;
    // 1st priority: same product, different color (shared base slug)
    if (getBaseSlug(p.slug as string) === currentBase) score += 100;
    // 2nd priority: same gender
    if (data.gender && p.gender === data.gender) score += 10;
    // 3rd priority: same brand
    if (data.brand && p.brand === data.brand) score += 7;
    // 4th priority: same category
    if (p.category === data.category) score += 5;
    // 4th priority: same label (new / bestseller / sale)
    if (
      (data.is_new && p.is_new) ||
      (data.is_bestseller && p.is_bestseller) ||
      (data.on_sale && p.on_sale)
    ) score += 3;
    // 5th priority: overlapping colors
    const pColors: string[] = ((p.colors ?? []) as { name: string }[]).map((c) => c.name);
    score += currentColors.filter((c) => pColors.includes(c)).length;
    return { p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top4 = scored.slice(0, 4).map((s) => s.p);

  const relatedWithReviews = await Promise.all(
    top4.map(async (p) => {
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
