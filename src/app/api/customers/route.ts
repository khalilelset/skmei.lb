import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// POST /api/customers — create or update customer by phone (upsert)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { first_name, last_name, email, phone, addresses } = body;

    // Normalize: strip +961 / 00961 prefix if someone pastes a full number
    const normalizedPhone = String(phone ?? '').trim().replace(/^(\+961|00961)/, '');

    if (!normalizedPhone || !first_name?.trim()) {
      return NextResponse.json(
        { error: 'phone and first_name are required' },
        { status: 400 }
      );
    }

    // Check if customer already exists by phone
    const { data: existing } = await supabaseServer
      .from('customers')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existing) {
      // Update existing customer
      const { error } = await supabaseServer
        .from('customers')
        .update({
          first_name: first_name.trim(),
          last_name: (last_name ?? '').trim(),
          email: email || null,
          addresses: addresses ?? [],
        })
        .eq('id', existing.id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, customerId: existing.id });
    }

    // Insert new customer
    const { data, error } = await supabaseServer
      .from('customers')
      .insert({
        first_name: first_name.trim(),
        last_name: (last_name ?? '').trim(),
        email: email || null,
        phone: normalizedPhone,
        addresses: addresses ?? [],
      })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, customerId: data.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
