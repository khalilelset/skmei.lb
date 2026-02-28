import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const { data, error } = await supabaseServer
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.slug) return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });

    const { data, error } = await supabaseServer
      .from('categories')
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description ?? '',
        image: body.image ?? '',
        product_count: body.product_count ?? 0,
        sort_order: body.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
