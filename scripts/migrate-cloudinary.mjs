/**
 * Cloudinary → New Cloudinary Migration Script
 *
 * Reads all config from .env.local automatically.
 * You only need to pass the NEW account's 3 credentials.
 *
 * Usage (run from project root):
 *   node scripts/migrate-cloudinary.mjs NEW_CLOUD=xxx NEW_KEY=xxx NEW_SECRET=xxx
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// ─── Auto-load .env.local ──────────────────────────────────────────────────────
try {
  const lines = readFileSync('.env.local', 'utf8').split('\n');
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
  console.warn('⚠  Could not read .env.local — using existing env vars');
}

// ─── Parse command-line args  (NEW_CLOUD=xxx NEW_KEY=xxx NEW_SECRET=xxx) ───────
const args = Object.fromEntries(
  process.argv.slice(2).map(a => a.split('=')).filter(p => p.length === 2).map(([k, v]) => [k.trim(), v.trim()])
);

const OLD_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? '';
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const NEW_CLOUD_NAME = args.NEW_CLOUD ?? '';
const NEW_API_KEY    = args.NEW_KEY   ?? '';
const NEW_API_SECRET = args.NEW_SECRET ?? '';

if (!OLD_CLOUD_NAME) { console.error('❌  CLOUDINARY_CLOUD_NAME not found in .env.local'); process.exit(1); }
if (!SUPABASE_URL)   { console.error('❌  NEXT_PUBLIC_SUPABASE_URL not found in .env.local'); process.exit(1); }
if (!SUPABASE_KEY)   { console.error('❌  SUPABASE_SERVICE_ROLE_KEY not found in .env.local'); process.exit(1); }
if (!NEW_CLOUD_NAME || !NEW_API_KEY || !NEW_API_SECRET) {
  console.error('❌  Missing new Cloudinary credentials.\n\nUsage:\n  node scripts/migrate-cloudinary.mjs NEW_CLOUD=xxx NEW_KEY=xxx NEW_SECRET=xxx');
  process.exit(1);
}

console.log(`\n📦 Migrating from cloud "${OLD_CLOUD_NAME}"  →  "${NEW_CLOUD_NAME}"\n`);

cloudinary.config({ cloud_name: NEW_CLOUD_NAME, api_key: NEW_API_KEY, api_secret: NEW_API_SECRET });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isOldCloudinary(url) {
  return typeof url === 'string' && url.includes(`res.cloudinary.com/${OLD_CLOUD_NAME}/`);
}

function parseCloudinaryUrl(url) {
  const m = url.match(/\/(image|video|raw)\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(.+)$/);
  if (!m) return null;
  const fullPath = m[2];
  const lastSlash = fullPath.lastIndexOf('/');
  const folder    = lastSlash > 0 ? fullPath.slice(0, lastSlash) : '';
  const isVideo   = m[1] === 'video';
  return { folder, isVideo };
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function uploadToNew(buffer, folder, isVideo) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folder || undefined, resource_type: isVideo ? 'video' : 'image', unique_filename: true },
      (err, result) => {
        if (err)     return reject(new Error(err.message));
        if (!result) return reject(new Error('No result from Cloudinary'));
        resolve(result.secure_url);
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

const cache = new Map(); // old URL → new URL (avoid re-uploading same file)

async function migrateUrl(oldUrl) {
  if (!isOldCloudinary(oldUrl)) return oldUrl;
  if (cache.has(oldUrl)) { console.log(`  ⟳ (cached) ${oldUrl.slice(-50)}`); return cache.get(oldUrl); }

  const parsed = parseCloudinaryUrl(oldUrl);
  if (!parsed) { console.warn(`  ⚠  Cannot parse: ${oldUrl}`); return oldUrl; }

  console.log(`  ↓ ${oldUrl.slice(-55)}`);
  const buffer = await download(oldUrl);

  const newUrl = await uploadToNew(buffer, parsed.folder, parsed.isVideo);
  console.log(`  ✓ ${newUrl.slice(-55)}`);

  cache.set(oldUrl, newUrl);
  return newUrl;
}

// ─── Tables to scan ────────────────────────────────────────────────────────────
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

  if (error) { console.warn(`⚠  "${table}": ${error.message} — skipping`); continue; }
  if (!rows?.length) { console.log(`— ${table}: empty or not found`); continue; }

  console.log(`\n📂  ${table}  (${rows.length} rows)`);

  for (const row of rows) {
    const patch   = {};
    let   changed = false;

    for (const col of stringCols) {
      const url = row[col];
      if (!isOldCloudinary(url)) continue;
      try {
        const newUrl = await migrateUrl(url);
        if (newUrl !== url) { patch[col] = newUrl; changed = true; }
      } catch (e) { console.error(`  ✗ ${col}: ${e.message}`); totalErrors++; }
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
        } catch (e) { console.error(`  ✗ ${col}[]: ${e.message}`); newArr.push(url); totalErrors++; }
      }
      if (arrChanged) { patch[col] = newArr; changed = true; }
    }

    if (!changed) { totalSkipped++; continue; }

    const { error: updateError } = await supabase.from(table).update(patch).eq(idCol, row[idCol]);
    if (updateError) {
      console.error(`  ✗ DB update failed (${idCol}=${row[idCol]}): ${updateError.message}`);
      totalErrors++;
    } else {
      totalMigrated++;
    }
  }
}

console.log(`\n${'─'.repeat(55)}`);
console.log(`✅  Migration complete`);
console.log(`   ${totalMigrated} rows updated in Supabase`);
console.log(`   ${totalSkipped}  rows skipped (no old Cloudinary URLs)`);
if (totalErrors) console.log(`   ${totalErrors}  errors — check output above`);
console.log(`\nNext step: update CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,`);
console.log(`CLOUDINARY_API_SECRET in Vercel to the NEW account values, then redeploy.`);
