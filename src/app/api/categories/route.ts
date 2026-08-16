import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  // 1. Try with icon + sort_order
  let { data, error } = await supabaseServer
    .from('categories')
    .select('id, name, slug, image, icon')
    .order('sort_order', { ascending: true });

  // 2. No icon column — try without it but still sort by sort_order
  if (error) {
    const r2 = await supabaseServer
      .from('categories')
      .select('id, name, slug, image')
      .order('sort_order', { ascending: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data = (r2.data as any) ?? null;
    error = r2.error;
  }

  // 3. No sort_order column either — fall back to alphabetical
  if (error) {
    const r3 = await supabaseServer
      .from('categories')
      .select('id, name, slug, image')
      .order('name', { ascending: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data = (r3.data as any) ?? null;
    error = r3.error;
  }

  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data ?? []);
}
