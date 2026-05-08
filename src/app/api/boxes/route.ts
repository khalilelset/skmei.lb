import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const brandName = searchParams.get('brand');

  let brandId: string | null = null;
  if (brandName) {
    const { data: brand } = await supabaseServer
      .from('brands')
      .select('id')
      .ilike('name', brandName)
      .maybeSingle();
    brandId = brand?.id ?? null;
  }

  const { data, error } = await supabaseServer
    .from('boxes')
    .select('id, code, type, price, image, brand_id, created_at')
    .order('type', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[/api/boxes]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const all = data ?? [];
  const filtered = brandId
    ? all.filter((b) => b.brand_id === brandId || b.brand_id === null)
    : all;

  return NextResponse.json(
    filtered.map((b) => ({
      id: b.id,
      code: b.code,
      type: b.type,
      price: Number(b.price ?? 0),
      image: b.image ?? '',
      brandId: b.brand_id ?? null,
      createdAt: b.created_at,
    }))
  );
}
