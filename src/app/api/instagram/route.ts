import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const { data, error } = await supabaseServer
    .from('instagram_posts')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map((row: Record<string, unknown>) => ({
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
    }))
  );
}
