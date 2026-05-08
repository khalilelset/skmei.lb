import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

function mapBox(b: Record<string, unknown>, brandMap: Record<string, string> = {}) {
  return {
    id: b.id,
    code: b.code,
    type: b.type,
    price: Number(b.price ?? 0),
    image: b.image ?? '',
    brandId: b.brand_id ?? null,
    brandName: b.brand_id ? (brandMap[b.brand_id as string] ?? null) : null,
    createdAt: b.created_at,
  };
}

export async function GET() {
  const [boxesResult, brandsResult] = await Promise.all([
    supabaseServer
      .from('boxes')
      .select('id, code, type, price, image, brand_id, created_at')
      .order('type', { ascending: true })
      .order('created_at', { ascending: true }),
    supabaseServer.from('brands').select('id, name'),
  ]);

  if (boxesResult.error) return NextResponse.json({ error: boxesResult.error.message }, { status: 500 });

  const brandMap: Record<string, string> = {};
  if (!brandsResult.error) {
    (brandsResult.data ?? []).forEach((br: { id: string; name: string }) => { brandMap[br.id] = br.name; });
  }

  return NextResponse.json((boxesResult.data ?? []).map((b) => mapBox(b as Record<string, unknown>, brandMap)));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, type, price, image, brandId } = body;

  if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 });

  const { data, error } = await supabaseServer
    .from('boxes')
    .insert({
      code:     String(code).trim(),
      type:     type === 'gift' ? 'gift' : 'standard',
      price:    Number(price ?? 0),
      image:    image || null,
      brand_id: brandId || null,
    })
    .select('id, code, type, price, image, brand_id, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapBox(data as Record<string, unknown>), { status: 201 });
}
