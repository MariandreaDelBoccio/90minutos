/* 90 Minutos Sports — vanilla JS */

// ---------- Config ----------
/** Usuario de Instagram (sin @). Cambia por el de la marca. */
const INSTAGRAM_USER = "90minutos.ss";
const STORAGE_FAV = "90min-favorites";
const STORAGE_YUPOO_FAV = "90min-yupoo-fav-meta";
const STORAGE_INQUIRY = "90min-inquiry";

/** Cotización USD→VES ([DolarApi Venezuela](https://dolarapi.com/docs/venezuela/)) */
const FX_DOLARES_URL = "https://ve.dolarapi.com/v1/dolares";
/** Bs. por 1 USD (promedio paralelo) */
let usdBsParalelo = null;
let fxFetchFailed = false;
let fxUpdateLabel = "";

// ---------- Data ----------
const PRODUCTS_URL = "data/productos.json";
const YUPOO_META_URL = "data/yupoo/meta.json";
const YUPOO_PAGE_URL = (n) => `data/yupoo/pages/page-${n}.json`;
const YUPOO_SEARCH_URL = "data/yupoo/search-index.json";
const YUPOO_ID_MAP_URL = "data/yupoo/id-to-page.json";
const YUPOO_TEAMS_URL = "data/yupoo/teams.json";
const YUPOO_CURATION_URL = "data/yupoo-curation.json";
const YUPOO_TEAM_OTHER = "__other__";
const FILTER_DISPONIBLES = "DISPONIBLES";
const FILTER_YUPOO = "TODO EL CATÁLOGO";

const P_NONE = { id: "none", name: "Sin jugador", number: "" };
function pl(...stars) {
  return [P_NONE, ...stars];
}

const DEFAULT_SHIRTS = [
  { id: "1", club: "Real Madrid", team: "Real Madrid 24/25", season: "24/25", league: "LaLiga", price: 49.99, pricePlayer: 84.99, oldPrice: 65, badge: "OFERTA", sizes: ["S","M","L","XL","XXL"], outOfStock: ["S", "XXL"], players: pl({ id: "mbappe", name: "Mbappé", number: "9" }, { id: "vinicius", name: "Vinicius Jr.", number: "7" }, { id: "bellingham", name: "Bellingham", number: "5" }), bg: "linear-gradient(135deg,#0b1d4a,#1e3a8a 60%,#f5f5f5)" },
  { id: "2", club: "FC Barcelona", team: "FC Barcelona Away 24/25", season: "24/25", league: "LaLiga", price: 44.99, pricePlayer: 74.99, badge: "NUEVO", sizes: ["S","M","L","XL"], outOfStock: ["L"], players: pl({ id: "yamal", name: "Lamine Yamal", number: "10" }, { id: "lewandowski", name: "Lewandowski", number: "9" }), bg: "linear-gradient(135deg,#3b0764,#7c1d6f 50%,#f59e0b)" },
  { id: "3", club: "Manchester City", team: "Manchester City Home 24/25", season: "24/25", league: "Premier League", price: 52, pricePlayer: 86, sizes: ["M","L","XL","XXL"], players: pl({ id: "haaland", name: "Haaland", number: "9" }, { id: "debruyne", name: "De Bruyne", number: "17" }), bg: "linear-gradient(135deg,#0c4a6e,#0ea5e9 60%,#e0f2fe)" },
  { id: "4", club: "Arsenal", team: "Arsenal Home 24/25", season: "24/25", league: "Premier League", price: 47.5, pricePlayer: 78, badge: "OFERTA", oldPrice: 60, sizes: ["S","M","L","XL"], outOfStock: ["XL"], players: pl({ id: "saka", name: "Saka", number: "7" }, { id: "odegaard", name: "Ødegaard", number: "8" }), bg: "linear-gradient(135deg,#7f1d1d,#dc2626 60%,#fef2f2)" },
  { id: "5", club: "PSG", team: "PSG Champions Edition", season: "24/25", league: "Champions", price: 59.99, pricePlayer: 94.99, badge: "NUEVO", sizes: ["S","M","L","XL","XXL"], outOfStock: ["S", "M"], players: pl({ id: "dembele", name: "Dembélé", number: "10" }, { id: "vitinha", name: "Vitinha", number: "17" }), bg: "linear-gradient(135deg,#020617,#1e1b4b 60%,#a78bfa)" },
  { id: "6", club: "España", team: "España Home Euro 2024", season: "2024", league: "Selección", price: 54, pricePlayer: 88, badge: "TOP", sizes: ["S","M","L","XL"], players: pl({ id: "morata", name: "Morata", number: "7" }, { id: "rodri", name: "Rodri", number: "16" }), bg: "linear-gradient(135deg,#7f1d1d,#dc2626 50%,#fde047)" },
  { id: "7", club: "Liverpool", team: "Liverpool Home 24/25", season: "24/25", league: "Premier League", price: 49, pricePlayer: 79.99, sizes: ["M","L","XL"], players: pl({ id: "salah", name: "Salah", number: "11" }, { id: "van_dijk", name: "Van Dijk", number: "4" }), bg: "linear-gradient(135deg,#450a0a,#b91c1c 60%,#fef2f2)" },
  { id: "8", club: "Atlético Madrid", team: "Atlético Madrid 24/25", season: "24/25", league: "LaLiga", price: 46, pricePlayer: 76, badge: "NUEVO", sizes: ["S","M","L","XL"], players: pl({ id: "griezmann", name: "Griezmann", number: "7" }, { id: "alvarez", name: "Julián Álvarez", number: "19" }), bg: "linear-gradient(135deg,#7f1d1d,#fafafa 50%,#1e3a8a)" },
];

/** @type {typeof DEFAULT_SHIRTS} */
let SHIRTS = [...DEFAULT_SHIRTS];

/** Acepta ["S","M"] o formato Decap [{ size: "S" }, …]. */
function normalizeSizeTokens(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  return arr
    .map((x) => {
      if (typeof x === "string") return x;
      if (x && typeof x === "object" && x.size != null) return String(x.size);
      return "";
    })
    .filter(Boolean);
}

function normalizeShirt(raw, index) {
  const id = raw?.id != null ? String(raw.id) : String(index + 1);
  const sizesNorm = normalizeSizeTokens(raw?.sizes);
  const sizes = sizesNorm.length ? sizesNorm : ["M", "L", "XL"];
  const outOfStock = normalizeSizeTokens(raw?.outOfStock);
  const playersRaw = Array.isArray(raw?.players) ? raw.players : [];
  const players = pl(
    ...playersRaw
      .map((p, i) => ({
        id: p?.id != null ? String(p.id) : `player-${id}-${i + 1}`,
        name: typeof p?.name === "string" ? p.name : "",
        number: p?.number != null ? String(p.number) : "",
      }))
      .filter(p => p.name)
  );
  return {
    id,
    club: typeof raw?.club === "string" ? raw.club : "Club",
    team: typeof raw?.team === "string" ? raw.team : `Camisa ${id}`,
    season: typeof raw?.season === "string" ? raw.season : "24/25",
    league: typeof raw?.league === "string" ? raw.league : "General",
    price: Number(raw?.price) > 0 ? Number(raw.price) : 0,
    pricePlayer: Number(raw?.pricePlayer) > 0 ? Number(raw.pricePlayer) : undefined,
    oldPrice: Number(raw?.oldPrice) > 0 ? Number(raw.oldPrice) : undefined,
    badge: typeof raw?.badge === "string" ? raw.badge : "",
    sizes,
    outOfStock,
    players,
    bg: typeof raw?.bg === "string" && raw.bg.trim()
      ? raw.bg
      : "linear-gradient(135deg,#1f2937,#111827 60%,#4b5563)",
    image: typeof raw?.image === "string" ? raw.image : "",
  };
}

async function loadShirts() {
  try {
    const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("http");
    const payload = await res.json();
    const list = Array.isArray(payload) ? payload : payload?.productos;
    if (!Array.isArray(list) || list.length === 0) throw new Error("empty");
    SHIRTS = list.map(normalizeShirt);
  } catch (_) {
    SHIRTS = [...DEFAULT_SHIRTS];
  }
}

/** @type {Set<string>} */
let favoriteIds = new Set();
/** Metadatos de favoritos Yupoo (para poder mostrarlos en FAVORITOS sin tener la página cargada). */
/** @type {Record<string, {id:string,title:string,thumb:string,url:string,photoCount:number}>} */
let yupooFavMeta = {};
/** @type {{ id: string, size: string, edition: "fan"|"player", playerId: string, source?: "yupoo", title?: string, url?: string }[]} */
let inquiryItems = [];

let catalogSearch = "";
let subfilterClub = "ALL";
let subfilterSeason = "ALL";

const FILTERS = [
  { l: FILTER_DISPONIBLES, match: () => true, mode: "curated" },
  { l: FILTER_YUPOO,       match: () => false, mode: "yupoo" },
  { l: "FAVORITOS",        match: s => favoriteIds.has(s.id), mode: "curated" },
  { l: "REBAJAS",          match: s => s.oldPrice != null && Number(s.oldPrice) > 0, mode: "curated" },
  { l: "LALIGA",           match: s => s.league === "LaLiga", mode: "curated" },
  { l: "PREMIER LEAGUE",   match: s => s.league === "Premier League", mode: "curated" },
  { l: "CHAMPIONS",        match: s => s.league === "Champions", mode: "curated" },
  { l: "SELECCIONES",      match: s => s.league === "Selección", mode: "curated" },
];

let activeFilter = FILTER_DISPONIBLES;

/** @type {{ total: number, pageSize: number, pages: number, syncedAt?: string } | null} */
let yupooMeta = null;
/** Cache-bust de assets Yupoo (syncedAt de meta.json) */
let yupooCacheBust = "";
/** @type {Map<number, Array<{id:string,title:string,thumb:string,url:string,photoCount:number}>>} */
const yupooPageCache = new Map();
/** @type {Array<{id:string,title:string,teamId?:string|null,haystack?:string}> | null} */
let yupooSearchIndex = null;
/** @type {Record<string, number> | null} */
let yupooIdToPage = null;
let yupooPage = 1;
let yupooLoadToken = 0;
/** @type {{ id: string, name: string, aliases: string[], count: number, thumb: string, featured?: boolean, sortOrder?: number }[] | null} */
let yupooTeams = null;
let yupooUnmatchedCount = 0;
/** @type {{ teams: Array<{id:string,name:string,aliases:string[],hidden?:boolean,featured?:boolean,sortOrder?:number}>, hideTitleContains: string[], hideGroupIds: string[], featuredGroupIds: string[] } | null} */
let yupooCuration = null;
/** null = vista de equipos; id de equipo o YUPOO_TEAM_OTHER = camisas de ese equipo */
let yupooSelectedTeamId = null;
/** Filtros dentro de las camisas de un equipo */
let yupooShirtFilters = {
  kit: "ALL",
  audience: "ALL",
  version: "ALL",
  sleeve: "ALL",
  edition: "ALL",
};
/** Cache de ítems Yupoo vistos (para modal / consulta) */
const yupooItemById = new Map();

