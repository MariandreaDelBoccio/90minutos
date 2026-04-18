/* 90 Minutos Sports — vanilla JS */

// ---------- Config ----------
/** Usuario de Instagram (sin @). Cambia por el de la marca. */
const INSTAGRAM_USER = "90minutos.ss";
const STORAGE_FAV = "90min-favorites";
const STORAGE_INQUIRY = "90min-inquiry";

/** Cotización USD→VES ([DolarApi Venezuela](https://dolarapi.com/docs/venezuela/)) */
const FX_DOLARES_URL = "https://ve.dolarapi.com/v1/dolares";
/** Bs. por 1 USD (promedio paralelo) */
let usdBsParalelo = null;
let fxFetchFailed = false;
let fxUpdateLabel = "";

// ---------- Data ----------
const PRODUCTS_URL = "data/productos.json";

const P_NONE = { id: "none", name: "Sin personalizar", number: "" };
const P_CUSTOM = { id: "custom", name: "Personalizado (nombre y dorsal)", number: "" };
function pl(...stars) {
  return [P_NONE, P_CUSTOM, ...stars];
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

function normalizeShirt(raw, index) {
  const id = raw?.id != null ? String(raw.id) : String(index + 1);
  const sizes = Array.isArray(raw?.sizes) && raw.sizes.length ? raw.sizes.map(String) : ["M", "L", "XL"];
  const outOfStock = Array.isArray(raw?.outOfStock) ? raw.outOfStock.map(String) : [];
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
/** @type {{ id: string, size: string, edition: "fan"|"player", playerId: string }[]} */
let inquiryItems = [];

let catalogSearch = "";
let subfilterClub = "ALL";
let subfilterSeason = "ALL";

const FILTERS = [
  { l: "TODAS",          match: () => true },
  { l: "FAVORITOS",      match: s => favoriteIds.has(s.id) },
  { l: "REBAJAS",        match: s => s.oldPrice != null && Number(s.oldPrice) > 0 },
  { l: "LALIGA",         match: s => s.league === "LaLiga" },
  { l: "PREMIER LEAGUE", match: s => s.league === "Premier League" },
  { l: "CHAMPIONS",      match: s => s.league === "Champions" },
  { l: "SELECCIONES",    match: s => s.league === "Selección" },
];

let activeFilter = "TODAS";

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
}

function saveFavorites() {
  localStorage.setItem(STORAGE_FAV, JSON.stringify([...favoriteIds]));
}

function toggleFavorite(id) {
  if (favoriteIds.has(id)) favoriteIds.delete(id);
  else favoriteIds.add(id);
  saveFavorites();
  updateHeaderBadges();
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if (card) {
    card.querySelector(".heart")?.classList.toggle("is-fav", favoriteIds.has(id));
    card.classList.toggle("card--fav", favoriteIds.has(id));
  }
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
  if (p.id === "custom") return " · Personalización (nombre/dorsal)";
  return ` · ${p.name} #${p.number || "—"}`;
}

function buildPlayerOptionsHTML(s, selectedId) {
  const opts = s.players || [P_NONE, P_CUSTOM];
  return opts.map(p => {
    const label = p.id === "none" ? "— Jugador / genérica —" : `${p.name}${p.number ? " #" + p.number : ""}`;
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
  const lines = inquiryItems.map(({ id, size, edition, playerId }) => {
    const s = getShirt(id);
    return s ? buildProductLine(s, size, edition || "fan", playerId || "none") : "";
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
  const isTodas = activeFilter === "TODAS";
  wrap.hidden = isTodas;
  if (isTodas) return;
  const { clubs, seasons } = getRefineOptions();
  const clubSel = document.getElementById("subfilter-club");
  const seaSel = document.getElementById("subfilter-season");
  const searchEl = document.getElementById("catalog-search");
  if (searchEl) searchEl.value = catalogSearch;
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
  if (activeFilter === "TODAS") return list;
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
function renderGrid() {
  const grid = document.getElementById("grid");
  if (!grid) return;
  const list = getListForGrid();
  const countEl = document.getElementById("count");
  if (countEl) countEl.textContent = list.length;
  if (list.length === 0) {
    grid.innerHTML = `<p class="catalog-empty muted">No hay modelos en esta vista. Prueba otro filtro o guarda favoritos con el corazón.</p>`;
    return;
  }
  grid.innerHTML = list.map((s, i) => cardHTML(s, i)).join("");

  grid.querySelectorAll(".card").forEach((el) => {
    el.classList.add("reveal");
    initTilt(el);
  });
  observeReveals(grid.querySelectorAll(".reveal"));

  grid.querySelectorAll(".card").forEach(card => {
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

    card.querySelector(".img")?.addEventListener("click", () => openProductModal(id));
  });
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
    const s = getShirt(item.id);
    if (!s) return "";
    const ed = item.edition === "player" ? "Player" : "Fan";
    const p = getPlayerOption(s, item.playerId || "none");
    let pl = "";
    if (p.id !== "none") {
      pl = p.id === "custom" ? " · Personalizado" : ` · ${p.name} #${p.number || "—"}`;
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
          <label class="modal-label" for="modal-player-sel">Jugador / personalización</label>
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
