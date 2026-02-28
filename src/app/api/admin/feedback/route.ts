import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const { data, error } = await supabaseServer
    .from('feedback_images')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.image) return NextResponse.json({ error: 'image is required' }, { status: 400 });

    const { data, error } = await supabaseServer
      .from('feedback_images')
      .insert({ image: body.image, alt: body.alt ?? '', sort_order: body.sort_order ?? 0 })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