/** Ruta de producto en hash: #/camisa/:id */
let productModalOpenId = null;
let defaultDocumentTitle = "";

const QUALITY_BADGE_HTML = `<span class="quality-badge" title="Tejido y acabado premium de la colección 90 Minutos (no es una valoración de usuarios)"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>CALIDAD PREMIUM</span>`;

function getOutOfStock(s) {
  return s.outOfStock || [];
}

function isSizeInStock(s, size) {
  return !getOutOfStock(s).includes(size);
}

function firstInStockSize(s) {
  return s.sizes.find(sz => isSizeInStock(s, sz)) || s.sizes[0];
}

function buildSizeButtonsHTML(s, selectedSize, className = "") {
  const sel = selectedSize && isSizeInStock(s, selectedSize) ? selectedSize : firstInStockSize(s);
  const extra = className ? ` ${className}` : "";
  return s.sizes.map(z => {
    const oos = !isSizeInStock(s, z);
    const active = z === sel && !oos;
    const cls = `size-opt${extra}${active ? " active" : ""}${oos ? " size-opt--oos" : ""}`;
    const dis = oos ? " disabled aria-disabled=\"true\"" : "";
    return `<button type="button" class="${cls}" data-size="${z}"${dis}>${z}</button>`;
  }).join("");
}

function getProductIdFromHash() {
  const m = /^#\/?camisa\/([^/?#]+)/.exec(location.hash);
  return m ? decodeURIComponent(m[1]) : null;
}

function syncProductRoute() {
  const id = getProductIdFromHash();
  if (id && getShirt(id)) {
    if (productModalOpenId === id) return;
    openProductModal(id, { fromRoute: true });
  } else if (productModalOpenId !== null) {
    closeProductModal({ fromRoute: true });
  }
}

// ---------- Theme ----------
(function initTheme() {
  const stored = localStorage.getItem("90min-theme");
  const theme = stored || "dark";
  document.documentElement.dataset.theme = theme;
})();

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_FAV);
    if (raw) favoriteIds = new Set(JSON.parse(raw));
  } catch (_) {}
  try {
    const rawMeta = localStorage.getItem(STORAGE_YUPOO_FAV);
    if (rawMeta) {
      const parsed = JSON.parse(rawMeta);
      if (parsed && typeof parsed === "object") {
        yupooFavMeta = parsed;
        rememberYupooItems(Object.values(yupooFavMeta));
      }
    }
  } catch (_) {}
}

function saveFavorites() {
  localStorage.setItem(STORAGE_FAV, JSON.stringify([...favoriteIds]));
}

function saveYupooFavMeta() {
  localStorage.setItem(STORAGE_YUPOO_FAV, JSON.stringify(yupooFavMeta));
}

function yupooFavId(albumId) {
  return `yupoo:${albumId}`;
}

function isYupooFavorite(albumId) {
  return favoriteIds.has(yupooFavId(albumId));
}

function getYupooFavoriteItems() {
  return Object.values(yupooFavMeta).filter((it) => it?.id && favoriteIds.has(yupooFavId(it.id)));
}

function toggleFavorite(id) {
  if (favoriteIds.has(id)) favoriteIds.delete(id);
  else favoriteIds.add(id);
  saveFavorites();
  updateHeaderBadges();
  const card = document.querySelector(`.card[data-id="${String(id).replace(/"/g, "")}"]`);
  if (card) {
    card.querySelector(".heart")?.classList.toggle("is-fav", favoriteIds.has(id));
    card.classList.toggle("card--fav", favoriteIds.has(id));
  }
  if (activeFilter === "FAVORITOS") renderGrid();
}

function toggleYupooFavorite(albumOrGroupId) {
  const group = getYupooItem(albumOrGroupId) || normalizeYupooGroup(yupooFavMeta[String(albumOrGroupId)]);
  if (!group) return;
  const id = String(group.id);
  const fid = yupooFavId(id);
  if (favoriteIds.has(fid)) {
    favoriteIds.delete(fid);
    delete yupooFavMeta[id];
  } else {
    favoriteIds.add(fid);
    yupooFavMeta[id] = {
      id: group.id,
      title: group.title || "",
      thumb: group.thumb || group.variants?.[0]?.thumb || "",
      url: group.variants?.[0]?.url || group.url || "",
      photoCount: group.photoCount || group.variants?.[0]?.photoCount || 0,
      variantCount: group.variantCount || group.variants?.length || 1,
      variants: group.variants || [],
    };
    rememberYupooItems([yupooFavMeta[id]]);
  }
  saveFavorites();
  saveYupooFavMeta();
  updateHeaderBadges();

  const card = document.querySelector(`.card--yupoo[data-yupoo-id="${id.replace(/"/g, "")}"]`);
  if (card) {
    card.querySelector(".heart")?.classList.toggle("is-fav", favoriteIds.has(fid));
    card.classList.toggle("card--fav", favoriteIds.has(fid));
  }
  const modalFav = document.getElementById("modal-toggle-fav-yupoo");
  if (modalFav && productModalOpenId === fid) {
    modalFav.textContent = favoriteIds.has(fid) ? "Quitar de favoritos" : "Guardar en favoritos";
  }
  if (activeFilter === "FAVORITOS") renderGrid();
}

function loadInquiry() {
  try {
    const raw = localStorage.getItem(STORAGE_INQUIRY);
    if (raw) {
      inquiryItems = JSON.parse(raw).map(it => ({
        id: it.id,
        size: it.size,
        edition: it.edition === "player" ? "player" : "fan",
        playerId: typeof it.playerId === "string" ? it.playerId : "none",
        source: it.source === "yupoo" || String(it.id).startsWith("yupoo:") ? "yupoo" : undefined,
        title: typeof it.title === "string" ? it.title : undefined,
        url: typeof it.url === "string" ? it.url : undefined,
      }));
    }
  } catch (_) {}
}

function saveInquiry() {
  localStorage.setItem(STORAGE_INQUIRY, JSON.stringify(inquiryItems));
}

function getShirt(id) {
  return SHIRTS.find(s => s.id === id);
}

function isYupooMode() {
  return activeFilter === FILTER_YUPOO;
}

function rememberYupooItems(items) {
  if (!Array.isArray(items)) return;
  for (const it of items) {
    if (!it?.id) continue;
    const group = normalizeYupooGroup(it);
    yupooItemById.set(String(group.id), group);
    for (const v of group.variants) {
      if (!v?.id) continue;
      yupooItemById.set(String(v.id), { ...v, _groupId: group.id });
    }
  }
}

function normalizeYupooGroup(item) {
  if (!item) return null;
  if (Array.isArray(item.variants) && item.variants.length) {
    return {
      ...item,
      id: String(item.id),
      title: item.title || item.variants[0]?.title || "",
      thumb: item.thumb || item.variants[0]?.thumb || "",
      variantCount: item.variants.length,
      variants: item.variants.map((v) => ({
        id: String(v.id),
        title: v.title || item.title || "",
        thumb: v.thumb || item.thumb || "",
        url: v.url || "",
        photoCount: Number(v.photoCount) || 0,
        label: v.label || "Estándar",
      })),
    };
  }
  // Álbum suelto (favoritos antiguos / datos previos al agrupado)
  return {
    id: String(item.id),
    title: item.title || "",
    thumb: item.thumb || "",
    url: item.url || "",
    photoCount: Number(item.photoCount) || 0,
    variantCount: 1,
    variants: [{
      id: String(item.id),
      title: item.title || "",
      thumb: item.thumb || "",
      url: item.url || "",
      photoCount: Number(item.photoCount) || 0,
      label: "Estándar",
    }],
  };
}

function getYupooItem(id) {
  const raw = String(id || "").replace(/^yupoo:/, "");
  const hit = yupooItemById.get(raw);
  if (!hit) return null;
  if (hit._groupId) return yupooItemById.get(String(hit._groupId)) || null;
  return normalizeYupooGroup(hit);
}

function getYupooVariant(group, variantId) {
  if (!group?.variants?.length) return null;
  return group.variants.find((v) => String(v.id) === String(variantId)) || group.variants[0];
}

/** Una opción por etiqueta (Fan, Player…); si hay duplicados del proveedor, prioriza más fotos. */
function uniqueYupooVariants(group) {
  const list = group?.variants || [];
  const byLabel = new Map();
  for (const v of list) {
    const key = v.label || v.title || v.id;
    const prev = byLabel.get(key);
    if (!prev || (v.photoCount || 0) > (prev.photoCount || 0)) byLabel.set(key, v);
  }
  return [...byLabel.values()];
}

/** photo.yupoo.com bloquea hotlink; servir vía /api/yupoo-img */
function yupooProxiedThumb(url) {
  if (!url || typeof url !== "string") return "";
  try {
    const u = new URL(url, "https://photo.yupoo.com");
    if (u.hostname !== "photo.yupoo.com") return url;
    return `/api/yupoo-img?u=${encodeURIComponent(u.href)}`;
  } catch {
    return url;
  }
}

function yupooAssetUrl(path) {
  const base = String(path || "");
  if (!yupooCacheBust) return base;
  return `${base}${base.includes("?") ? "&" : "?"}v=${yupooCacheBust}`;
}

function invalidateYupooCaches() {
  yupooSearchIndex = null;
  yupooIdToPage = null;
  yupooTeams = null;
  yupooCuration = null;
  yupooUnmatchedCount = 0;
  yupooPageCache.clear();
  yupooItemById.clear();
}

