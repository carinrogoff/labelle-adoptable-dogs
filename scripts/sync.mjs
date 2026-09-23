#!/usr/bin/env node
// Builds site/data/dogs.json from Instagram posts.
//
//   node scripts/sync.mjs            -> uses site/js/sample-posts.js (demo)
//   IG_ACCESS_TOKEN=... node scripts/sync.mjs  -> pulls the real feed
//
// In live mode, photos are downloaded into site/img/ig/ because Instagram's
// media URLs expire after a few days.

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDogs } from '../site/js/parse-caption.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const GRAPH = 'https://graph.instagram.com/v23.0';
const MAX_PAGES = Number(process.env.IG_MAX_PAGES || 6); // ~150 most recent posts

async function fetchJson(url) {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`Instagram API: ${body.error?.message || res.status}`);
  return body;
}

async function fetchInstagramPosts(token) {
  const fields =
    'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,' +
    'children{media_type,media_url,thumbnail_url}';
  let url = `${GRAPH}/me/media?fields=${encodeURIComponent(fields)}&limit=25&access_token=${token}`;
  const posts = [];
  for (let page = 0; url && page < MAX_PAGES; page++) {
    const body = await fetchJson(url);
    posts.push(...body.data);
    url = body.paging?.next;
  }
  return posts;
}

// Images for a post: carousel children, or the post itself. Videos use their thumbnail.
const mediaUrls = (item) =>
  (item.children?.data || [item])
    .map((m) => (m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url))
    .filter(Boolean);

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function download(url, dest) {
  if (await exists(dest)) return; // posts don't change their images; skip re-downloads
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function loadLive(token) {
  const raw = await fetchInstagramPosts(token);
  await mkdir(join(SITE, 'img/ig'), { recursive: true });
  return raw.map((item) => ({
    id: item.id,
    caption: item.caption || '',
    timestamp: item.timestamp,
    permalink: item.permalink,
    remoteImages: mediaUrls(item).slice(0, 10),
  }));
}

async function main() {
  const token = process.env.IG_ACCESS_TOKEN;
  const source = token ? 'instagram' : 'sample';
  const posts = token ? await loadLive(token) : (await import('../site/js/sample-posts.js')).default;

  const { dogs, skipped, announcements } = buildDogs(posts);

  // Only download photos for posts that became listings.
  if (token) {
    for (const dog of dogs) {
      const post = posts.find((p) => p.id === dog.id);
      dog.images = [];
      for (const [i, url] of post.remoteImages.entries()) {
        const rel = `img/ig/${dog.id}-${i}.jpg`;
        try {
          await download(url, join(SITE, rel));
          dog.images.push(rel);
        } catch (err) {
          console.warn(`  ! ${dog.name}: ${err.message}`);
        }
      }
    }
  }

  await mkdir(join(SITE, 'data'), { recursive: true });
  const outPath = join(SITE, 'data/dogs.json');
  // Keep the old timestamp when nothing changed, so hourly syncs don't create empty commits.
  const previous = await readFile(outPath, 'utf8').then(JSON.parse, () => null);
  const unchanged = previous && JSON.stringify(previous.dogs) === JSON.stringify(dogs);
  const out = { generatedAt: unchanged ? previous.generatedAt : new Date().toISOString(), source, dogs };
  await writeFile(outPath, JSON.stringify(out, null, 2) + '\n');

  const count = (s) => dogs.filter((d) => d.status === s).length;
  console.log(`Source: ${source} (${posts.length} posts)`);
  console.log(`  ${dogs.length} dogs: ${count('available')} available, ${count('pending')} pending, ${count('adopted')} adopted`);
  console.log(`  ${announcements} adoption announcements, ${skipped} other posts skipped`);
  for (const d of dogs) {
    console.log(`  - ${d.name.padEnd(12)} ${d.status.padEnd(9)} ${d.sex ?? '?'}, ${d.age ?? '?'} (${d.ageGroup ?? '?'}), ${d.breed ?? '?'}, ${d.sizeGroup ?? '?'}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
