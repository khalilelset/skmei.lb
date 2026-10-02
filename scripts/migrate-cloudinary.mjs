/**
 * Cloudinary → New Cloudinary Migration Script
 *
 * Uses plain fetch for Supabase (no SDK) — works in any Node.js 18+.
 * Downloads assets via the Cloudinary Admin API (api.cloudinary.com), which
 * uses authenticated signed requests and bypasses the CDN 401 that disabled
 * accounts return on res.cloudinary.com.
 *
 * Run from project root:
 *   node scripts/migrate-cloudinary.mjs NEW_CLOUD=xxx NEW_KEY=xxx NEW_SECRET=xxx
 */

import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// ─── Auto-load .env.local ──────────────────────────────────────────────────────
try {
  const lines = readFileSync('.env.local', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
  console.log('✓ Loaded .env.local');
} catch {
  console.warn('⚠  Could not read .env.local');
}

// ─── Parse args ───────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .map(a => { const i = a.indexOf('='); return i > 0 ? [a.slice(0, i), a.slice(i + 1)] : null; })
    .filter(Boolean)
);

const SUPABASE_URL    = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const OLD_CLOUD_NAME  = process.env.CLOUDINARY_CLOUD_NAME ?? '';
// Old account credentials — same keys currently in .env.local
const OLD_API_KEY     = process.env.CLOUDINARY_API_KEY ?? '';
const OLD_API_SECRET  = process.env.CLOUDINARY_API_SECRET ?? '';
const NEW_CLOUD_NAME  = args.NEW_CLOUD  ?? '';
const NEW_API_KEY     = args.NEW_KEY    ?? '';
const NEW_API_SECRET  = args.NEW_SECRET ?? '';

console.log('\n── Config check ─────────────────────────────────────');
console.log('Supabase URL   :', SUPABASE_URL || '❌ MISSING');
console.log('Supabase key   :', SUPABASE_KEY ? `✓ (${SUPABASE_KEY.slice(0,12)}...)` : '❌ MISSING');
console.log('Old cloud name :', OLD_CLOUD_NAME || '❌ MISSING');
console.log('Old API key    :', OLD_API_KEY ? `✓ (${OLD_API_KEY.slice(0,8)}...)` : '❌ MISSING (set CLOUDINARY_API_KEY in .env.local)');
console.log('New cloud name :', NEW_CLOUD_NAME || '❌ MISSING');
console.log('─────────────────────────────────────────────────────\n');

if (!SUPABASE_URL || !SUPABASE_KEY)   { console.error('❌ Supabase credentials missing in .env.local'); process.exit(1); }
if (!OLD_CLOUD_NAME)                  { console.error('❌ CLOUDINARY_CLOUD_NAME missing in .env.local'); process.exit(1); }
if (!OLD_API_KEY || !OLD_API_SECRET)  { console.error('❌ CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET missing in .env.local'); process.exit(1); }
if (!NEW_CLOUD_NAME || !NEW_API_KEY || !NEW_API_SECRET) {
  console.error('❌ Usage: node scripts/migrate-cloudinary.mjs NEW_CLOUD=xxx NEW_KEY=xxx NEW_SECRET=xxx');
  process.exit(1);
}

// ─── Supabase REST helpers (no SDK) ──────────────────────────────────────────
const SB_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function sbSelect(table, columns) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(columns)}`;
  const res = await fetch(url, { headers: SB_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbUpdate(table, idCol, idVal, patch) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${idCol}=eq.${encodeURIComponent(idVal)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...SB_HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
}

// ─── Test Supabase connection ─────────────────────────────────────────────────
try {
  console.log('Testing Supabase connection...');
  await sbSelect('products', 'id');
  console.log('✓ Supabase connected\n');
} catch (e) {
  console.error('❌ Supabase connection failed:', e.message);
  process.exit(1);
}

// ─── Test old Cloudinary Admin API access ────────────────────────────────────
{
  console.log('Testing old Cloudinary Admin API...');
  // Admin API list endpoint uses HTTP Basic Auth (API_KEY:API_SECRET)
  const basicAuth = Buffer.from(`${OLD_API_KEY}:${OLD_API_SECRET}`).toString('base64');
  try {
    const r = await fetch(
      `https://api.cloudinary.com/v1_1/${OLD_CLOUD_NAME}/resources/image?max_results=1`,
      { headers: { 'Authorization': `Basic ${basicAuth}` }, signal: AbortSignal.timeout(15000) }
    );
    const body = await r.text().catch(() => '');
    if (r.ok) {
      console.log('✓ Old Cloudinary Admin API is reachable — signed downloads should work\n');
    } else {
      console.warn(`⚠  Old Cloudinary Admin API returned HTTP ${r.status}: ${body.slice(0, 200)}`);
      console.warn('   The account may be fully locked. Downloads will be attempted anyway.\n');
    }
  } catch (e) {
    console.warn(`⚠  Could not reach old Cloudinary Admin API: ${e.message}\n`);
  }
}