async function loadYupooMeta() {
  if (yupooMeta) return yupooMeta;
  const res = await fetch(YUPOO_META_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("yupoo-meta");
  const data = await res.json();
  yupooMeta = data;
  yupooCacheBust = encodeURIComponent(String(data?.syncedAt || data?.pages || "1"));
  return yupooMeta;
}

async function loadYupooPage(n) {
  await loadYupooMeta();
  if (yupooPageCache.has(n)) return yupooPageCache.get(n);
  const res = await fetch(yupooAssetUrl(YUPOO_PAGE_URL(n)), { cache: "force-cache" });
  if (!res.ok) throw new Error(`yupoo-page-${n}`);
  const list = await res.json();
  const items = Array.isArray(list) ? list : [];
  yupooPageCache.set(n, items);
  rememberYupooItems(items);
  return items;
}

async function loadYupooSearchIndex() {
  await loadYupooMeta();
  if (yupooSearchIndex) return yupooSearchIndex;
  const res = await fetch(yupooAssetUrl(YUPOO_SEARCH_URL), { cache: "force-cache" });
  if (!res.ok) throw new Error("yupoo-search");
  const list = await res.json();
  yupooSearchIndex = Array.isArray(list) ? list : [];
  return yupooSearchIndex;
}

async function loadYupooIdMap() {
  await loadYupooMeta();
  if (yupooIdToPage) return yupooIdToPage;
  const res = await fetch(yupooAssetUrl(YUPOO_ID_MAP_URL), { cache: "force-cache" });
  if (!res.ok) throw new Error("yupoo-idmap");
  yupooIdToPage = await res.json();
  return yupooIdToPage;
}

async function loadYupooTeams() {
  await loadYupooMeta();
  if (yupooTeams) return yupooTeams;
  const res = await fetch(yupooAssetUrl(YUPOO_TEAMS_URL), { cache: "force-cache" });
  if (!res.ok) throw new Error("yupoo-teams");
  const data = await res.json();
  yupooTeams = Array.isArray(data?.teams) ? data.teams : [];
  yupooUnmatchedCount = Number(data?.unmatchedGroups) || 0;
  return yupooTeams;
}

function curationStringList(raw, key) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const v = item[key] ?? item.word ?? item.id ?? item.value;
        return v != null ? String(v).trim() : "";
      }
      return "";
    })
    .filter(Boolean);
}

async function loadYupooCuration() {
  await loadYupooMeta();
  if (yupooCuration) return yupooCuration;
  try {
    const res = await fetch(yupooAssetUrl(YUPOO_CURATION_URL), { cache: "no-store" });
    if (!res.ok) throw new Error("yupoo-curation");
    const raw = await res.json();
    const teams = Array.isArray(raw?.teams)
      ? raw.teams.map((t, i) => ({
          id: String(t?.id || `team-${i + 1}`),
          name: String(t?.name || t?.id || ""),
          aliases: typeof t?.aliases === "string"
            ? t.aliases.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean)
            : (Array.isArray(t?.aliases) ? t.aliases.map((a) => String(a).toLowerCase()) : []),
          hidden: t?.hidden === true || t?.hidden === "true" || t?.hidden === "yes",
          featured: t?.featured === true || t?.featured === "true" || t?.featured === "yes",
          sortOrder: Number(t?.sortOrder) || i + 1,
        }))
      : [];
    yupooCuration = {
      teams,
      hideTitleContains: curationStringList(raw?.hideTitleContains, "word").map((s) => s.toLowerCase()),
      hideGroupIds: curationStringList(raw?.hideGroupIds, "id"),
      featuredGroupIds: curationStringList(raw?.featuredGroupIds, "id"),
    };
  } catch (_) {
    yupooCuration = { teams: [], hideTitleContains: [], hideGroupIds: [], featuredGroupIds: [] };
  }
  return yupooCuration;
}

function isYupooRowHiddenByCuration(row, curation) {
  if (!row || !curation) return false;
  const id = String(row.id || "");
  if (id && curation.hideGroupIds.includes(id)) return true;
  const hay = `${row.haystack || ""} ${row.title || ""}`.toLowerCase();
  for (const needle of curation.hideTitleContains || []) {
    if (needle && hay.includes(needle)) return true;
  }
  if (row.teamId) {
    const team = (curation.teams || []).find((t) => t.id === row.teamId);
    if (team?.hidden) return true;
  }
  return false;
}

function getSelectedYupooTeam() {
  if (!yupooSelectedTeamId) return null;
  if (yupooSelectedTeamId === YUPOO_TEAM_OTHER) {
    return { id: YUPOO_TEAM_OTHER, name: "Otros modelos", count: 0, thumb: "", aliases: [] };
  }
  return (yupooTeams || []).find((t) => t.id === yupooSelectedTeamId) || null;
}

/** Filtra el índice por equipo; si el índice viejo no trae teamId, usa aliases. */
function filterIndexBySelectedTeam(index) {
  if (!yupooSelectedTeamId) return index;
  if (yupooSelectedTeamId === YUPOO_TEAM_OTHER) {
    const anyTeamId = index.some((row) => row.teamId);
    if (!anyTeamId) return [];
    return index.filter((row) => !row.teamId);
  }

  const byId = index.filter((row) => row.teamId === yupooSelectedTeamId);
  if (byId.length) return byId;

  const team = getSelectedYupooTeam();
  const aliases = team ? [team.name, ...(team.aliases || [])].filter(Boolean) : [];
  if (!aliases.length) return [];
  return index.filter((row) => {
    const text = `${row.haystack || ""} ${row.title || ""}`;
    return aliases.some((alias) => matchesYupooSearch(text, alias));
  });
}

