import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// GET /api/products/[slug]/reviews
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: product } = await supabaseServer
    .from('products')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!product) return NextResponse.json({ reviews: [] });

  const { data: reviews } = await supabaseServer
    .from('reviews')
    .select('id, customer_name, rating, comment, created_at')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ reviews: reviews ?? [] });
}

// POST /api/products/[slug]/reviews
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();
  const { customerName, customerEmail, rating, comment } = body;

  if (!customerName?.trim() || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Name and a rating (1–5) are required.' }, { status: 400 });
  }
  if (!customerEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }

  // Resolve product
  const { data: product } = await supabaseServer
    .from('products')
    .select('id, rating, review_count')
    .eq('slug', slug)
    .single();

  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

  // Insert review
  const { data: review, error } = await supabaseServer
    .from('reviews')
    .insert({
      product_id: product.id,
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim(),
      rating,
      comment: comment?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    // Unique constraint violation — same email already reviewed this product
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You have already reviewed this product.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Recompute rating from all actual reviews (avoids stale seeded values)
  const { data: allReviews } = await supabaseServer
    .from('reviews')
    .select('rating')
    .eq('product_id', product.id);

  const newCount = allReviews?.length ?? 1;
  const newRating = newCount > 0
    ? Math.round(((allReviews ?? []).reduce((sum, r) => sum + r.rating, 0) / newCount) * 10) / 10
    : rating;

  await supabaseServer
    .from('products')
    .update({ rating: newRating, review_count: newCount })
    .eq('id', product.id);

  return NextResponse.json({ review }, { status: 201 });
}
