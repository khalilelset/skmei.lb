import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { sendOrderEmails } from '@/lib/email';

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

    // ── 1. Find or create customer by phone ──────────────────────────────
    // Normalize phone: strip +961 / 00961 prefix so DB always stores local number
    const normalizedPhone = String(customer_phone ?? '').trim().replace(/^(\+961|00961)/, '');

    const nameParts = String(customer_name).trim().split(/\s+/);
    const firstName = nameParts[0] ?? customer_name;
    const lastName  = nameParts.slice(1).join(' ') || '';

    let customerId: string | null = null;

    const { data: existingCustomer } = await supabaseServer
      .from('customers')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update email if provided and not already set
      if (customer_email) {
        await supabaseServer
          .from('customers')
          .update({ email: customer_email })
          .eq('id', customerId)
          .is('email', null);
      }
    } else {
      const { data: newCustomer } = await supabaseServer
        .from('customers')
        .insert({
          first_name: firstName,
          last_name:  lastName,
          phone:      normalizedPhone,
          email:      customer_email || null,
          addresses:  address ? [{ ...address, isDefault: true }] : [],
        })
        .select('id')
        .single();
      customerId = newCustomer?.id ?? null;
    }

    // ── 2. Insert order ──────────────────────────────────────────────────
    const { data: order, error: orderError } = await supabaseServer
      .from('orders')
      .insert({
        customer_id:    customerId,
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        items,
        subtotal:   Number(subtotal),
        shipping:   Number(shipping),
        discount:   Number(discount ?? 0),
        coupon_code: coupon_code || null,
        total:      Number(total),
        address,
        notes:      notes || null,
        status,
      })
      .select('id, order_number')
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // ── 3. Insert order_items (one row per product) ──────────────────────
    const orderItems = (items as Record<string, unknown>[]).map((item) => ({
      order_id:      order.id,
      product_id:    (item.id as string) || null,
      product_name:  String(item.name ?? item.productName ?? ''),
      product_image: String(item.image ?? ''),
      price:         Number(item.price ?? 0),
      quantity:      Number(item.quantity ?? 1),
    }));

    await supabaseServer.from('order_items').insert(orderItems);

    // ── 4. Send emails (non-blocking — failures don't affect the response) ──
    sendOrderEmails({
      orderId:       order.id,
      orderNumber:   order.order_number,
      customerName:  customer_name,
      customerEmail: customer_email || null,
      customerPhone: normalizedPhone,
      items: (items as Record<string, unknown>[]).map((item) => ({
        name:     String(item.name ?? item.productName ?? ''),
        price:    Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
        image:    item.image ? String(item.image) : null,
      })),
      subtotal:  Number(subtotal),
      shipping:  Number(shipping),
      discount:  Number(discount ?? 0),
      couponCode: coupon_code || null,
      total:     Number(total),
      address:   address ?? null,
      notes:     notes || null,
    }).catch((err) => console.error('[email] sendOrderEmails threw:', err));

    return NextResponse.json(
      { success: true, orderId: order.id, orderNumber: order.order_number },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
