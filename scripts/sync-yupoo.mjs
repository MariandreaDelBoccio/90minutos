#!/usr/bin/env node
/**
 * Sincroniza el catálogo de Yupoo (pinhuistore) a JSON estático paginado.
 * Agrupa variantes del mismo modelo por título (sin LLM).
 *
 * Uso:
 *   npm run sync-yupoo
 *   npm run sync-yupoo -- --max-pages 3
 *   npm run sync-yupoo -- --delay 500
 *   npm run sync-yupoo -- --regroup-only   # reagrupa JSON local sin scrapear
 *
 * Genera:
 *   data/yupoo/meta.json
 *   data/yupoo/pages/page-N.json   (grupos con variants[])
 *   data/yupoo/search-index.json
 *   data/yupoo/id-to-page.json
 *   data/yupoo/teams.json           # tarjetas de equipo (España, Real Madrid…)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { YUPOO_TEAMS, matchTeamFromTitle } from "./yupoo-team-dict.mjs";

const BASE = "https://pinhuistore.x.yupoo.com";
const GALLERY_PATH = "/albums?tab=gallery";
const OUT_DIR = path.join(process.cwd(), "data", "yupoo");
const PAGES_DIR = path.join(OUT_DIR, "pages");
const PAGE_SIZE = 100;
const DEFAULT_DELAY_MS = 400;
const MAX_RETRIES = 4;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Tokens de variante / ruido que no definen el modelo */
const VARIANT_RE =
  /\b(?:player\s+version|long[-\s]?sleeves?|women'?s?|kid(?:s)?\s*kits?|kids?\s*kit|stadium\s+pre-sale|1\.1\s+quality|all\s+sponsors|jerseys?|t-shirts?|size\s*\d+\s*-\s*\d+|[smlx]{1,4}\s*-\s*(?:\d+)?x{0,2}l|\d{2}\s*-\s*\d{2})\b/gi;

function parseArgs(argv) {
  const opts = { maxPages: Infinity, delay: DEFAULT_DELAY_MS, regroupOnly: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--max-pages" && argv[i + 1]) {
      opts.maxPages = Math.max(1, Number(argv[++i]) || 1);
    } else if (a === "--delay" && argv[i + 1]) {
      opts.delay = Math.max(0, Number(argv[++i]) || DEFAULT_DELAY_MS);
    } else if (a === "--regroup-only") {
      opts.regroupOnly = true;
    } else if (a === "--help" || a === "-h") {
      console.log(
        `Usage: node scripts/sync-yupoo.mjs [--max-pages N] [--delay MS] [--regroup-only]`
      );
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
 * + signo de exclamación + sin patrón de talla.
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

function cleanSpaces(s) {
  return String(s)
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Título de modelo sin ruido de variante (manga, player, tallas…). */
function groupTitleFrom(title) {
  let t = cleanSpaces(title || "");
  t = t.replace(VARIANT_RE, " ");
  t = cleanSpaces(t).replace(/[-–—,/|]+$/g, "").trim();
  t = t.replace(/\b(\d{4})\s+(\d{2})\b/g, "$1/$2");
  t = t.replace(/\b(\d)\s+Star\b/gi, "$1-Star");
  return t || cleanSpaces(title);
}

function groupKeyFrom(title) {
  return groupTitleFrom(title).toLowerCase();
}

function variantLabelFrom(title) {
  const t = String(title || "");
  const labels = [];
  const isKid = /\bkid/i.test(t);
  const isWomen = /women'?s?/i.test(t);
  if (/player\s+version/i.test(t)) labels.push("Player");
  else if (!isKid) labels.push("Fan");
  if (/long[-\s]?sleeve/i.test(t)) labels.push("Manga larga");
  if (isWomen) labels.push("Mujer");
  if (isKid) labels.push("Niños");
  if (/all\s+sponsors/i.test(t)) labels.push("Con sponsors");
  if (/stadium\s+pre-sale|1\.1\s+quality/i.test(t)) labels.push("Stadium");
  return labels.join(" · ") || "Estándar";
}

function variantSortScore(title) {
  const t = String(title || "");
  let score = 0;
  if (/player\s+version/i.test(t)) score += 10;
  if (/long[-\s]?sleeve/i.test(t)) score += 1;
  if (/women'?s?/i.test(t)) score += 20;
  if (/\bkid/i.test(t)) score += 30;
  if (/all\s+sponsors/i.test(t)) score += 2;
  return score;
}

function slugify(s) {
  return String(s)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

/** Aplana páginas actuales (álbumes sueltos o grupos) a lista de álbumes. */
function flattenAlbums(pagesItems) {
  const out = [];
  for (const item of pagesItems) {
    if (Array.isArray(item?.variants) && item.variants.length) {
      for (const v of item.variants) {
        if (v?.id) out.push({
          id: String(v.id),
          title: v.title || item.title || "",
          thumb: v.thumb || item.thumb || "",
          url: v.url || "",
          photoCount: Number(v.photoCount) || 0,
        });
      }
    } else if (item?.id && !String(item.id).startsWith("g:")) {
      out.push({
        id: String(item.id),
        title: item.title || "",
        thumb: item.thumb || "",
        url: item.url || "",
        photoCount: Number(item.photoCount) || 0,
      });
    }
  }
  return out;
}

function buildGroups(albums) {
  const buckets = new Map();
  for (const album of albums) {
    const key = groupKeyFrom(album.title);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(album);
  }

  const usedSlugs = new Map();
  const groups = [];

  for (const [key, list] of buckets) {
    list.sort((a, b) => variantSortScore(a.title) - variantSortScore(b.title) || Number(b.id) - Number(a.id));
    const title = groupTitleFrom(list[0].title);
    let slug = slugify(key) || `grupo-${list[0].id}`;
    const n = (usedSlugs.get(slug) || 0) + 1;
    usedSlugs.set(slug, n);
    if (n > 1) slug = `${slug}-${n}`;

    const variants = list.map((a) => ({
      id: String(a.id),
      title: a.title,
      thumb: a.thumb,
      url: a.url,
      photoCount: a.photoCount || 0,
      label: variantLabelFrom(a.title),
    }));

    const primary = variants[0];
    const team = matchTeamFromTitle(title) || matchTeamFromTitle(primary.title);
    groups.push({
      id: `g:${slug}`,
      title,
      thumb: primary.thumb,
      url: primary.url,
      photoCount: primary.photoCount,
      variantCount: variants.length,
      teamId: team?.id || null,
      teamName: team?.name || null,
      variants,
    });
  }

  // Mantener orden de aparición original del catálogo (primer álbum de cada grupo)
  const firstIndex = new Map();
  albums.forEach((a, i) => {
    const k = groupKeyFrom(a.title);
    if (!firstIndex.has(k)) firstIndex.set(k, i);
  });
  groups.sort((a, b) => {
    const ka = groupKeyFrom(a.variants[0].title);
    const kb = groupKeyFrom(b.variants[0].title);
    return (firstIndex.get(ka) ?? 0) - (firstIndex.get(kb) ?? 0);
  });

  return groups;
}

async function readLocalAlbums() {
  const names = await fs.readdir(PAGES_DIR).catch(() => []);
  const pageFiles = names
    .filter((n) => /^page-\d+\.json$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  const all = [];
  for (const name of pageFiles) {
    const raw = JSON.parse(await fs.readFile(path.join(PAGES_DIR, name), "utf8"));
    if (Array.isArray(raw)) all.push(...raw);
  }
  return flattenAlbums(all);
}

async function writeCatalog(groups, metaExtra = {}) {
  await fs.mkdir(PAGES_DIR, { recursive: true });

  const existing = await fs.readdir(PAGES_DIR).catch(() => []);
  for (const name of existing) {
    if (/^page-\d+\.json$/.test(name)) {
      await fs.unlink(path.join(PAGES_DIR, name));
    }
  }

  const pageCount = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  for (let i = 0; i < pageCount; i++) {
    const chunk = groups.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE);
    await fs.writeFile(
      path.join(PAGES_DIR, `page-${i + 1}.json`),
      JSON.stringify(chunk),
      "utf8"
    );
  }

  const albumCount = groups.reduce((n, g) => n + (g.variants?.length || 1), 0);

  const searchIndex = groups.map((g) => ({
    id: g.id,
    title: g.title,
    teamId: g.teamId || null,
    // Texto extra para buscar por variantes (Player, Kids…)
    haystack: [g.title, g.teamName, ...(g.variants || []).map((v) => v.title)].filter(Boolean).join(" ").toLowerCase(),
  }));
  await fs.writeFile(path.join(OUT_DIR, "search-index.json"), JSON.stringify(searchIndex), "utf8");

  const idToPage = {};
  groups.forEach((g, idx) => {
    const page = Math.floor(idx / PAGE_SIZE) + 1;
    idToPage[g.id] = page;
    for (const v of g.variants || []) idToPage[v.id] = page;
  });
  await fs.writeFile(path.join(OUT_DIR, "id-to-page.json"), JSON.stringify(idToPage), "utf8");

  // Tarjetas de equipo: solo equipos con al menos 1 modelo
  const teamBuckets = new Map();
  for (const g of groups) {
    if (!g.teamId) continue;
    if (!teamBuckets.has(g.teamId)) {
      const def = YUPOO_TEAMS.find((t) => t.id === g.teamId);
      teamBuckets.set(g.teamId, {
        id: g.teamId,
        name: g.teamName || def?.name || g.teamId,
        aliases: def?.aliases || [],
        count: 0,
        thumb: g.thumb || "",
      });
    }
    const bucket = teamBuckets.get(g.teamId);
    bucket.count += 1;
    if (!bucket.thumb && g.thumb) bucket.thumb = g.thumb;
  }
  const teams = [...teamBuckets.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, "es")
  );
  const unmatched = groups.filter((g) => !g.teamId).length;
  await fs.writeFile(
    path.join(OUT_DIR, "teams.json"),
    JSON.stringify({
      totalTeams: teams.length,
      matchedGroups: groups.length - unmatched,
      unmatchedGroups: unmatched,
      teams,
    }),
    "utf8"
  );

  const meta = {
    total: groups.length,
    albumTotal: albumCount,
    pageSize: PAGE_SIZE,
    pages: pageCount,
    syncedAt: new Date().toISOString(),
    source: `${BASE}${GALLERY_PATH}`,
    grouped: true,
    teams: teams.length,
    ...metaExtra,
  };
  await fs.writeFile(path.join(OUT_DIR, "meta.json"), JSON.stringify(meta, null, 2), "utf8");

  return { pageCount, albumCount, teams: teams.length, unmatched };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  console.log("Yupoo sync →", OUT_DIR);

  let albums;
  let metaExtra = {};

  if (opts.regroupOnly) {
    console.log("Mode: --regroup-only (sin scrapear)");
    albums = await readLocalAlbums();
    if (!albums.length) {
      console.error("No hay álbumes locales en data/yupoo/pages. Ejecuta sync completo primero.");
      process.exit(1);
    }
    console.log(`Álbumes locales: ${albums.length}`);
  } else {
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
      const pageAlbums = parseAlbums(html);
      console.log(` ${pageAlbums.length} albums`);
      if (pageAlbums.length === 0) {
        console.warn("  empty page — stopping early");
        break;
      }
      all.push(...pageAlbums);
    }

    const seen = new Set();
    albums = [];
    for (const item of all) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      albums.push(item);
    }
    metaExtra = {
      remotePagesFetched: pagesToFetch,
      remotePagesTotal: totalPagesRemote,
    };
  }

  const groups = buildGroups(albums);
  const multi = groups.filter((g) => g.variantCount > 1).length;
  console.log(`Agrupado: ${albums.length} álbumes → ${groups.length} modelos (${multi} con variantes)`);

  const { pageCount, albumCount, teams, unmatched } = await writeCatalog(groups, metaExtra);

  console.log(`\nDone. ${groups.length} modelos (${albumCount} álbumes) → ${pageCount} pages (${PAGE_SIZE}/page)`);
  console.log(`Equipos: ${teams} · sin equipo: ${unmatched}`);
  console.log(`meta: ${path.join(OUT_DIR, "meta.json")}`);
}

main().catch((err) => {
  console.error("sync-yupoo failed:", err);
  process.exit(1);
});