function selectYupooTeam(teamId) {
  yupooSelectedTeamId = teamId || null;
  yupooShirtFilters = { kit: "ALL", audience: "ALL", version: "ALL", sleeve: "ALL", edition: "ALL" };
  yupooPage = 1;
  renderGrid();
  document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearYupooTeam() {
  selectYupooTeam(null);
}

function resetYupooShirtFilters() {
  yupooShirtFilters = { kit: "ALL", audience: "ALL", version: "ALL", sleeve: "ALL", edition: "ALL" };
}

function normalizeSearchText(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/(\d)[-\s]*star/g, "$1 star")
    .replace(/[–—_/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchTokens(q) {
  return normalizeSearchText(q).split(" ").filter(Boolean);
}

/** Todas las palabras de la query deben aparecer en el texto (AND), ignorando guiones/acentos. */
function matchesYupooSearch(text, q) {
  const tokens = searchTokens(q);
  if (!tokens.length) return true;
  const hay = normalizeSearchText(text);
  return tokens.every((t) => hay.includes(t));
}

/**
 * Si la query incluye un equipo + algo más ("españa 2 star"),
 * devolvemos ese equipo para abrir su catálogo filtrado.
 */
function matchTeamFromSearchQuery(q, teams) {
  const tokens = searchTokens(q);
  if (tokens.length < 2 || !teams?.length) return null;
  let best = null;
  for (const team of teams) {
    const aliases = [team.name, ...(team.aliases || [])];
    for (const alias of aliases) {
      const aliasToks = searchTokens(alias);
      if (!aliasToks.length) continue;
      if (!aliasToks.every((t) => tokens.includes(t))) continue;
      const score = aliasToks.join(" ").length;
      if (!best || score > best.score) best = { team, score, aliasToks };
    }
  }
  if (!best) return null;
  const remaining = tokens.filter((t) => !best.aliasToks.includes(t));
  if (!remaining.length) return null;
  return best.team;
}

/** Atributos deducidos del título/haystack (sin LLM). */
function yupooHaystackFlags(haystack) {
  const t = String(haystack || "").toLowerCase();
  return {
    home: /\bhome\b/.test(t),
    away: /\baway\b/.test(t),
    third: /\bthird\b|\bsecond away\b|\b2nd away\b/.test(t),
    kids: /\bkids?\b|\bkid kits?\b|\bbaby\b/.test(t),
    women: /women'?s?|\bmujer\b/.test(t),
    player: /player\s+version/.test(t),
    longSleeve: /long[-\s]?sleeve/.test(t),
    twoStar: /2[-\s]?star|champion edition/.test(t),
    worldCup: /world\s*cup|\bmundial\b/.test(t),
    goalkeeper: /goalkeeper|\bportero\b|\bgk\b/.test(t),
    retro: /\bretro\b/.test(t),
  };
}

function matchesYupooShirtFilters(row) {
  const f = yupooShirtFilters;
  if (Object.values(f).every((v) => v === "ALL")) return true;
  const flags = yupooHaystackFlags(row.haystack || row.title || "");
  if (f.kit === "home" && !flags.home) return false;
  if (f.kit === "away" && !flags.away) return false;
  if (f.kit === "third" && !flags.third) return false;
  if (f.kit === "gk" && !flags.goalkeeper) return false;
  // Público / versión / manga = "tiene al menos esa variante" (los grupos mezclados siguen visibles)
  if (f.audience === "kids" && !flags.kids) return false;
  if (f.audience === "women" && !flags.women) return false;
  if (f.version === "player" && !flags.player) return false;
  if (f.sleeve === "long" && !flags.longSleeve) return false;
  if (f.edition === "2star" && !flags.twoStar) return false;
  if (f.edition === "worldcup" && !flags.worldCup) return false;
  if (f.edition === "retro" && !flags.retro) return false;
  return true;
}

async function hydrateYupooIds(ids) {
  const map = await loadYupooIdMap();
  const pagesNeeded = new Set();
  for (const id of ids) {
    if (yupooItemById.has(String(id))) continue;
    const p = map[String(id)];
    if (p) pagesNeeded.add(p);
  }
  await Promise.all([...pagesNeeded].map((p) => loadYupooPage(p)));
  return ids.map((id) => getYupooItem(id)).filter(Boolean);
}

function getFanPrice(s) {
  return s.price;
}

function getPlayerPrice(s) {
  return s.pricePlayer ?? s.price * 1.25;
}

function getEditionPrice(s, edition) {
  return edition === "player" ? getPlayerPrice(s) : getFanPrice(s);
}

function getPlayerOption(s, playerId) {
  return (s.players || []).find(p => p.id === playerId) || P_NONE;
}

function playerLineSuffix(s, playerId) {
  const p = getPlayerOption(s, playerId);
  if (p.id === "none") return "";
  return ` · ${p.name} #${p.number || "—"}`;
}

function buildPlayerOptionsHTML(s, selectedId) {
  const opts = s.players || [P_NONE];
  return opts.map(p => {
    const label = p.id === "none" ? "— Sin jugador —" : `${p.name}${p.number ? " #" + p.number : ""}`;
    return `<option value="${p.id}"${p.id === selectedId ? " selected" : ""}>${label}</option>`;
  }).join("");
}

function instagramDmUrl() {
  return `https://ig.me/m/${INSTAGRAM_USER}`;
}

function formatBsNumber(n) {
  return new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function lineBsApprox(usdAmount) {
  if (fxFetchFailed) return "Equivalente en Bs.: no disponible ahora";
  if (usdBsParalelo == null) return "Equivalente en Bs.: cargando…";
  const bs = usdAmount * usdBsParalelo;
  return `≈ ${formatBsNumber(bs)} Bs. (paralelo · ref.)`;
}

async function fetchUsdBsRate() {
  const hdr = document.getElementById("fx-rate-text");
  const upd = document.getElementById("fx-rate-updated");
  try {
    const res = await fetch(FX_DOLARES_URL);
    if (!res.ok) throw new Error("http");
    const data = await res.json();
    const row = Array.isArray(data)
      ? data.find(x => x.moneda === "USD" && x.fuente === "paralelo" && x.promedio != null)
        || data.find(x => x.moneda === "USD" && x.fuente === "oficial" && x.promedio != null)
      : null;
    if (!row) throw new Error("parse");
    usdBsParalelo = Number(row.promedio);
    fxFetchFailed = false;
    const d = row.fechaActualizacion ? new Date(row.fechaActualizacion) : new Date();
    fxUpdateLabel = d.toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" });
    if (hdr) hdr.textContent = `1 USD ≈ ${formatBsNumber(usdBsParalelo)} Bs. (paralelo)`;
    if (upd) upd.textContent = `Actualizado ${fxUpdateLabel}`;
  } catch (_) {
    fxFetchFailed = true;
    usdBsParalelo = null;
    if (hdr) hdr.textContent = "Cotización no disponible · reintento en 1 min";
    if (upd) upd.textContent = "";
  }
  refreshAllFxDisplays();
}

function refreshAllFxDisplays() {
  document.querySelectorAll(".js-card-price-bs").forEach(el => {
    const card = el.closest(".card");
    if (!card) return;
    const shirt = getShirt(card.dataset.id);
    if (!shirt) return;
    const ed = card.dataset.edition === "player" ? "player" : "fan";
    el.textContent = lineBsApprox(getEditionPrice(shirt, ed));
  });
  const mbs = document.querySelector(".js-modal-price-bs");
  const live = document.querySelector(".modal-price-live");
  if (mbs && live) {
    const pv = parseFloat(live.textContent);
    if (!Number.isNaN(pv)) mbs.textContent = lineBsApprox(pv);
  }
  syncInquiryMessagePreview();
}

function buildProductLine(s, size, edition, playerId) {
  const pv = getEditionPrice(s, edition);
  const priceStr = s.oldPrice && edition === "fan"
    ? `${pv.toFixed(2)} USD (antes ${s.oldPrice.toFixed(2)} USD)`
    : `${pv.toFixed(2)} USD`;
  const badgeStr = s.badge ? ` · ${s.badge}` : "";
  const ed = edition === "player" ? "Player" : "Fan";
  let line = `• ${s.team} · ${s.league} · ${s.season} · ${ed}${playerLineSuffix(s, playerId)} · Talla ${size} · Precio ref.: ${priceStr}${badgeStr}`;
  if (!fxFetchFailed && usdBsParalelo != null) {
    line += ` (~${formatBsNumber(pv * usdBsParalelo)} Bs. ref. paralelo)`;
  }
  return line;
}

function buildInquiryMessage() {
  if (inquiryItems.length === 0) return "";
  const lines = inquiryItems.map((item) => {
    if (item.source === "yupoo" || String(item.id).startsWith("yupoo:")) {
      const title = item.title || getYupooItem(String(item.id).replace(/^yupoo:/, ""))?.title || item.id;
      return `• [Catálogo completo] ${title}`;
    }
    const s = getShirt(item.id);
    return s ? buildProductLine(s, item.size, item.edition || "fan", item.playerId || "none") : "";
  }).filter(Boolean);
  return `Hola 90 Minutos Sports 👋\n\nMe interesa consultar por:\n\n${lines.join("\n")}\n\n¡Gracias!`;
}

/**
 * Copia al portapapeles de forma compatible con HTTP, Safari e iOS.
 * Debe llamarse en el mismo tick que el click del usuario (sin await antes).
 */
function copyTextToClipboard(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "readonly");
  ta.style.cssText =
    "position:fixed;left:0;top:0;width:2px;height:2px;padding:0;border:0;opacity:0;font-size:16px;";
  document.body.appendChild(ta);
  ta.focus();

  const isIOS = /ipad|iphone|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) {
    const range = document.createRange();
    range.selectNodeContents(ta);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    ta.setSelectionRange(0, text.length);
  } else {
    ta.select();
    ta.setSelectionRange(0, text.length);
  }

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch (_) {
    ok = false;
  }
  document.body.removeChild(ta);

  return ok;
}

function syncInquiryMessagePreview() {
  const ta = document.getElementById("inquiry-msg-preview");
  if (!ta) return;
  ta.value = buildInquiryMessage();
}

function showToast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("toast--show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove("toast--show"), 3200);
}

function updateHeaderBadges() {
  const fc = document.getElementById("fav-count");
  const ic = document.getElementById("inquiry-count");
  if (fc) {
    const n = favoriteIds.size;
    fc.textContent = String(n);
    fc.hidden = n === 0;
  }
  if (ic) {
    const n = inquiryItems.length;
    ic.textContent = String(n);
    ic.hidden = n === 0;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadShirts();
  loadFavorites();
  loadInquiry();
  updateHeaderBadges();

  const btn = document.getElementById("theme-toggle");
  btn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("90min-theme", next);
  });

  function goToCatalogSection() {
    const cat = document.getElementById("catalogo");
    if (cat) cat.scrollIntoView({ behavior: "smooth" });
    else window.location.href = "catalogo.html#catalogo";
  }

  document.getElementById("btn-favorites")?.addEventListener("click", () => {
    if (favoriteIds.size === 0) {
      showToast("Aún no tienes favoritos. Pulsa el corazón en una camisa.");
      goToCatalogSection();
      return;
    }
    activeFilter = "FAVORITOS";
    buildFilters();
    buildCatalogRefine();
    renderGrid();
    goToCatalogSection();
  });

  document.getElementById("btn-inquiry")?.addEventListener("click", () => openInquiryDrawer());

  document.querySelectorAll("[data-close-drawer]").forEach(el => {
    el.addEventListener("click", closeInquiryDrawer);
  });

  document.getElementById("btn-copy-msg")?.addEventListener("click", () => {
    const msg = buildInquiryMessage();
    if (!msg) {
      showToast("Añade al menos un modelo a tu consulta.");
      return;
    }
    const ok = copyTextToClipboard(msg);
    showToast(
      ok
        ? "Mensaje copiado al portapapeles."
        : "Selecciona el texto del recuadro inferior y copia con el menú del sistema."
    );
  });

  document.getElementById("btn-send-instagram")?.addEventListener("click", () => {
    const msg = buildInquiryMessage();
    if (!msg) {
      showToast("Añade al menos un modelo a tu consulta.");
      return;
    }
    const ok = copyTextToClipboard(msg);
    showToast(
      ok
        ? "Mensaje copiado. Abriendo Instagram… Pégalo en el chat."
        : "Abriendo Instagram… Copia el texto del recuadro inferior y pégalo en el chat."
    );
    window.open(instagramDmUrl(), "_blank", "noopener,noreferrer");
  });

  document.getElementById("cta-instagram")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.open(instagramDmUrl(), "_blank", "noopener,noreferrer");
  });
  const ctaIg = document.getElementById("cta-instagram");
  if (ctaIg) ctaIg.href = instagramDmUrl();

  const searchInput = document.getElementById("catalog-search");
  if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
      catalogSearch = searchInput.value;
      if (isYupooMode()) yupooPage = 1;
      renderGrid();
    }, 200));
  }
  document.getElementById("subfilter-club")?.addEventListener("change", (e) => {
    subfilterClub = e.target.value;
    renderGrid();
  });
  document.getElementById("subfilter-season")?.addEventListener("change", (e) => {
    subfilterSeason = e.target.value;
    renderGrid();
  });

  buildMarquee();
  if (document.getElementById("grid")) {
    buildFilters();
    buildCatalogRefine();
    renderGrid();
  }
  initParallax();
  initReveal();
  initModal();
  renderInquiryList();

  defaultDocumentTitle = document.title;
  window.addEventListener("hashchange", syncProductRoute);
  syncProductRoute();

  fetchUsdBsRate();
  setInterval(fetchUsdBsRate, 60 * 1000);
});

// ---------- Marquee ----------
function buildMarquee() {
  const track = document.getElementById("marquee");
  if (!track) return;
  const items = ["LALIGA","PREMIER LEAGUE","CHAMPIONS","SERIE A","BUNDESLIGA","EUROCOPA","MUNDIAL","COPA AMÉRICA"];
  const trophy = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h8M12 17v4M17 4h3v3a4 4 0 0 1-4 4M7 4H4v3a4 4 0 0 0 4 4M17 4H7v6a5 5 0 0 0 10 0z"/></svg>`;
  const html = [...items, ...items, ...items]
    .map(t => `<div class="item"><span>${t}</span>${trophy}</div>`)
    .join("");
  track.innerHTML = html;
}

// ---------- Filters ----------
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function getRefineOptions() {
  const f = FILTERS.find(x => x.l === activeFilter);
  const base = SHIRTS.filter(f.match);
  const clubs = [...new Set(base.map(s => s.club))].sort((a, b) => a.localeCompare(b));
  const seasons = [...new Set(base.map(s => s.season))].sort();
  seasons.reverse();
  return { clubs, seasons };
}

function buildCatalogRefine() {
  const wrap = document.getElementById("catalog-refine");
  if (!wrap) return;
  const refineRow = wrap.querySelector(".refine-row");
  const searchEl = document.getElementById("catalog-search");
  const isYupoo = isYupooMode();

  // Siempre visible: en Yupoo solo búsqueda; en el resto también Equipo/Temporada.
  wrap.hidden = false;
  if (refineRow) refineRow.hidden = isYupoo;

  if (searchEl) {
    searchEl.value = catalogSearch;
    searchEl.placeholder = isYupoo
      ? (yupooSelectedTeamId
        ? "Buscar dentro de este equipo…"
        : "Buscar equipo o camisa…")
      : "Buscar por equipo, temporada, liga…";
  }

  if (isYupoo) return;

  const { clubs, seasons } = getRefineOptions();
  const clubSel = document.getElementById("subfilter-club");
  const seaSel = document.getElementById("subfilter-season");
  if (!clubSel || !seaSel) return;
  if (subfilterClub !== "ALL" && !clubs.includes(subfilterClub)) subfilterClub = "ALL";
  if (subfilterSeason !== "ALL" && !seasons.includes(subfilterSeason)) subfilterSeason = "ALL";
  clubSel.innerHTML = `<option value="ALL">Todos los equipos</option>${clubs.map(c => `<option value="${c}">${c}</option>`).join("")}`;
  clubSel.value = subfilterClub;
  seaSel.innerHTML = `<option value="ALL">Todas las temporadas</option>${seasons.map(se => `<option value="${se}">${se}</option>`).join("")}`;
  seaSel.value = subfilterSeason;
}

function buildFilters() {
  const root = document.getElementById("filters");
  if (!root) return;
  root.innerHTML = FILTERS.map(f =>
    `<button type="button" class="filter ${f.l === activeFilter ? "active" : ""}" data-f="${f.l}">${f.l}</button>`
  ).join("");
  root.querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      activeFilter = b.dataset.f;
      catalogSearch = "";
      subfilterClub = "ALL";
      subfilterSeason = "ALL";
      yupooSelectedTeamId = null;
      resetYupooShirtFilters();
      yupooPage = 1;
      const searchEl = document.getElementById("catalog-search");
      if (searchEl) searchEl.value = "";
      buildFilters();
      buildCatalogRefine();
      renderGrid();
    });
  });
}

