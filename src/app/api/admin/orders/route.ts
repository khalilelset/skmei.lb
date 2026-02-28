import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

function mapOrder(row: Record<string, unknown>) {
  const nameParts = String(row.customer_name ?? '').split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const address = (row.address as Record<string, string>) ?? {};

  return {
    id: row.id,
    orderNumber: `SK-${String(row.id).slice(0, 6).toUpperCase()}`,
    customer: {
      id: String(row.id),
      firstName,
      lastName,
      email: row.customer_email ?? '',
      phone: row.customer_phone ?? '',
      addresses: [],
      createdAt: row.created_at,
    },
    items: ((row.items as Record<string, unknown>[]) ?? []).map((item) => ({
      productName: String(item.name ?? item.productName ?? ''),
      image: String(item.image ?? ''),
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 1),
    })),
    status: row.status,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    tax: 0,
    discount: Number(row.discount ?? 0),
    coupon_code: row.coupon_code ?? null,
    total: Number(row.total),
    shippingAddress: {
      id: String(row.id),
      firstName,
      lastName,
      street: address.street ?? address.full ?? '',
      city: address.city ?? '',
      state: address.city ?? '',
      country: 'Lebanon',
      postalCode: '',
      phone: String(row.customer_phone ?? ''),
      isDefault: true,
    },
    paymentMethod: 'Cash on Delivery',
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };
}

export async function GET() {
  const { data, error } = await supabaseServer
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map(mapOrder));
}
