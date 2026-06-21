import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const update: Record<string, unknown> = {};

    if (body.name          !== undefined) update.name          = String(body.name).trim();
    if (body.slug          !== undefined) update.slug          = String(body.slug).trim().toLowerCase();
    if (body.description   !== undefined) update.description   = body.description;
    if (body.brand         !== undefined) update.brand         = body.brand;
    if (body.price         !== undefined) update.price         = Number(body.price);
    if (body.original_price !== undefined) update.original_price = body.original_price ? Number(body.original_price) : null;
    if (body.stock         !== undefined) update.stock         = Number(body.stock);
    if (body.gender        !== undefined) update.gender        = body.gender;
    if (body.is_new        !== undefined) update.is_new        = body.is_new;
    if (body.is_bestseller !== undefined) update.is_bestseller = body.is_bestseller;
    if (body.on_sale       !== undefined) update.on_sale       = body.on_sale;
    if (body.is_visible    !== undefined) update.is_visible    = body.is_visible;
    if (body.features      !== undefined) update.features      = body.features;
    if (body.specifications !== undefined) update.specifications = body.specifications;
    if (body.variants      !== undefined) update.variants      = body.variants;
    if (body.video_url     !== undefined) update.video_url     = body.video_url || null;

    const { error } = await supabaseServer
      .from('sunglasses')
      .update(update)
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabaseServer
    .from('sunglasses')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
