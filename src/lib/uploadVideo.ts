/**
 * Uploads a video file directly from the browser to Cloudinary.
 * The Next.js server only generates a signature — the large file never
 * passes through the server, so there are no timeout issues.
 *
 * Uses /auto/upload so Cloudinary detects the format itself instead of
 * applying strict video-only validation (which rejects some codecs/containers).
 */
export async function uploadVideoDirectly(file: File, folder: string): Promise<string> {
  if (!file || file.size === 0) throw new Error('Selected file is empty.');

  // 1. Get a signed upload token from the server
  const signRes = await fetch('/api/admin/upload/sign', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ folder }),
  });
  if (!signRes.ok) {
    const e = await signRes.json().catch(() => ({}));
    throw new Error((e as { error?: string }).error ?? 'Failed to get upload signature');
  }
  const { signature, timestamp, apiKey, cloudName, folder: signedFolder } =
    await signRes.json() as {
      signature: string; timestamp: number;
      apiKey: string; cloudName: string; folder: string;
    };

  // 2. Ensure the file has a meaningful MIME type so Cloudinary can detect it
  const safeFile = file.type
    ? file
    : new File([file], file.name, { type: 'video/mp4' });

  // 3. Upload via /auto/upload — Cloudinary auto-detects format and stores it
  //    as the correct resource type. The returned secure_url will be a
  //    /video/upload/... URL for video files, compatible with getOptimizedVideoUrl.
  const fd = new FormData();
  fd.append('file',      safeFile);
  fd.append('api_key',   apiKey);
  fd.append('timestamp', String(timestamp));
  fd.append('signature', signature);
  fd.append('folder',    signedFolder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: 'POST', body: fd },
  );
  const data = await uploadRes.json() as { secure_url?: string; resource_type?: string; error?: { message: string; http_code?: number } };
  if (!uploadRes.ok || !data.secure_url) {
    const msg = data.error?.message ?? 'Cloudinary upload failed';
    console.error('[uploadVideo] Cloudinary error:', data.error);
    throw new Error(msg);
  }
  return data.secure_url;
}
