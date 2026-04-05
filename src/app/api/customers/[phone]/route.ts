import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// GET /api/customers/[phone] — look up customer by phone number
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { phone: rawPhone } = await params;
  const phone = decodeURIComponent(rawPhone).trim();

  if (!phone) {
    return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from('customers')
    .select('id, first_name, last_name, phone, addresses')
    .eq('phone', phone)
    .maybeSingle();

  if (error) return NextResponse.json({ found: false });
  if (!data) return NextResponse.json({ found: false });

  // Return only what the checkout form needs — no email, no created_at
  return NextResponse.json({
    found: true,
    customer: {
      id:         data.id,
      first_name: data.first_name,
      last_name:  data.last_name,
      phone:      data.phone,
      addresses:  data.addresses ?? [],
    },
  });
}