function getListForGrid() {
  const f = FILTERS.find(x => x.l === activeFilter);
  let list = SHIRTS.filter(f.match);
  const q = catalogSearch.trim().toLowerCase();
  if (q) {
    list = list.filter(s =>
      (s.team && s.team.toLowerCase().includes(q)) ||
      (s.club && s.club.toLowerCase().includes(q)) ||
      (s.season && String(s.season).toLowerCase().includes(q)) ||
      (s.league && s.league.toLowerCase().includes(q)));
  }
  if (subfilterClub !== "ALL") list = list.filter(s => s.club === subfilterClub);
  if (subfilterSeason !== "ALL") list = list.filter(s => s.season === subfilterSeason);
  return list;
}

function updateCardPricing(card, shirt) {
  const ed = card.dataset.edition === "player" ? "player" : "fan";
  const pv = getEditionPrice(shirt, ed);
  const pr = card.querySelector(".js-card-price");
  if (pr) pr.textContent = `${pv.toFixed(2)} $`;
  const oldEl = card.querySelector(".js-price-old");
  if (oldEl) oldEl.style.display = ed === "fan" && shirt.oldPrice ? "" : "none";
  const bsEl = card.querySelector(".js-card-price-bs");
  if (bsEl) bsEl.textContent = lineBsApprox(pv);
}

// ---------- Grid ----------
function setYupooPager(html) {
  let pager = document.getElementById("yupoo-pager");
  if (!pager) {
    const grid = document.getElementById("grid");
    if (!grid || !grid.parentElement) return;
    pager = document.createElement("div");
    pager.id = "yupoo-pager";
    pager.className = "yupoo-pager";
    grid.insertAdjacentElement("afterend", pager);
  }
  pager.hidden = !html;
  pager.innerHTML = html || "";
}

