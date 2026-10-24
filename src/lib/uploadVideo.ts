/**
 * Uploads a video straight from the browser to Cloudflare R2 using a pre-signed URL,
 * so large files never pass through the Vercel function (4.5 MB body limit).
 */
export async function uploadVideoDirectly(file: File, folder: string): Promise<string> {
  if (!file || file.size === 0) throw new Error('Selected file is empty.');

  const signRes = await fetch('/api/admin/upload/sign', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ folder, contentType: file.type || 'video/mp4' }),
  });
  if (!signRes.ok) {
    const e = await signRes.json().catch(() => ({}));
    throw new Error((e as { error?: string }).error ?? 'Failed to prepare upload');
  }
  const { uploadUrl, publicUrl, contentType } =
    await signRes.json() as { uploadUrl: string; publicUrl: string; contentType: string };

  let uploadRes: Response;
  try {
    uploadRes = await fetch(uploadUrl, {
      method:  'PUT',
      headers: { 'Content-Type': contentType },
      body:    file,
    });
  } catch {
    // A CORS rejection surfaces as a generic network error with no response.
    throw new Error('Upload blocked — check the R2 bucket CORS policy allows PUT from this site.');
  }

  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => '');
    throw new Error(`Video upload failed: HTTP ${uploadRes.status} — ${text.slice(0, 300) || '(empty response)'}`);
  }
  return publicUrl;
}
