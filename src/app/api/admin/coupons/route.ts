import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const { data, error } = await supabaseServer
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  try {
    const { code, discount, expires_at, max_discount, apply_on_sale, brands } = await req.json();

    if (!code || !discount) {
      return NextResponse.json({ error: 'code and discount are required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('coupons')
      .insert({
        code: code.trim().toUpperCase(),
        discount: Number(discount),
        active: true,
        expires_at: expires_at || null,
        max_discount: max_discount != null && max_discount !== '' ? Number(max_discount) : null,
        apply_on_sale: apply_on_sale ?? true,
        brands: Array.isArray(brands) && brands.length > 0 ? brands : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
