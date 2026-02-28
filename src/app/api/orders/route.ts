import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      customer_name,
      customer_phone,
      customer_email,
      items,
      subtotal,
      shipping,
      discount,
      coupon_code,
      total,
      address,
      notes,
      status = 'pending',
    } = body;

    if (!customer_name || !customer_phone || !items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, customer_phone, items' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('orders')
      .insert({
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        items,
        subtotal: Number(subtotal),
        shipping: Number(shipping),
        discount: Number(discount ?? 0),
        coupon_code: coupon_code || null,
        total: Number(total),
        address,
        notes: notes || null,
        status,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId: data.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
