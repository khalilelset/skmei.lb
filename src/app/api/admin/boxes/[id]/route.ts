import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (body.code     !== undefined) update.code     = String(body.code).trim();
  if (body.type     !== undefined) update.type     = body.type === 'gift' ? 'gift' : 'standard';
  if (body.price    !== undefined) update.price    = Number(body.price ?? 0);
  if (body.image    !== undefined) update.image    = body.image || null;
  if ('brandId' in body)           update.brand_id = body.brandId || null;

  const { data, error } = await supabaseServer
    .from('boxes')
    .update(update)
    .eq('id', id)
    .select('id, code, type, price, image, brand_id, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabaseServer.from('boxes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
