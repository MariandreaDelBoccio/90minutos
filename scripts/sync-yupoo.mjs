#!/usr/bin/env node
/**
 * Sincroniza el catálogo de Yupoo (pinhuistore) a JSON estático paginado.
 *
 * Uso:
 *   npm run sync-yupoo
 *   npm run sync-yupoo -- --max-pages 3
 *   npm run sync-yupoo -- --delay 500
 *
 * Genera:
 *   data/yupoo/meta.json
 *   data/yupoo/pages/page-N.json
 *   data/yupoo/search-index.json
 */

import fs from "node:fs/promises";
import path from "node:path";

const BASE = "https://pinhuistore.x.yupoo.com";
const GALLERY_PATH = "/albums?tab=gallery";
const OUT_DIR = path.join(process.cwd(), "data", "yupoo");
const PAGES_DIR = path.join(OUT_DIR, "pages");
const PAGE_SIZE = 100;
const DEFAULT_DELAY_MS = 400;
const MAX_RETRIES = 4;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function parseArgs(argv) {
  const opts = { maxPages: Infinity, delay: DEFAULT_DELAY_MS };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--max-pages" && argv[i + 1]) {
      opts.maxPages = Math.max(1, Number(argv[++i]) || 1);
    } else if (a === "--delay" && argv[i + 1]) {
      opts.delay = Math.max(0, Number(argv[++i]) || DEFAULT_DELAY_MS);
    } else if (a === "--help" || a === "-h") {
      console.log(`Usage: node scripts/sync-yupoo.mjs [--max-pages N] [--delay MS]`);
      process.exit(0);
    }
  }
  return opts;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtmlEntities(str) {
  return String(str)
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x3D;/gi, "=")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function absolutizeUrl(url) {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${BASE}${url}`;
  return url;
}

/** Prefer medium thumb when Yupoo serves small.png */
function preferMediumThumb(url) {
  return String(url).replace(/\/small\.(png|jpe?g|webp)$/i, "/medium.$1");
}

function parseTotalPages(html) {
  const en = html.match(/in total\s+(\d+)\s+pages/i);
  if (en) return Number(en[1]);
  const zh = html.match(/共\s*(\d+)\s*页/);
  if (zh) return Number(zh[1]);
  const maxAttr = html.match(/name="page"[^>]*max="(\d+)"/);
  if (maxAttr) return Number(maxAttr[1]);
  const numbers = [...html.matchAll(/page&#x3D;(\d+)|page=(\d+)/g)].map(
    (m) => Number(m[1] || m[2])
  );
  return numbers.length ? Math.max(...numbers) : 1;
}

const FLAG_EMOJI_RE = /[\u{1F1E6}-\u{1F1FF}]{2}/u;
const SIZE_TOKEN_RE = /\b[SMLX]{1,4}-[SMLX0-9]{1,5}\b|size\s*[:\s]*\d+-\d+/i;

/**
 * Filtra posts promocionales/anuncios (no productos): título con bandera emoji
 * + signo de exclamación + sin patrón de talla. Validado contra el catálogo
 * completo (15.9k álbumes) sin falsos positivos.
 */
function isPromoPost(title) {
  return FLAG_EMOJI_RE.test(title) && title.includes("!") && !SIZE_TOKEN_RE.test(title);
}

function parseAlbums(html) {
  const items = [];
  const re =
    /<a\s+class="album__main"\s+title="([^"]*)"\s+href="(\/albums\/(\d+)[^"]*)"[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?album__photonumber">(\d+)</g;

  let m;
  while ((m = re.exec(html)) !== null) {
    const title = decodeHtmlEntities(m[1]).trim();
    const href = decodeHtmlEntities(m[2]);
    const id = m[3];
    const thumb = preferMediumThumb(absolutizeUrl(m[4]));
    const photoCount = Number(m[5]) || 0;
    if (!id || !title) continue;
    if (isPromoPost(title)) continue;
    items.push({
      id,
      title,
      thumb,
      url: absolutizeUrl(href),
      photoCount,
    });
  }
  return items;
}

async function fetchText(url) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en,es;q=0.9",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (err) {
      lastErr = err;
      const wait = attempt * 800;
      console.warn(`  retry ${attempt}/${MAX_RETRIES} after error: ${err.message}`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  console.log("Yupoo sync →", OUT_DIR);
  console.log(`delay=${opts.delay}ms maxPages=${Number.isFinite(opts.maxPages) ? opts.maxPages : "all"}`);

  await fs.mkdir(PAGES_DIR, { recursive: true });

  const firstUrl = `${BASE}${GALLERY_PATH}&page=1`;
  console.log("Fetching page 1…");
  const firstHtml = await fetchText(firstUrl);
  const totalPagesRemote = parseTotalPages(firstHtml);
  const pagesToFetch = Math.min(totalPagesRemote, opts.maxPages);
  console.log(`Remote pages: ${totalPagesRemote} · fetching: ${pagesToFetch}`);

  const all = [];
  const page1 = parseAlbums(firstHtml);
  console.log(`  page 1/${pagesToFetch}: ${page1.length} albums`);
  all.push(...page1);

  for (let p = 2; p <= pagesToFetch; p++) {
    await sleep(opts.delay);
    const url = `${BASE}${GALLERY_PATH}&page=${p}`;
    process.stdout.write(`  page ${p}/${pagesToFetch}…`);
    const html = await fetchText(url);
    const albums = parseAlbums(html);
    console.log(` ${albums.length} albums`);
    if (albums.length === 0) {
      console.warn("  empty page — stopping early");
      break;
    }
    all.push(...albums);
  }

  // Deduplicate by id (keep first)
  const seen = new Set();
  const unique = [];
  for (const item of all) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }

  // Clear old page files
  const existing = await fs.readdir(PAGES_DIR).catch(() => []);
  for (const name of existing) {
    if (/^page-\d+\.json$/.test(name)) {
      await fs.unlink(path.join(PAGES_DIR, name));
    }
  }

  const pageCount = Math.max(1, Math.ceil(unique.length / PAGE_SIZE));
  for (let i = 0; i < pageCount; i++) {
    const chunk = unique.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE);
    const pageNum = i + 1;
    await fs.writeFile(
      path.join(PAGES_DIR, `page-${pageNum}.json`),
      JSON.stringify(chunk),
      "utf8"
    );
  }

  const searchIndex = unique.map(({ id, title }) => ({ id, title }));
  await fs.writeFile(
    path.join(OUT_DIR, "search-index.json"),
    JSON.stringify(searchIndex),
    "utf8"
  );

  // id → page map for search result hydration
  const idToPage = {};
  unique.forEach((item, idx) => {
    idToPage[item.id] = Math.floor(idx / PAGE_SIZE) + 1;
  });
  await fs.writeFile(
    path.join(OUT_DIR, "id-to-page.json"),
    JSON.stringify(idToPage),
    "utf8"
  );

  const meta = {
    total: unique.length,
    pageSize: PAGE_SIZE,
    pages: pageCount,
    syncedAt: new Date().toISOString(),
    source: `${BASE}${GALLERY_PATH}`,
    remotePagesFetched: pagesToFetch,
    remotePagesTotal: totalPagesRemote,
  };
  await fs.writeFile(path.join(OUT_DIR, "meta.json"), JSON.stringify(meta, null, 2), "utf8");

  console.log(`\nDone. ${unique.length} albums → ${pageCount} pages (${PAGE_SIZE}/page)`);
  console.log(`meta: ${path.join(OUT_DIR, "meta.json")}`);
}

main().catch((err) => {
  console.error("sync-yupoo failed:", err);
  process.exit(1);
});
