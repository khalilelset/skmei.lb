import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// GET /api/admin/reviews — all reviews with product info
export async function GET() {
  const { data, error } = await supabaseServer
    .from('reviews')
    .select('id, customer_name, rating, comment, created_at, products:product_id(id, name, slug)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] });
}
