/**
 * Cloudinary → New Cloudinary Migration Script
 *
 * Reads every Cloudinary URL from Supabase, re-uploads to new account
 * keeping the same folder structure, then updates the URL in the DB.
 *
 * Usage:
 *   node scripts/migrate-cloudinary.mjs
 *
 * Required env vars (copy your .env.local values or set them here):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   OLD_CLOUD_NAME        — your disabled account's cloud name
 *   NEW_CLOUDINARY_CLOUD_NAME
 *   NEW_CLOUDINARY_API_KEY
 *   NEW_CLOUDINARY_API_SECRET
 */

import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// ─── Config ────────────────────────────────────────────────────────────────────
// Fill these in or set them as env vars before running
const SUPABASE_URL           = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? '';
const SUPABASE_SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY    ?? '';
const OLD_CLOUD_NAME         = process.env.OLD_CLOUD_NAME               ?? '';  // e.g. "dxxxxx"
const NEW_CLOUD_NAME         = process.env.NEW_CLOUDINARY_CLOUD_NAME    ?? '';
const NEW_API_KEY            = process.env.NEW_CLOUDINARY_API_KEY       ?? '';
const NEW_API_SECRET         = process.env.NEW_CLOUDINARY_API_SECRET    ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OLD_CLOUD_NAME || !NEW_CLOUD_NAME || !NEW_API_KEY || !NEW_API_SECRET) {
  console.error('❌  Missing config — set all env vars before running.');
  process.exit(1);
}

cloudinary.config({ cloud_name: NEW_CLOUD_NAME, api_key: NEW_API_KEY, api_secret: NEW_API_SECRET });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Checks if URL belongs to the OLD Cloudinary account */
function isOldCloudinary(url) {
  return typeof url === 'string' && url.includes(`res.cloudinary.com/${OLD_CLOUD_NAME}/`);
}

/**
 * Extracts the storage path from a Cloudinary URL.
 * e.g. ".../image/upload/v123/products/sk-1654bk/abc.jpg"  →  "products/sk-1654bk"  (folder)
 *                                                          and "abc"  (public_id stem)
 */
function parseCloudinaryUrl(url) {
  // Match: /image/upload/[optional transformations and version]/folder/.../filename.ext
  const m = url.match(/\/(?:image|video|raw)\/upload\/(?:v\d+\/)?(.+)$/);
  if (!m) return null;
  const fullPath = m[1]; // e.g. "products/sk-1654bk/abc.jpg"
  const lastSlash = fullPath.lastIndexOf('/');
  const folder = lastSlash > 0 ? fullPath.slice(0, lastSlash) : '';
  const filename = lastSlash > 0 ? fullPath.slice(lastSlash + 1) : fullPath;
  const isVideo = url.includes('/video/upload/');
  return { folder, filename, fullPath, isVideo };
}

/** Downloads an image/video from a URL and returns a Buffer */
async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Uploads buffer to new Cloudinary account, returns new secure_url */
function uploadToNew(buffer, folder, isVideo) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: isVideo ? 'video' : 'image', use_filename: true, unique_filename: true },
      (err, result) => {
        if (err) return reject(new Error(err.message));
        if (!result) return reject(new Error('No result from Cloudinary'));
        resolve(result.secure_url);
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

/** Cache: old URL → new URL, so we don't re-upload the same file twice */
const cache = new Map();

async function migrateUrl(oldUrl) {
  if (!isOldCloudinary(oldUrl)) return oldUrl; // not an old Cloudinary URL — leave as-is
  if (cache.has(oldUrl)) return cache.get(oldUrl);

  const parsed = parseCloudinaryUrl(oldUrl);
  if (!parsed) { console.warn(`  ⚠  Cannot parse: ${oldUrl}`); return oldUrl; }

  console.log(`  ↓ Downloading ${oldUrl.slice(-60)}`);
  const buffer = await download(oldUrl);

  console.log(`  ↑ Uploading to ${parsed.folder || '(root)'}`);
  const newUrl = await uploadToNew(buffer, parsed.folder, parsed.isVideo);

  cache.set(oldUrl, newUrl);
  console.log(`  ✓ ${newUrl.slice(-60)}`);
  return newUrl;
}

// ─── Table definitions ─────────────────────────────────────────────────────────
// Each entry: { table, idCol, stringCols, jsonArrayCols }
// stringCols    → columns that hold a single image URL string
// jsonArrayCols → columns that hold a JSON array of URL strings

const TABLES = [
  { table: 'products',        idCol: 'id', stringCols: [],        jsonArrayCols: ['images'] },
  { table: 'categories',      idCol: 'id', stringCols: ['image'], jsonArrayCols: [] },
  { table: 'feedback_images', idCol: 'id', stringCols: ['image'], jsonArrayCols: [] },
  { table: 'instagram_items', idCol: 'id', stringCols: ['image'], jsonArrayCols: [] },
  { table: 'boxes',           idCol: 'id', stringCols: ['image'], jsonArrayCols: [] },
];

// ─── Main ──────────────────────────────────────────────────────────────────────
let totalMigrated = 0;
let totalSkipped  = 0;
let totalErrors   = 0;

for (const { table, idCol, stringCols, jsonArrayCols } of TABLES) {
  const cols = [idCol, ...stringCols, ...jsonArrayCols].join(', ');
  const { data: rows, error } = await supabase.from(table).select(cols);

  if (error) {
    console.warn(`⚠  Table "${table}" error: ${error.message} — skipping`);
    continue;
  }

  if (!rows?.length) { console.log(`— ${table}: empty`); continue; }
  console.log(`\n📂 ${table} (${rows.length} rows)`);

  for (const row of rows) {
    const patch = {};
    let changed = false;

    // Single-URL string columns
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

    // JSON array columns
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
          newArr.push(url); // keep original on error
          totalErrors++;
        }
      }
      if (arrChanged) { patch[col] = newArr; changed = true; }
    }

    if (!changed) { totalSkipped++; continue; }

    const { error: updateError } = await supabase
      .from(table)
      .update(patch)
      .eq(idCol, row[idCol]);

    if (updateError) {
      console.error(`  ✗ DB update failed for ${idCol}=${row[idCol]}: ${updateError.message}`);
      totalErrors++;
    } else {
      totalMigrated++;
    }
  }
}

console.log(`\n✅  Done — ${totalMigrated} rows updated, ${totalSkipped} skipped (already on new account), ${totalErrors} errors`);
