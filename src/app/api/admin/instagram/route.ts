import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const { data, error } = await supabaseServer
    .from('instagram_posts')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(mapPost));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.postUrl) return NextResponse.json({ error: 'postUrl is required' }, { status: 400 });

    const { data, error } = await supabaseServer
      .from('instagram_posts')
      .insert({
        type: body.type ?? 'image',
        images: body.images ?? [],
        video_src: body.videoSrc ?? null,
        poster: body.poster ?? null,
        post_url: body.postUrl,
        likes: body.likes ?? 0,
        comments: body.comments ?? 0,
        caption: body.caption ?? '',
        sort_order: body.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(mapPost(data as Record<string, unknown>), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

function mapPost(row: Record<string, unknown>) {
  return {
    id: row.id,
    type: row.type,
    images: row.images,
    videoSrc: row.video_src,
    poster: row.poster,
    postUrl: row.post_url,
    likes: row.likes,
    comments: row.comments,
    caption: row.caption,
    sort_order: row.sort_order,
    createdAt: row.created_at,
  };
}
