import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { phone } = await params;

  // Delete all orders for this phone
  await supabaseServer.from('orders').delete().eq('customer_phone', phone);

  // Delete account record if exists
  const { error } = await supabaseServer.from('customers').delete().eq('phone', phone);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