function bindYupooPager(totalPages) {
  const pager = document.getElementById("yupoo-pager");
  if (!pager) return;
  pager.querySelector("[data-yupoo-prev]")?.addEventListener("click", () => {
    if (yupooPage <= 1) return;
    yupooPage -= 1;
    renderGrid();
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  pager.querySelector("[data-yupoo-next]")?.addEventListener("click", () => {
    if (yupooPage >= totalPages) return;
    yupooPage += 1;
    renderGrid();
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  pager.querySelectorAll("[data-yupoo-goto]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.yupooGoto);
      if (!n || n === yupooPage) return;
      yupooPage = n;
      renderGrid();
      document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function yupooPagerHTML(page, totalPages, totalItems) {
  if (totalPages <= 1) {
    return `<p class="yupoo-pager-meta muted small">${totalItems.toLocaleString("es-ES")} modelos en el catálogo completo</p>`;
  }
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const nums = [];
  for (let i = start; i <= end; i++) nums.push(i);
  return `
    <p class="yupoo-pager-meta muted small">${totalItems.toLocaleString("es-ES")} modelos · página ${page} de ${totalPages}</p>
    <div class="yupoo-pager-controls">
      <button type="button" class="btn btn-ghost yupoo-page-btn" data-yupoo-prev ${page <= 1 ? "disabled" : ""}>Anterior</button>
      ${nums.map((n) =>
        `<button type="button" class="yupoo-page-num${n === page ? " active" : ""}" data-yupoo-goto="${n}">${n}</button>`
      ).join("")}
      <button type="button" class="btn btn-ghost yupoo-page-btn" data-yupoo-next ${page >= totalPages ? "disabled" : ""}>Siguiente</button>
    </div>`;
}

function bindYupooCards(grid) {
  grid.querySelectorAll(".card--yupoo").forEach((card) => {
    const id = card.dataset.yupooId;
    card.querySelector(".img")?.addEventListener("click", (e) => {
      if (e.target.closest(".heart")) return;
      openYupooModal(id);
    });
    card.querySelector(".open-detail")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openYupooModal(id);
    });
    card.querySelector(".add-quick")?.addEventListener("click", (e) => {
      e.stopPropagation();
      addYupooToInquiry(id);
    });
    const heart = card.querySelector(".heart");
    heart?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleYupooFavorite(id);
    });
    heart?.classList.toggle("is-fav", isYupooFavorite(id));
    card.classList.toggle("card--fav", isYupooFavorite(id));
  });
}

function yupooCardHTML(item, i) {
  const group = normalizeYupooGroup(item);
  const heart = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  const ig = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01"/></svg>`;
  const src = yupooProxiedThumb(group.thumb);
  const thumb = src
    ? `<img src="${escapeAttr(src)}" alt="${escapeAttr(group.title)}" loading="lazy" />`
    : `<div class="bg" style="background:linear-gradient(135deg,#1f2937,#111827 60%,#4b5563)"></div>`;
  const nVar = uniqueYupooVariants(group).length;
  const meta = nVar > 1 ? `${nVar} variantes` : (group.photoCount ? `${group.photoCount} fotos` : "Catálogo");
  const fav = isYupooFavorite(group.id);
  return `
  <article class="card card--yupoo${fav ? " card--fav" : ""}" data-yupoo-id="${escapeAttr(group.id)}" style="--d:${(i % 4) * 0.08}s">
    <div class="img">
      ${thumb}
      <div class="water">90MIN</div>
      <div class="top">
        <span>${nVar > 1 ? `<span class="badge-tag CONSULTA">×${nVar}</span>` : ""}</span>
        <button type="button" class="heart${fav ? " is-fav" : ""}" aria-label="Favorito">${heart}</button>
      </div>
      <button type="button" class="open-detail" aria-label="Ver detalle">Ver detalle</button>
      <button type="button" class="add-quick">${ig} Añadir a la consulta</button>
    </div>
    <div class="info">
      <div class="team">${escapeHtml(group.title)}</div>
      <div class="card-meta muted small">${meta}</div>
      <div class="price-row">
        <div class="price-block">
          <div class="price">Bajo consulta</div>
          <div class="price-bs muted small">Pedido bajo demanda</div>
        </div>
      </div>
    </div>
  </article>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

function addYupooToInquiry(groupOrVariantId, variantId) {
  const group = getYupooItem(groupOrVariantId);
  if (!group) {
    showToast("No se pudo añadir este modelo.");
    return;
  }
  const variant = getYupooVariant(group, variantId || group.variants?.[0]?.id);
  if (!variant) {
    showToast("No se pudo añadir este modelo.");
    return;
  }
  const unique = uniqueYupooVariants(group);
  const title = unique.length > 1 && variant.label
    ? `${group.title} · ${variant.label}`
    : (variant.title || group.title);
  inquiryItems.push({
    id: `yupoo:${variant.id}`,
    size: "—",
    edition: "fan",
    playerId: "none",
    source: "yupoo",
    title,
    url: variant.url,
  });
  saveInquiry();
  updateHeaderBadges();
  renderInquiryList();
  showToast("Añadido a tu consulta.");
}

/** Cache de galerías Yupoo: id → string[] (urls absolutas photo.yupoo.com) */
const yupooGalleryCache = new Map();

async function fetchYupooAlbumImages(id) {
  const key = String(id);
  if (yupooGalleryCache.has(key)) return yupooGalleryCache.get(key);
  const res = await fetch(`/api/yupoo-album?id=${encodeURIComponent(key)}`, { cache: "force-cache" });
  if (!res.ok) throw new Error(`album ${res.status}`);
  const data = await res.json();
  const images = Array.isArray(data?.images) ? data.images.filter(Boolean) : [];
  yupooGalleryCache.set(key, images);
  return images;
}

function bindYupooGallery(root, images, title) {
  const main = root.querySelector(".yupoo-gallery-main");
  const thumbs = root.querySelectorAll(".yupoo-gallery-thumb");
  if (!main || !images.length) return;
  let index = 0;
  const show = (i) => {
    index = (i + images.length) % images.length;
    main.src = yupooProxiedThumb(images[index]);
    main.alt = `${title} · foto ${index + 1}`;
    thumbs.forEach((btn, ti) => btn.classList.toggle("active", ti === index));
  };
  thumbs.forEach((btn) => {
    btn.addEventListener("click", () => show(Number(btn.dataset.index) || 0));
  });
  root.querySelector("[data-yupoo-prev]")?.addEventListener("click", () => show(index - 1));
  root.querySelector("[data-yupoo-next]")?.addEventListener("click", () => show(index + 1));
}

function openYupooModal(id) {
  const group = getYupooItem(id);
  const modal = document.getElementById("product-modal");
  const body = document.getElementById("modal-body");
  if (!group || !modal || !body) return;

  let selectedVariantId = uniqueYupooVariants(group)[0]?.id || group.variants?.[0]?.id || String(id).replace(/^yupoo:/, "");
  const ig = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01"/></svg>`;
  const modalToken = `yupoo:${group.id}`;
  productModalOpenId = modalToken;

  function currentVariant() {
    return getYupooVariant(group, selectedVariantId);
  }

  function variantOptionsHTML() {
    return uniqueYupooVariants(group).map((v) =>
      `<option value="${escapeAttr(v.id)}"${String(v.id) === String(selectedVariantId) ? " selected" : ""}>${escapeHtml(v.label || v.title)}</option>`
    ).join("");
  }

  function loadGalleryForVariant(variant) {
    const galleryRoot = body.querySelector("[data-yupoo-gallery]");
    const status = body.querySelector(".yupoo-gallery-status");
    const thumbsWrap = body.querySelector(".yupoo-gallery-thumbs");
    const countEl = body.querySelector(".js-yupoo-photo-count");
    const main = galleryRoot?.querySelector(".yupoo-gallery-main");
    const prev = galleryRoot?.querySelector("[data-yupoo-prev]");
    const next = galleryRoot?.querySelector("[data-yupoo-next]");
    if (!galleryRoot || !variant) return;

    if (status) {
      status.hidden = false;
      status.textContent = "Cargando fotos del álbum…";
    }
    if (thumbsWrap) {
      thumbsWrap.hidden = true;
      thumbsWrap.innerHTML = "";
    }
    if (prev) prev.hidden = true;
    if (next) next.hidden = true;
    if (main && variant.thumb) {
      main.src = yupooProxiedThumb(variant.thumb);
      main.alt = variant.title || group.title;
    }

    fetchYupooAlbumImages(variant.id)
      .then((images) => {
        if (productModalOpenId !== modalToken) return;
        if (String(selectedVariantId) !== String(variant.id)) return;

        const list = images.length ? images : (variant.thumb ? [variant.thumb] : []);
        if (!list.length) {
          if (status) status.textContent = "No se encontraron fotos del álbum.";
          return;
        }
        if (countEl) {
          const nVar = uniqueYupooVariants(group).length;
          countEl.textContent = nVar > 1
            ? `${list.length} foto${list.length === 1 ? "" : "s"} · ${nVar} variantes`
            : `${list.length} foto${list.length === 1 ? "" : "s"}`;
        }
        if (status) status.hidden = true;
        if (list.length > 1) {
          if (prev) prev.hidden = false;
          if (next) next.hidden = false;
        }
        if (thumbsWrap && list.length > 1) {
          thumbsWrap.hidden = false;
          thumbsWrap.innerHTML = list.map((url, i) =>
            `<button type="button" class="yupoo-gallery-thumb${i === 0 ? " active" : ""}" data-index="${i}" aria-label="Foto ${i + 1}">
              <img src="${escapeAttr(yupooProxiedThumb(url))}" alt="" loading="lazy" />
            </button>`
          ).join("");
        }
        if (main) {
          main.src = yupooProxiedThumb(list[0]);
          main.alt = `${group.title} · foto 1`;
        }
        bindYupooGallery(galleryRoot, list, group.title);
      })
      .catch(() => {
        if (productModalOpenId !== modalToken) return;
        if (status) status.textContent = "No se pudieron cargar las fotos.";
      });
  }

  function renderModal() {
    const variant = currentVariant();
    const fallbackSrc = yupooProxiedThumb(variant?.thumb || group.thumb);
    const unique = uniqueYupooVariants(group);
    const nVar = unique.length || group.variantCount || group.variants?.length || 1;
    const variantField = nVar > 1
      ? `<div class="modal-player-field">
          <label class="modal-label" for="modal-yupoo-variant">Variante</label>
          <select id="modal-yupoo-variant" class="player-pick">${variantOptionsHTML()}</select>
        </div>`
      : "";

    body.innerHTML = `
      <div class="modal-visual modal-visual--yupoo" data-yupoo-gallery>
        <div class="yupoo-gallery">
          <div class="yupoo-gallery-stage">
            ${fallbackSrc
              ? `<img class="yupoo-gallery-main" src="${escapeAttr(fallbackSrc)}" alt="${escapeAttr(group.title)}" />`
              : `<div class="yupoo-gallery-placeholder"></div>`}
            <button type="button" class="yupoo-gallery-nav yupoo-gallery-nav--prev" data-yupoo-prev aria-label="Foto anterior" hidden>‹</button>
            <button type="button" class="yupoo-gallery-nav yupoo-gallery-nav--next" data-yupoo-next aria-label="Foto siguiente" hidden>›</button>
          </div>
          <p class="yupoo-gallery-status muted small">Cargando fotos del álbum…</p>
          <div class="yupoo-gallery-thumbs" hidden></div>
        </div>
      </div>
      <div class="modal-info">
        <h3 id="modal-title">${escapeHtml(group.title)}</h3>
        <p class="muted small js-yupoo-photo-count">${nVar > 1 ? `${nVar} variantes` : (variant?.photoCount ? `${variant.photoCount} fotos en el álbum` : "Modelo")}</p>
        <div class="modal-price-wrap">
          <div class="modal-price-row">
            <span class="price modal-price-live">Bajo consulta</span>
            <span class="badge-tag CONSULTA">CONSULTA</span>
          </div>
        </div>
        <p class="muted small modal-desc">Este modelo forma parte del catálogo completo. Consulta disponibilidad, tallas y precio por Instagram. No forma parte del stock «Disponibles» curado.</p>
        ${variantField}
        <div class="modal-actions">
          <button type="button" class="btn btn-primary btn-modal-ig" id="modal-add-inquiry">${ig} Añadir a la consulta</button>
          <button type="button" class="btn btn-ghost" id="modal-toggle-fav-yupoo">${isYupooFavorite(group.id) ? "Quitar de favoritos" : "Guardar en favoritos"}</button>
        </div>
      </div>`;

    document.getElementById("modal-yupoo-variant")?.addEventListener("change", (e) => {
      selectedVariantId = e.target.value;
      loadGalleryForVariant(currentVariant());
    });
    document.getElementById("modal-add-inquiry")?.addEventListener("click", () => addYupooToInquiry(group.id, selectedVariantId));
    document.getElementById("modal-toggle-fav-yupoo")?.addEventListener("click", () => toggleYupooFavorite(group.id));
    loadGalleryForVariant(variant);
  }

  renderModal();
  document.title = `${group.title} · 90 Minutos Sports`;
  modal.classList.add("modal--open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function setYupooNav(html) {
  let nav = document.getElementById("yupoo-nav");
  if (!nav) {
    const grid = document.getElementById("grid");
    if (!grid || !grid.parentElement) return;
    nav = document.createElement("div");
    nav.id = "yupoo-nav";
    nav.className = "yupoo-nav";
    grid.insertAdjacentElement("beforebegin", nav);
  }
  nav.hidden = !html;
  nav.innerHTML = html || "";
}

function yupooTeamCardHTML(team, i) {
  const src = yupooProxiedThumb(team.thumb);
  const thumb = src
    ? `<img src="${escapeAttr(src)}" alt="${escapeAttr(team.name)}" loading="lazy" />`
    : `<div class="bg" style="background:linear-gradient(135deg,#1f2937,#111827 60%,#4b5563)"></div>`;
  const countLabel = `${Number(team.count || 0).toLocaleString("es-ES")} modelo${team.count === 1 ? "" : "s"}`;
  return `
  <article class="card card--yupoo-team" data-yupoo-team="${escapeAttr(team.id)}" style="--d:${(i % 4) * 0.08}s">
    <div class="img">
      ${thumb}
      <div class="water">90MIN</div>
      <button type="button" class="open-detail" aria-label="Ver camisas de ${escapeAttr(team.name)}">Ver camisas</button>
    </div>
    <div class="info">
      <div class="team">${escapeHtml(team.name)}</div>
      <div class="card-meta muted small">${countLabel}</div>
    </div>
  </article>`;
}

function bindYupooTeamCards(grid) {
  grid.querySelectorAll(".card--yupoo-team").forEach((card) => {
    const id = card.dataset.yupooTeam;
    const open = () => selectYupooTeam(id);
    card.querySelector(".img")?.addEventListener("click", open);
    card.querySelector(".open-detail")?.addEventListener("click", (e) => {
      e.stopPropagation();
      open();
    });
  });
}

function yupooFilterSelect(id, label, value, options) {
  if (!options.length) return "";
  const opts = [{ value: "ALL", label: "Todas" }, ...options]
    .map((o) => `<option value="${escapeAttr(o.value)}"${o.value === value ? " selected" : ""}>${escapeHtml(o.label)}</option>`)
    .join("");
  return `<div class="yupoo-filter-field">
    <label for="${id}">${escapeHtml(label)}</label>
    <select id="${id}" class="refine-select yupoo-filter-select" data-yupoo-filter="${escapeAttr(id.replace("yupoo-filter-", ""))}">${opts}</select>
  </div>`;
}

function buildYupooShirtFilterOptions(rows) {
  const tallies = {
    home: 0, away: 0, third: 0, gk: 0,
    kids: 0, women: 0,
    player: 0,
    long: 0,
    twoStar: 0, worldCup: 0, retro: 0,
  };
  for (const row of rows) {
    const f = yupooHaystackFlags(row.haystack || row.title || "");
    if (f.home) tallies.home++;
    if (f.away) tallies.away++;
    if (f.third) tallies.third++;
    if (f.goalkeeper) tallies.gk++;
    if (f.kids) tallies.kids++;
    if (f.women) tallies.women++;
    if (f.player) tallies.player++;
    if (f.longSleeve) tallies.long++;
    if (f.twoStar) tallies.twoStar++;
    if (f.worldCup) tallies.worldCup++;
    if (f.retro) tallies.retro++;
  }
  const kit = [];
  if (tallies.home) kit.push({ value: "home", label: `Local (${tallies.home})` });
  if (tallies.away) kit.push({ value: "away", label: `Visitante (${tallies.away})` });
  if (tallies.third) kit.push({ value: "third", label: `Tercera (${tallies.third})` });
  if (tallies.gk) kit.push({ value: "gk", label: `Portero (${tallies.gk})` });

  const audience = [];
  if (tallies.women) audience.push({ value: "women", label: `Mujer (${tallies.women})` });
  if (tallies.kids) audience.push({ value: "kids", label: `Niños (${tallies.kids})` });

  const version = [];
  if (tallies.player) version.push({ value: "player", label: `Con Player (${tallies.player})` });

  const sleeve = [];
  if (tallies.long) sleeve.push({ value: "long", label: `Manga larga (${tallies.long})` });

  const edition = [];
  if (tallies.twoStar) edition.push({ value: "2star", label: `2-Star (${tallies.twoStar})` });
  if (tallies.worldCup) edition.push({ value: "worldcup", label: `World Cup (${tallies.worldCup})` });
  if (tallies.retro) edition.push({ value: "retro", label: `Retro (${tallies.retro})` });

  return { kit, audience, version, sleeve, edition };
}

function bindYupooShirtFilters() {
  document.querySelectorAll("[data-yupoo-filter]").forEach((sel) => {
    sel.addEventListener("change", () => {
      const key = sel.dataset.yupooFilter;
      if (!key || !(key in yupooShirtFilters)) return;
      yupooShirtFilters[key] = sel.value || "ALL";
      yupooPage = 1;
      renderYupooProductsGrid();
    });
  });
  document.querySelector("[data-yupoo-filters-reset]")?.addEventListener("click", () => {
    resetYupooShirtFilters();
    yupooPage = 1;
    renderYupooProductsGrid();
  });
}

function renderYupooTeamNav(filterOptions) {
  const team = getSelectedYupooTeam();
  if (!team && !catalogSearch.trim()) {
    setYupooNav(`<p class="yupoo-nav-hint muted small">Elige un equipo o selección para ver sus camisas. La búsqueda también funciona por nombre (Spain, España, Real Madrid…).</p>`);
    return;
  }
  if (team) {
    const f = yupooShirtFilters;
    const hasActive = Object.values(f).some((v) => v !== "ALL");
    const filtersHtml = filterOptions
      ? `<div class="yupoo-filters">
          ${yupooFilterSelect("yupoo-filter-kit", "Kit", f.kit, filterOptions.kit)}
          ${yupooFilterSelect("yupoo-filter-audience", "Público", f.audience, filterOptions.audience)}
          ${yupooFilterSelect("yupoo-filter-version", "Versión", f.version, filterOptions.version)}
          ${yupooFilterSelect("yupoo-filter-sleeve", "Manga", f.sleeve, filterOptions.sleeve)}
          ${yupooFilterSelect("yupoo-filter-edition", "Edición", f.edition, filterOptions.edition)}
          ${hasActive ? `<button type="button" class="btn btn-ghost yupoo-filters-reset" data-yupoo-filters-reset>Limpiar filtros</button>` : ""}
        </div>`
      : "";
    setYupooNav(`
      <div class="yupoo-nav-top">
        <button type="button" class="btn btn-ghost yupoo-nav-back" data-yupoo-back>← Equipos</button>
        <div class="yupoo-nav-current">
          <strong>${escapeHtml(team.name)}</strong>
        </div>
      </div>
      ${filtersHtml}`);
    document.querySelector("[data-yupoo-back]")?.addEventListener("click", () => {
      catalogSearch = "";
      const searchEl = document.getElementById("catalog-search");
      if (searchEl) searchEl.value = "";
      resetYupooShirtFilters();
      clearYupooTeam();
    });
    if (filterOptions) bindYupooShirtFilters();
    return;
  }
  setYupooNav(`
    <div class="yupoo-nav-top">
      <button type="button" class="btn btn-ghost yupoo-nav-back" data-yupoo-back>← Equipos</button>
      <div class="yupoo-nav-current"><strong>Resultados de búsqueda</strong></div>
    </div>`);
  document.querySelector("[data-yupoo-back]")?.addEventListener("click", () => {
    catalogSearch = "";
    const searchEl = document.getElementById("catalog-search");
    if (searchEl) searchEl.value = "";
    clearYupooTeam();
  });
}

async function renderYupooTeamsGrid() {
  const grid = document.getElementById("grid");
  const countEl = document.getElementById("count");
  const token = ++yupooLoadToken;
  grid.innerHTML = `<p class="catalog-empty muted">Cargando equipos…</p>`;
  setYupooPager("");
  renderYupooTeamNav();

  try {
    const [teams, curation] = await Promise.all([loadYupooTeams(), loadYupooCuration(), loadYupooMeta()]);
    if (token !== yupooLoadToken || !isYupooMode()) return;

    const hiddenTeamIds = new Set((curation.teams || []).filter((t) => t.hidden).map((t) => t.id));
    const featuredIds = new Set((curation.teams || []).filter((t) => t.featured).map((t) => t.id));
    const sortMap = new Map((curation.teams || []).map((t) => [t.id, t.sortOrder ?? 9999]));

    const q = catalogSearch.trim();
    let list = teams.filter((t) => !hiddenTeamIds.has(t.id));
    list.sort((a, b) => {
      const fa = featuredIds.has(a.id) || a.featured;
      const fb = featuredIds.has(b.id) || b.featured;
      if (fa !== fb) return fa ? -1 : 1;
      const sa = sortMap.get(a.id) ?? a.sortOrder ?? 9999;
      const sb = sortMap.get(b.id) ?? b.sortOrder ?? 9999;
      if (sa !== sb) return sa - sb;
      return (b.count || 0) - (a.count || 0) || String(a.name).localeCompare(String(b.name), "es");
    });

    if (q) {
      const teamHit = matchTeamFromSearchQuery(q, list);
      if (teamHit) {
        yupooSelectedTeamId = teamHit.id;
        return renderYupooProductsGrid(token);
      }
      list = list.filter((t) => matchesYupooSearch([t.name, ...(t.aliases || [])].join(" "), q));
    }

    if (q && list.length === 0) {
      return renderYupooProductsGrid(token);
    }

    if (!q && yupooUnmatchedCount > 0) {
      list = [...list, {
        id: YUPOO_TEAM_OTHER,
        name: "Otros modelos",
        count: yupooUnmatchedCount,
        thumb: "",
        aliases: [],
      }];
    }

    if (countEl) countEl.textContent = String(list.length);
    if (list.length === 0) {
      grid.innerHTML = `<p class="catalog-empty muted">No hay equipos que coincidan.</p>`;
      return;
    }

    grid.innerHTML = list.map((t, i) => yupooTeamCardHTML(t, i)).join("");
    grid.querySelectorAll(".card").forEach((el) => {
      el.classList.add("reveal");
      initTilt(el);
    });
    observeReveals(grid.querySelectorAll(".reveal"));
    bindYupooTeamCards(grid);
  } catch (err) {
    if (token !== yupooLoadToken || !isYupooMode()) return;
    console.warn("yupoo teams", err);
    if (countEl) countEl.textContent = "0";
    grid.innerHTML = `<p class="catalog-empty muted">No se pudieron cargar los equipos. Ejecuta <code>npm run sync-yupoo -- --regroup-only</code>.</p>`;
  }
}

async function renderYupooProductsGrid(existingToken) {
  const grid = document.getElementById("grid");
  if (!grid) return;
  const countEl = document.getElementById("count");
  const token = existingToken || ++yupooLoadToken;

  if (!existingToken) {
    grid.innerHTML = `<p class="catalog-empty muted">Cargando camisas…</p>`;
    setYupooPager("");
  }

  try {
    const meta = await loadYupooMeta();
    if (token !== yupooLoadToken || !isYupooMode()) return;

    const q = catalogSearch.trim();
    const pageSize = meta.pageSize || 100;
    const [index, curation] = await Promise.all([loadYupooSearchIndex(), loadYupooCuration()]);
    if (token !== yupooLoadToken || !isYupooMode()) return;

    let teamRows = filterIndexBySelectedTeam(index).filter((row) => !isYupooRowHiddenByCuration(row, curation));
    if (q) {
      teamRows = teamRows.filter((row) =>
        matchesYupooSearch([row.haystack || "", row.title || "", row.teamId || ""].join(" "), q)
      );
    }

    const filterOptions = yupooSelectedTeamId ? buildYupooShirtFilterOptions(teamRows) : null;
    renderYupooTeamNav(filterOptions);

    const matched = teamRows.filter(matchesYupooShirtFilters);
    const total = matched.length;
    let totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (yupooPage > totalPages) yupooPage = totalPages;
    if (yupooPage < 1) yupooPage = 1;
    const start = (yupooPage - 1) * pageSize;
    const pageIds = matched.slice(start, start + pageSize).map((row) => row.id);
    let items = await hydrateYupooIds(pageIds);

    // Si el índice apunta a ids nuevos pero las pages están en caché vieja, reintentar sin caché de página.
    if (matched.length > 0 && items.length === 0) {
      yupooPageCache.clear();
      items = await hydrateYupooIds(pageIds);
    }

    if (token !== yupooLoadToken || !isYupooMode()) return;
    if (countEl) countEl.textContent = String(total);

    if (items.length === 0) {
      const hint = matched.length > 0
        ? "Hay modelos en el índice, pero no se pudieron cargar las fichas. Prueba a recargar sin caché."
        : (q || Object.values(yupooShirtFilters).some((v) => v !== "ALL")
          ? "No hay coincidencias con estos filtros."
          : "No hay camisas para este equipo.");
      grid.innerHTML = `<p class="catalog-empty muted">${hint}</p>`;
      setYupooPager("");
      return;
    }

    grid.innerHTML = items.map((it, i) => yupooCardHTML(it, i)).join("");
    grid.querySelectorAll(".card").forEach((el) => {
      el.classList.add("reveal");
      initTilt(el);
    });
    observeReveals(grid.querySelectorAll(".reveal"));
    bindYupooCards(grid);
    setYupooPager(yupooPagerHTML(yupooPage, totalPages, total));
    bindYupooPager(totalPages);
  } catch (err) {
    if (token !== yupooLoadToken || !isYupooMode()) return;
    console.warn("yupoo products", err);
    if (countEl) countEl.textContent = "0";
    grid.innerHTML = `<p class="catalog-empty muted">No se pudo cargar el catálogo completo. Genera los datos con <code>npm run sync-yupoo</code>.</p>`;
    setYupooPager("");
  }
}

async function renderYupooGrid() {
  const grid = document.getElementById("grid");
  if (!grid) return;

  // Vista equipos (sin equipo seleccionado). Si hay búsqueda de equipo, filtra tarjetas;
  // si no hay match de equipo, renderYupooTeamsGrid cae a productos.
  if (!yupooSelectedTeamId) {
    await renderYupooTeamsGrid();
    return;
  }
  await renderYupooProductsGrid();
}

function bindCuratedCards(grid) {
  grid.querySelectorAll(".card:not(.card--yupoo)").forEach(card => {
    const id = card.dataset.id;
    const shirt = getShirt(id);
    if (!shirt) return;

    const defaultSize = firstInStockSize(shirt);
    card.dataset.size = defaultSize;
    card.dataset.edition = "fan";
    card.dataset.playerId = "none";

    card.querySelectorAll(".edition-opt").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const ed = btn.dataset.edition;
        card.dataset.edition = ed;
        card.querySelectorAll(".edition-opt").forEach(b => b.classList.toggle("active", b.dataset.edition === ed));
        updateCardPricing(card, shirt);
      });
    });

    card.querySelector(".player-pick")?.addEventListener("change", (e) => {
      e.stopPropagation();
      card.dataset.playerId = e.target.value;
    });
    card.querySelector(".player-pick")?.addEventListener("click", (e) => e.stopPropagation());

    card.querySelectorAll(".size-opt").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (btn.disabled || !isSizeInStock(shirt, btn.dataset.size)) return;
        const sz = btn.dataset.size;
        card.dataset.size = sz;
        card.querySelectorAll(".size-opt").forEach(b => {
          const oos = !isSizeInStock(shirt, b.dataset.size);
          b.classList.toggle("active", b.dataset.size === sz && !oos);
        });
      });
    });

    const heart = card.querySelector(".heart");
    heart?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(id);
    });
    heart?.classList.toggle("is-fav", favoriteIds.has(id));
    card.classList.toggle("card--fav", favoriteIds.has(id));

    card.querySelector(".add-quick")?.addEventListener("click", (e) => {
      e.stopPropagation();
      let size = card.dataset.size || defaultSize;
      if (!isSizeInStock(shirt, size)) size = firstInStockSize(shirt);
      const edition = card.dataset.edition === "player" ? "player" : "fan";
      const playerId = card.dataset.playerId || "none";
      addToInquiry(id, size, edition, playerId);
    });

    card.querySelector(".open-detail")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openProductModal(id);
    });

    card.querySelector(".img")?.addEventListener("click", (e) => {
      if (e.target.closest(".heart")) return;
      openProductModal(id);
    });
  });
}

