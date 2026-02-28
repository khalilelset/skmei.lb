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
  const { customerName, rating, comment } = body;

  if (!customerName?.trim() || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Name and a rating (1–5) are required.' }, { status: 400 });
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
      rating,
      comment: comment?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculate average rating on the product
  const prevCount = product.review_count ?? 0;
  const prevRating = product.rating ?? 0;
  const newCount = prevCount + 1;
  const newRating = Math.round(((prevRating * prevCount + rating) / newCount) * 10) / 10;

  await supabaseServer
    .from('products')
    .update({ rating: newRating, review_count: newCount })
    .eq('id', product.id);

  return NextResponse.json({ review }, { status: 201 });
}