// ─── Cloudinary setup (new account for uploads) ───────────────────────────────
cloudinary.config({ cloud_name: NEW_CLOUD_NAME, api_key: NEW_API_KEY, api_secret: NEW_API_SECRET });
console.log(`📦 Migrating: "${OLD_CLOUD_NAME}"  →  "${NEW_CLOUD_NAME}"\n`);

// ─── URL helpers ─────────────────────────────────────────────────────────────
function isOldCloudinary(url) {
  return typeof url === 'string' && url.includes(`res.cloudinary.com/${OLD_CLOUD_NAME}/`);
}

/** Parse a Cloudinary delivery URL into its components */
function parseCloudinaryUrl(url) {
  // Strip query string, match resource type and full path after /upload/[vNNN/]
  const m = url.split('?')[0].match(
    /res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)$/
  );
  if (!m) return null;

  const resourceType = m[1];          // 'image' | 'video' | 'raw'
  const pathWithExt  = m[2];          // 'products/sk-1654bk/abc.jpg'
  const lastDot      = pathWithExt.lastIndexOf('.');
  const publicId     = lastDot > 0 ? pathWithExt.slice(0, lastDot) : pathWithExt;
  const format       = lastDot > 0 ? pathWithExt.slice(lastDot + 1) : '';
  const lastSlash    = pathWithExt.lastIndexOf('/');
  const folder       = lastSlash > 0 ? pathWithExt.slice(0, lastSlash) : '';

  return { resourceType, publicId, format, folder, isVideo: resourceType === 'video' };
}

/**
 * Build a signed Cloudinary Admin API private_download URL.
 * This goes through api.cloudinary.com (not res.cloudinary.com/CDN),
 * so it still works when CDN delivery is blocked on a disabled account.
 */
function makePrivateDownloadUrl({ resourceType, publicId, format }) {
  const timestamp = Math.floor(Date.now() / 1000);

  // Params to sign (alphabetical, without api_key / signature)
  const sigObj = {
    ...(format ? { format } : {}),
    public_id: publicId,
    timestamp: String(timestamp),
    type: 'upload',
  };

  const sortedStr = Object.entries(sigObj)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const signature = createHash('sha1')
    .update(sortedStr + OLD_API_SECRET)
    .digest('hex');

  const qs = new URLSearchParams({ ...sigObj, api_key: OLD_API_KEY, signature });
  return `https://api.cloudinary.com/v1_1/${OLD_CLOUD_NAME}/${resourceType}/download?${qs}`;
}

// ─── Wayback Machine lookup ───────────────────────────────────────────────────
async function getWaybackUrl(originalUrl) {
  try {
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(originalUrl)}&output=json&limit=1&fl=timestamp&filter=statuscode:200`;
    const res = await fetch(cdxUrl, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const data = await res.json();
    // data[0] = header row, data[1] = first result
    if (!Array.isArray(data) || data.length < 2) return null;
    const timestamp = data[1][0];
    // im_ flag returns the raw image/video without the Wayback toolbar wrapper
    return `https://web.archive.org/web/${timestamp}im_/${originalUrl}`;
  } catch {
    return null;
  }
}