function renderGrid() {
  const grid = document.getElementById("grid");
  if (!grid) return;

  if (isYupooMode()) {
    renderYupooGrid();
    return;
  }

  yupooLoadToken += 1;
  setYupooPager("");
  setYupooNav("");

  const shirts = getListForGrid();
  const yupooFavs = activeFilter === "FAVORITOS" ? getYupooFavoriteItems() : [];
  rememberYupooItems(yupooFavs);

  const countEl = document.getElementById("count");
  const totalCount = shirts.length + yupooFavs.length;
  if (countEl) countEl.textContent = totalCount;

  if (totalCount === 0) {
    grid.innerHTML = `<p class="catalog-empty muted">No hay modelos en esta vista. Prueba otro filtro o guarda favoritos con el corazón.</p>`;
    return;
  }

  grid.innerHTML =
    shirts.map((s, i) => cardHTML(s, i)).join("") +
    yupooFavs.map((it, i) => yupooCardHTML(it, shirts.length + i)).join("");

  grid.querySelectorAll(".card").forEach((el) => {
    el.classList.add("reveal");
    initTilt(el);
  });
  observeReveals(grid.querySelectorAll(".reveal"));
  bindCuratedCards(grid);
  if (yupooFavs.length) bindYupooCards(grid);
}

function cardHTML(s, i) {
  const heart = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  const ig = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01"/></svg>`;
  const sizes = buildSizeButtonsHTML(s, firstInStockSize(s));
  const fanPv = getFanPrice(s);
  const playersOpts = buildPlayerOptionsHTML(s, "none");
  const oldBlock = s.oldPrice ? `<div class="price-old js-price-old">${s.oldPrice.toFixed(2)} $</div>` : "";
  const visual = s.image
    ? `<img src="${encodeURI(s.image)}" alt="${s.team}" loading="lazy" />`
    : `<div class="bg" style="background:${s.bg}"></div>`;
  return `
  <article class="card" data-id="${s.id}" data-edition="fan" data-player-id="none" style="--d:${(i % 4) * 0.08}s">
    <div class="img">
      ${visual}
      <div class="water">${s.id}0</div>
      <div class="top">
        ${s.badge ? `<span class="badge-tag ${s.badge}">${s.badge}</span>` : `<span></span>`}
        <button type="button" class="heart" aria-label="Favorito">${heart}</button>
      </div>
      <button type="button" class="open-detail" aria-label="Ver detalle">Ver detalle</button>
      <button type="button" class="add-quick">${ig} Añadir a la consulta</button>
    </div>
    <div class="info">
      <div class="league">${s.league.toUpperCase()}</div>
      <div class="team">${s.team}</div>
      <div class="card-meta muted small">${s.club} · ${s.season}</div>
      <div class="edition-pick" role="group" aria-label="Versión">
        <button type="button" class="edition-opt active" data-edition="fan">Fan</button>
        <button type="button" class="edition-opt" data-edition="player">Player</button>
      </div>
      <label class="visually-hidden" for="player-${s.id}">Jugador</label>
      <select id="player-${s.id}" class="player-pick">${playersOpts}</select>
      <div class="sizes sizes--pick" aria-label="Talla">${sizes}</div>
        <div class="price-row">
        <div class="price-block">
          ${oldBlock}
          <div class="price js-card-price">${fanPv.toFixed(2)} $</div>
          <div class="price-bs muted small js-card-price-bs">${lineBsApprox(fanPv)}</div>
        </div>
        ${QUALITY_BADGE_HTML}
      </div>
    </div>
  </article>`;
}

