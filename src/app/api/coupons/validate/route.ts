import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('coupons')
      .select('code, discount, active, expires_at, max_discount, apply_on_sale, brands')
      .eq('code', code.trim().toUpperCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Invalid coupon code. Please try again.' });
    }

    if (!data.active) {
      return NextResponse.json({ valid: false, error: 'This coupon is no longer active.' });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This coupon has expired.' });
    }

    return NextResponse.json({
      valid: true,
      code: data.code,
      discount: data.discount,
      maxDiscount: data.max_discount ?? null,
      applyOnSale: data.apply_on_sale ?? true,
      brands: Array.isArray(data.brands) && data.brands.length > 0 ? data.brands : null,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
