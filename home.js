/* Home: cotización, tema, marquee, parallax hero, showcase tipo Apple */

const INSTAGRAM_USER = "90minutos.ss";
const PRODUCTS_URL = "data/productos.json";
const FX_DOLARES_URL = "https://ve.dolarapi.com/v1/dolares";

const LINEUP_HOOKS = ["CORTE AFILADO", "ACERO FRÍO", "SOMBRA ABSOLUTA", "RAYADO"];

const FALLBACK_LINEUP = [
  { id: "1", club: "Real Madrid", team: "Real Madrid 24/25", league: "LaLiga", image: "assets/productos/descarga.jpeg" },
  { id: "2", club: "FC Barcelona", team: "FC Barcelona Away 24/25", league: "LaLiga", image: "assets/productos/descarga (1).jpeg" },
  { id: "3", club: "Manchester City", team: "Manchester City Home 24/25", league: "Premier League", image: "assets/productos/descarga (2).jpeg" },
  { id: "4", club: "Liverpool", team: "Liverpool Home 24/25", league: "Premier League", image: "assets/productos/descarga (3).jpeg" },
];

function instagramDmUrl() {
  return `https://ig.me/m/${INSTAGRAM_USER}`;
}

function initTheme() {
  const stored = localStorage.getItem("90min-theme");
  const theme = stored || "dark";
  document.documentElement.dataset.theme = theme;
  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("90min-theme", next);
  });
}

function formatBsNumber(n) {
  return new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
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
    const rate = Number(row.promedio);
    const d = row.fechaActualizacion ? new Date(row.fechaActualizacion) : new Date();
    const label = d.toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" });
    if (hdr) hdr.textContent = `1 USD ≈ ${formatBsNumber(rate)} Bs. (paralelo)`;
    if (upd) upd.textContent = `Actualizado ${label}`;
  } catch (_) {
    if (hdr) hdr.textContent = "Cotización no disponible · reintento en 1 min";
    if (upd) upd.textContent = "";
  }
}

function buildMarquee() {
  const track = document.getElementById("marquee");
  if (!track) return;
  const items = ["LALIGA", "PREMIER LEAGUE", "CHAMPIONS", "SERIE A", "BUNDESLIGA", "EUROCOPA", "MUNDIAL", "COPA AMÉRICA"];
  const trophy =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h8M12 17v4M17 4h3v3a4 4 0 0 1-4 4M7 4H4v3a4 4 0 0 0 4 4M17 4H7v6a5 5 0 0 0 10 0z"/></svg>';
  track.innerHTML = [...items, ...items, ...items].map(t => `<div class="item"><span>${t}</span>${trophy}</div>`).join("");
}

