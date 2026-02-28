import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { products } from '@/data/products';

export async function GET() {
  // Check if products already exist
  const { count } = await supabaseServer
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    return NextResponse.json({ message: `Products already seeded (${count} found). No changes made.` });
  }

  const rows = products.map((p) => ({
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    original_price: p.originalPrice ?? null,
    images: p.images,
    category: p.category,
    brand: p.brand,
    sku: p.sku,
    stock: p.stock,
    features: p.features,
    specifications: p.specifications,
    is_new: p.isNew ?? false,
    is_featured: p.isFeatured ?? false,
    rating: p.rating,
    review_count: p.reviewCount,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }));

  const { error } = await supabaseServer.from('products').insert(rows);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `Seeded ${rows.length} products successfully.` });
}
