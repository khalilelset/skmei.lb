import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();

    // Build update object mapping camelCase → snake_case
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.slug !== undefined) update.slug = body.slug;
    if (body.description !== undefined) update.description = body.description;
    if (body.price !== undefined) update.price = Number(body.price);
    if (body.originalPrice !== undefined) update.original_price = body.originalPrice ? Number(body.originalPrice) : null;
    if (body.images !== undefined) update.images = body.images;
    if (body.category !== undefined) update.category = body.category;
    if (body.brand !== undefined) update.brand = body.brand;
    if (body.sku !== undefined) update.sku = body.sku;
    if (body.stock !== undefined) update.stock = Number(body.stock);
    if (body.features !== undefined) update.features = body.features;
    if (body.specifications !== undefined) update.specifications = body.specifications;
    if (body.isNew !== undefined) update.is_new = body.isNew;
    if (body.isFeatured !== undefined) update.is_featured = body.isFeatured;
    if (body.gender !== undefined) update.gender = body.gender ?? null;
    if (body.rating !== undefined) update.rating = Number(body.rating);
    if (body.reviewCount !== undefined) update.review_count = Number(body.reviewCount);
    update.updated_at = new Date().toISOString();

    const { error } = await supabaseServer
      .from('products')
      .update(update)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
