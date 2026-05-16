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
    if (body.active !== undefined) update.active = body.active;
    if (body.discount !== undefined) update.discount = Number(body.discount);
    if (body.code !== undefined) update.code = body.code.trim().toUpperCase();
    if (body.expires_at !== undefined) update.expires_at = body.expires_at || null;
    if (body.max_discount !== undefined) update.max_discount = body.max_discount != null && body.max_discount !== '' ? Number(body.max_discount) : null;
    if (body.apply_on_sale !== undefined) update.apply_on_sale = body.apply_on_sale;

    const { error } = await supabaseServer
      .from('coupons')
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseServer
    .from('coupons')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