function addToInquiry(id, size, edition = "fan", playerId = "none") {
  inquiryItems.push({ id, size, edition, playerId });
  saveInquiry();
  updateHeaderBadges();
  renderInquiryList();
  showToast("Añadido a tu consulta.");
}

function removeInquiry(index) {
  inquiryItems.splice(index, 1);
  saveInquiry();
  updateHeaderBadges();
  renderInquiryList();
}

function renderInquiryList() {
  const ul = document.getElementById("inquiry-list");
  if (!ul) return;
  if (inquiryItems.length === 0) {
    ul.innerHTML = `<li class="inquiry-empty muted small">Vacío. Elige talla en el catálogo y pulsa «Añadir a la consulta».</li>`;
    syncInquiryMessagePreview();
    return;
  }
  ul.innerHTML = inquiryItems.map((item, index) => {
    if (item.source === "yupoo" || String(item.id).startsWith("yupoo:")) {
      const title = item.title || "Modelo catálogo completo";
      return `<li class="inquiry-item">
        <div>
          <div class="inquiry-name">${escapeHtml(title)}</div>
          <div class="inquiry-meta muted small">Catálogo completo · Bajo consulta</div>
        </div>
        <button type="button" class="inquiry-remove" data-idx="${index}" aria-label="Quitar">×</button>
      </li>`;
    }
    const s = getShirt(item.id);
    if (!s) return "";
    const ed = item.edition === "player" ? "Player" : "Fan";
    const p = getPlayerOption(s, item.playerId || "none");
    let pl = "";
    if (p.id !== "none") {
      pl = ` · ${p.name} #${p.number || "—"}`;
    }
    return `<li class="inquiry-item">
      <div>
        <div class="inquiry-name">${s.team}</div>
        <div class="inquiry-meta muted small">${ed}${pl} · Talla ${item.size} · ${s.league}</div>
      </div>
      <button type="button" class="inquiry-remove" data-idx="${index}" aria-label="Quitar">×</button>
    </li>`;
  }).join("");

  ul.querySelectorAll(".inquiry-remove").forEach(btn => {
    btn.addEventListener("click", () => removeInquiry(Number(btn.dataset.idx)));
  });
  syncInquiryMessagePreview();
}

function openInquiryDrawer() {
  const d = document.getElementById("inquiry-drawer");
  if (!d) return;
  syncInquiryMessagePreview();
  d.classList.add("drawer--open");
  d.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeInquiryDrawer() {
  const d = document.getElementById("inquiry-drawer");
  if (!d) return;
  d.classList.remove("drawer--open");
  d.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// ---------- Modal ----------
function initModal() {
  const modal = document.getElementById("product-modal");
  if (!modal) return;
  modal.querySelectorAll("[data-close-modal]").forEach(el => {
    el.addEventListener("click", closeProductModal);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeProductModal();
    closeInquiryDrawer();
  });
}

function closeProductModal(opts = {}) {
  const fromRoute = opts.fromRoute === true;
  const modal = document.getElementById("product-modal");
  if (!modal) return;
  modal.classList.remove("modal--open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  productModalOpenId = null;
  if (defaultDocumentTitle) document.title = defaultDocumentTitle;
  if (!fromRoute && getProductIdFromHash()) {
    if (document.getElementById("catalogo")) {
      location.hash = "#catalogo";
    } else {
      window.location.href = "catalogo.html#catalogo";
    }
  }
}

function openProductModal(id, opts = {}) {
  const fromRoute = opts.fromRoute === true;
  const s = getShirt(id);
  const modal = document.getElementById("product-modal");
  const body = document.getElementById("modal-body");
  if (!s || !modal || !body) return;

  let selected = firstInStockSize(s);
  let editionSel = "fan";
  let playerIdSel = "none";
  const ig = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01"/></svg>`;

  function modalPriceRow() {
    const pv = getEditionPrice(s, editionSel);
    const oldPart = editionSel === "fan" && s.oldPrice ? `<span class="price-old">${s.oldPrice.toFixed(2)} $</span>` : "";
    return `<div class="modal-price-wrap">
        <div class="modal-price-row">
          ${oldPart}
          <span class="price modal-price-live">${pv.toFixed(2)} $</span>
          ${s.badge ? `<span class="badge-tag ${s.badge}">${s.badge}</span>` : ""}
        </div>
        <p class="muted small modal-price-bs js-modal-price-bs">${lineBsApprox(pv)}</p>
      </div>`;
  }

  function renderModal() {
    const sizeBtns = buildSizeButtonsHTML(s, selected, "modal-size");
    const playerOpts = buildPlayerOptionsHTML(s, playerIdSel);
    const modalVisual = s.image
      ? `<div class="modal-visual"><img src="${encodeURI(s.image)}" alt="${s.team}" loading="lazy" /></div>`
      : `<div class="modal-visual" style="background:${s.bg}"></div>`;
    body.innerHTML = `
      ${modalVisual}
      <div class="modal-info">
        <p class="modal-league">${s.league.toUpperCase()}</p>
        <h3 id="modal-title">${s.team}</h3>
        <p class="muted small">${s.club} · ${s.season}</p>
        ${modalPriceRow()}
        <p class="muted small modal-desc">Consulta disponibilidad y envío por Instagram. Precio orientativo.</p>
        <div class="modal-edition">
          <span class="modal-label">Versión</span>
          <div class="edition-pick" role="group">
            <button type="button" class="edition-opt modal-edition-fan${editionSel === "fan" ? " active" : ""}" data-edition="fan">Fan</button>
            <button type="button" class="edition-opt modal-edition-player${editionSel === "player" ? " active" : ""}" data-edition="player">Player</button>
          </div>
        </div>
        <div class="modal-player-field">
          <label class="modal-label" for="modal-player-sel">Jugador</label>
          <select id="modal-player-sel" class="player-pick">${playerOpts}</select>
        </div>
        <div class="modal-sizes">
          <span class="modal-label">Talla</span>
          <div class="sizes sizes--pick">${sizeBtns}</div>
        </div>
        <div class="modal-quality">${QUALITY_BADGE_HTML}</div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary btn-modal-ig" id="modal-add-inquiry">${ig} Añadir a la consulta</button>
          <button type="button" class="btn btn-ghost" id="modal-toggle-fav">${favoriteIds.has(id) ? "Quitar de favoritos" : "Guardar en favoritos"}</button>
        </div>
      </div>`;

    body.querySelectorAll(".modal-size").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        selected = btn.dataset.size;
        renderModal();
      });
    });
    body.querySelectorAll(".edition-pick .edition-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        editionSel = btn.dataset.edition;
        renderModal();
      });
    });
    document.getElementById("modal-player-sel")?.addEventListener("change", (e) => {
      playerIdSel = e.target.value;
    });
    document.getElementById("modal-add-inquiry")?.addEventListener("click", () => {
      let sz = selected;
      if (!isSizeInStock(s, sz)) sz = firstInStockSize(s);
      addToInquiry(id, sz, editionSel, playerIdSel);
    });
    document.getElementById("modal-toggle-fav")?.addEventListener("click", () => {
      toggleFavorite(id);
      renderModal();
    });
  }

  renderModal();
  productModalOpenId = id;
  document.title = `${s.team} · 90 Minutos Sports`;
  modal.classList.add("modal--open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  if (!fromRoute) {
    const next = `#/camisa/${id}`;
    if (location.hash !== next) location.hash = next;
  }
}

// ---------- 3D Tilt ----------
function initTilt(el) {
  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (py - 0.5) * -8;
    const ry = (px - 0.5) * 12;
    el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };
  const reset = () => { el.style.transform = "perspective(1000px) rotateX(0) rotateY(0)"; };
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", reset);
}

// ---------- Parallax ----------
function initParallax() {
  const items = document.querySelectorAll("[data-parallax]");
  const onScroll = () => {
    const y = window.scrollY;
    items.forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0.2;
      el.style.transform = `translate3d(0, ${y * speed * -1}px, 0)`;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

// ---------- Reveal on scroll ----------
let revealObserver;
function initReveal() {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  observeReveals(document.querySelectorAll(".reveal"));
}
function observeReveals(nodes) {
  if (!revealObserver) return;
  nodes.forEach(n => revealObserver.observe(n));
}
