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
    .select('id, first_name, last_name, email, phone, addresses, created_at')
    .eq('phone', phone)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ found: false });

  return NextResponse.json({ found: true, customer: data });
}