function initParallax() {
  const items = document.querySelectorAll("[data-parallax]");
  if (!items.length) return;
  const onScroll = () => {
    const y = window.scrollY;
    items.forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0.2;
      el.style.transform = `translate3d(0, ${y * speed * -1}px, 0)`;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

async function loadLineupProducts() {
  try {
    const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("http");
    const payload = await res.json();
    const list = Array.isArray(payload) ? payload : payload?.productos;
    if (!Array.isArray(list) || list.length === 0) throw new Error("empty");
    return list.slice(0, 4).map((p, i) => ({
      id: String(p.id ?? i + 1),
      club: p.club || "",
      team: p.team || "",
      league: p.league || "",
      image: typeof p.image === "string" && p.image.trim() ? p.image.trim() : FALLBACK_LINEUP[i]?.image || "",
    }));
  } catch (_) {
    return FALLBACK_LINEUP;
  }
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildShowcaseHTML(items) {
  const steps = items
    .map((p, i) => {
      const num = pad2(i + 1);
      const hook = LINEUP_HOOKS[i] || "DESTACADO";
      const href = `catalogo.html#/camisa/${encodeURIComponent(p.id)}`;
      return `
      <article class="home-showcase__step" data-showcase-step="${i}" id="showcase-step-${i}">
        <span class="home-showcase__step-num" aria-hidden="true">${num}</span>
        <p class="home-showcase__step-kicker">DESTACADO ${num}</p>
        <h3 class="home-showcase__step-hook">${hook}</h3>
        <p class="home-showcase__step-meta"><span>${escapeHtml(p.club)}</span> · ${escapeHtml(p.league)}</p>
        <p class="home-showcase__step-team muted">${escapeHtml(p.team)}</p>
        <a class="btn btn-mid-cta home-showcase__step-btn" href="${href}">Ver en catálogo</a>
      </article>`;
    })
    .join("");

  const imgs = items
    .map(
      (p, i) =>
        `<img class="home-showcase__img${i === 0 ? " is-active" : ""}" data-index="${i}" src="${encodeURI(p.image)}" alt="${escapeHtml(p.team)}" width="800" height="1000" loading="${i === 0 ? "eager" : "lazy"}" decoding="async" />`
    )
    .join("");

  const dots = items
    .map(
      (_, i) =>
        `<button type="button" class="home-showcase__dot${i === 0 ? " is-active" : ""}" data-dot="${i}" aria-label="Pieza ${i + 1}" aria-current="${i === 0 ? "true" : "false"}"></button>`
    )
    .join("");

  return `
    <div class="home-showcase__sticky-grid">
      <div class="home-showcase__visual-col">
        <p id="showcase-live" class="visually-hidden" aria-live="polite"></p>
        <div class="home-showcase__canvas-wrap">
          <div class="home-showcase__glow" aria-hidden="true"></div>
          <div class="home-showcase__canvas">${imgs}</div>
        </div>
        <div class="home-showcase__dots" role="group" aria-label="Piezas del once">${dots}</div>
        <p class="home-showcase__hint muted small">La camisa fija cambia al centrar cada bloque (crossfade + escala).</p>
      </div>
      <div class="home-showcase__steps">${steps}</div>
    </div>`;
}

function initReveal(root = document) {
  const els = root.querySelectorAll(".home-reveal, .reveal");
  if (!els.length) return;
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
  );
  els.forEach(el => io.observe(el));
}

function initShowcaseScroll() {
  const mount = document.getElementById("home-lineup");
  const steps = document.querySelectorAll("[data-showcase-step]");
  const imgs = document.querySelectorAll(".home-showcase__img");
  const dots = document.querySelectorAll(".home-showcase__dot");
  const live = document.getElementById("showcase-live");
  if (!mount || !steps.length || !imgs.length) return;

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let active = -1;

  function updateDots(i) {
    dots.forEach((d, j) => {
      const on = j === i;
      d.classList.toggle("is-active", on);
      d.setAttribute("aria-current", on ? "true" : "false");
    });
    if (live) live.textContent = `Pieza ${i + 1} de ${steps.length}`;
  }

  function setActive(i) {
    if (i === active) return;
    active = i;
    imgs.forEach((img, j) => img.classList.toggle("is-active", j === i));
    updateDots(i);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      document.getElementById(`showcase-step-${i}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    });
  });

  if (!ScrollTrigger || reduce) {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const i = Number(entry.target.getAttribute("data-showcase-step"));
          if (!Number.isNaN(i)) setActive(i);
        });
      },
      { threshold: 0.28, rootMargin: "-32% 0px -32% 0px" }
    );
    steps.forEach(s => io.observe(s));
    setActive(0);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  steps.forEach((step, i) => {
    ScrollTrigger.create({
      trigger: step,
      start: "top 52%",
      end: "bottom 48%",
      onEnter: () => setActive(i),
      onEnterBack: () => setActive(i),
    });
  });

  /** La vitrina entra en escena al acercarse al once */
  const canvasWrap = document.querySelector(".home-showcase__canvas-wrap");
  if (canvasWrap) {
    gsap.fromTo(
      canvasWrap,
      { y: 64, opacity: 0.45, scale: 0.94 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: mount,
          start: "top 92%",
          end: "top 32%",
          scrub: 0.7,
        },
      }
    );
  }

  requestAnimationFrame(() => {
    setActive(0);
    ScrollTrigger.refresh();
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
}

function initMidCtaScroll() {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrollTrigger);
  const mid = document.querySelector(".home-mid-cta");
  if (!mid) return;
  const inner = mid.querySelector(".home-mid-cta__inner");
  const bg = mid.querySelector(".home-mid-cta__bg");
  if (inner) {
    gsap.fromTo(
      inner,
      { y: 50, scale: 0.98, opacity: 0 },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        ease: "power2.out",
        scrollTrigger: { trigger: mid, start: "top 80%", end: "center 60%", scrub: 1 },
      }
    );
  }
  if (bg) {
    gsap.to(bg, {
      opacity: 1,
      scale: 1.04,
      ease: "none",
      scrollTrigger: { trigger: mid, start: "top 95%", end: "bottom 20%", scrub: true },
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  fetchUsdBsRate();
  setInterval(fetchUsdBsRate, 60 * 1000);

  buildMarquee();
  initParallax();

  const ctaIg = document.getElementById("cta-instagram");
  if (ctaIg) {
    ctaIg.href = instagramDmUrl();
    ctaIg.addEventListener("click", e => {
      e.preventDefault();
      window.open(instagramDmUrl(), "_blank", "noopener,noreferrer");
    });
  }

  const root = document.getElementById("home-lineup");
  if (root) {
    const items = await loadLineupProducts();
    root.innerHTML = buildShowcaseHTML(items);
  }

  initReveal(document);
  initShowcaseScroll();
  initMidCtaScroll();

  if (window.gsap && window.ScrollTrigger) {
    window.addEventListener("load", () => window.ScrollTrigger.refresh());
  }
});
