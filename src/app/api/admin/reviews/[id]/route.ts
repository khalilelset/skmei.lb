import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// DELETE /api/admin/reviews/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch review to get product_id and rating before deleting
  const { data: review } = await supabaseServer
    .from('reviews')
    .select('product_id, rating')
    .eq('id', id)
    .single();

  const { error } = await supabaseServer.from('reviews').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculate product average after deletion
  if (review) {
    const { data: remaining } = await supabaseServer
      .from('reviews')
      .select('rating')
      .eq('product_id', review.product_id);

    const count = remaining?.length ?? 0;
    const avg = count > 0
      ? Math.round((remaining!.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : 0;

    await supabaseServer
      .from('products')
      .update({ rating: avg, review_count: count })
      .eq('id', review.product_id);
  }

  return NextResponse.json({ success: true });
}
