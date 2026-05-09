import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  // Try with icon column first; fall back if it doesn't exist yet
  let { data, error } = await supabaseServer
    .from('categories')
    .select('id, name, slug, image, icon')
    .order('sort_order', { ascending: true });

  if (error) {
    const fallback = await supabaseServer
      .from('categories')
      .select('id, name, slug, image')
      .order('sort_order', { ascending: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data = (fallback.data as any) ?? null;
    error = fallback.error;
  }

  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data ?? []);
}
