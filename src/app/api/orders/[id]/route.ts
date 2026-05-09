import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseServer
    .from('orders')
    .select('id, order_number, customer_name, customer_phone, customer_email, items, subtotal, shipping, discount, coupon_code, total, address, notes, status, created_at, payment_method')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Derive warranty from the first item's product brand
  let warrantyLabel: string | null = null;
  try {
    const firstItem = ((data.items ?? []) as Record<string, unknown>[])[0];
    const productId = firstItem?.id as string | undefined;
    if (productId) {
      const { data: product } = await supabaseServer
        .from('products')
        .select('brand')
        .eq('id', productId)
        .single();
      if (product?.brand) {
        const { data: brand } = await supabaseServer
          .from('brands')
          .select('warranty_value, warranty_unit')
          .eq('name', product.brand)
          .single();
        if (brand?.warranty_value && brand?.warranty_unit) {
          warrantyLabel = `${brand.warranty_value} ${brand.warranty_unit} included`;
        }
      }
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({ order: { ...data, warranty_label: warrantyLabel } });
}
