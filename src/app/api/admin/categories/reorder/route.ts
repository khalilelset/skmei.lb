import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json() as { items: { id: string; sortOrder: number }[] };

    const { error } = await supabaseServer
      .from('categories')
      .upsert(
        items.map(({ id, sortOrder }) => ({ id, sort_order: sortOrder })),
        { onConflict: 'id' }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Bust ISR cache so the website reflects the new order immediately
    revalidatePath('/');
    revalidatePath('/store/products');

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
