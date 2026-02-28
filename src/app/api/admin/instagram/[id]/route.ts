import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const update: Record<string, unknown> = {};
    if (body.type !== undefined) update.type = body.type;
    if (body.images !== undefined) update.images = body.images;
    if (body.videoSrc !== undefined) update.video_src = body.videoSrc ?? null;
    if (body.poster !== undefined) update.poster = body.poster ?? null;
    if (body.postUrl !== undefined) update.post_url = body.postUrl;
    if (body.likes !== undefined) update.likes = body.likes;
    if (body.comments !== undefined) update.comments = body.comments;
    if (body.caption !== undefined) update.caption = body.caption;
    if (body.sort_order !== undefined) update.sort_order = body.sort_order;

    const { error } = await supabaseServer
      .from('instagram_posts')
      .update(update)
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabaseServer
    .from('instagram_posts')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