// ─── Download with fallback ───────────────────────────────────────────────────
async function downloadBuffer(url) {
  // 1. Try authenticated Admin API download (bypasses CDN 401 on disabled accounts)
  const parsed = isOldCloudinary(url) ? parseCloudinaryUrl(url) : null;
  if (parsed) {
    const apiUrl = makePrivateDownloadUrl(parsed);
    try {
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(60000) });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      const body = await res.text().catch(() => '');
      console.log(`    ⚠ Admin API HTTP ${res.status}${body ? ': ' + body.slice(0, 80) : ''} — trying Wayback`);
    } catch (e) {
      console.log(`    ⚠ Admin API error: ${e.message} — trying Wayback`);
    }
  }

  // 2. Try Wayback Machine (archive.org) — free, may have cached CDN images
  const waybackUrl = await getWaybackUrl(url);
  if (waybackUrl) {
    try {
      console.log(`    🕐 Wayback: ${waybackUrl.slice(-70)}`);
      const res = await fetch(waybackUrl, { signal: AbortSignal.timeout(60000) });
      if (res.ok) {
        console.log(`    ✓ Wayback hit!`);
        return Buffer.from(await res.arrayBuffer());
      }
      console.log(`    ⚠ Wayback HTTP ${res.status} — trying CDN`);
    } catch (e) {
      console.log(`    ⚠ Wayback error: ${e.message} — trying CDN`);
    }
  } else {
    console.log(`    ⚠ Not in Wayback — trying CDN`);
  }

  // 3. Fallback: direct CDN URL (works if account is merely rate-limited, not locked)
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url.slice(-60)}`);
  return Buffer.from(await res.arrayBuffer());
}

// ─── Upload to new Cloudinary ─────────────────────────────────────────────────
function uploadToCloudinary(buffer, folder, isVideo) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folder || undefined, resource_type: isVideo ? 'video' : 'image', unique_filename: true },
      (err, result) => {
        if (err || !result) return reject(new Error(err?.message ?? 'No result'));
        resolve(result.secure_url);
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

const cache = new Map(); // avoids re-uploading the same file

async function migrateUrl(oldUrl) {
  if (!isOldCloudinary(oldUrl)) return oldUrl;
  if (cache.has(oldUrl)) {
    console.log(`    ⟳ cached → ${cache.get(oldUrl).slice(-55)}`);
    return cache.get(oldUrl);
  }

  const parsed = parseCloudinaryUrl(oldUrl);
  const folder  = parsed?.folder  ?? '';
  const isVideo = parsed?.isVideo ?? false;

  console.log(`    ↓ ${oldUrl.slice(-65)}`);
  const buffer = await downloadBuffer(oldUrl);
  console.log(`    ↑ uploading to folder "${folder || '(root)'}"`);
  const newUrl = await uploadToCloudinary(buffer, folder, isVideo);
  console.log(`    ✓ ${newUrl.slice(-65)}`);
  cache.set(oldUrl, newUrl);
  return newUrl;
}

// ─── Table map ────────────────────────────────────────────────────────────────
const TABLES = [
  { table: 'products',        idCol: 'id', stringCols: ['video_url'],           jsonArrayCols: ['images'] },
  { table: 'categories',      idCol: 'id', stringCols: ['image'],               jsonArrayCols: [] },
  { table: 'feedback_images', idCol: 'id', stringCols: ['image'],               jsonArrayCols: [] },
  { table: 'instagram_posts', idCol: 'id', stringCols: ['video_src', 'poster'], jsonArrayCols: ['images'] },
  { table: 'boxes',           idCol: 'id', stringCols: ['image'],               jsonArrayCols: [] },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
let totalMigrated = 0, totalSkipped = 0, totalErrors = 0;

for (const { table, idCol, stringCols, jsonArrayCols } of TABLES) {
  const cols = [idCol, ...stringCols, ...jsonArrayCols].join(',');
  let rows;
  try {
    rows = await sbSelect(table, cols);
  } catch (e) {
    console.warn(`⚠  "${table}" query failed: ${e.message} — skipping`);
    continue;
  }

  if (!rows?.length) { console.log(`— ${table}: empty`); continue; }
  console.log(`\n📂  ${table}  (${rows.length} rows)`);

  for (const row of rows) {
    const patch = {};
    let changed = false;

    for (const col of stringCols) {
      const url = row[col];
      if (!isOldCloudinary(url)) continue;
      try {
        const newUrl = await migrateUrl(url);
        if (newUrl !== url) { patch[col] = newUrl; changed = true; }
      } catch (e) {
        console.error(`  ✗ ${col}: ${e.message}`);
        totalErrors++;
      }
    }

    for (const col of jsonArrayCols) {
      const arr = row[col];
      if (!Array.isArray(arr)) continue;
      let arrChanged = false;
      const newArr = [];
      for (const url of arr) {
        if (!isOldCloudinary(url)) { newArr.push(url); continue; }
        try {
          const newUrl = await migrateUrl(url);
          newArr.push(newUrl);
          if (newUrl !== url) arrChanged = true;
        } catch (e) {
          console.error(`  ✗ ${col}[]: ${e.message}`);
          newArr.push(url);
          totalErrors++;
        }
      }
      if (arrChanged) { patch[col] = newArr; changed = true; }
    }

    if (!changed) { totalSkipped++; continue; }

    try {
      await sbUpdate(table, idCol, row[idCol], patch);
      totalMigrated++;
    } catch (e) {
      console.error(`  ✗ DB update (${idCol}=${row[idCol]}): ${e.message}`);
      totalErrors++;
    }
  }
}

console.log(`\n${'─'.repeat(55)}`);
console.log(`✅  Done — ${totalMigrated} rows updated, ${totalSkipped} skipped, ${totalErrors} errors`);
if (totalMigrated > 0) {
  console.log(`\nNext steps:`);
  console.log(`  1. Update CLOUDINARY_CLOUD_NAME=${NEW_CLOUD_NAME} in Vercel`);
  console.log(`  2. Update CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Vercel`);
  console.log(`  3. Redeploy on Vercel`);
}
