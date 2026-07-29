/**
 * Devuelve las fotos de un álbum Yupoo (JSON).
 * GET /api/yupoo-album?id=246715641
 */
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function parseAlbumImages(html) {
  const urls = [];
  const seen = new Set();

  const push = (raw) => {
    if (!raw) return;
    let u = String(raw).trim();
    if (u.startsWith("//")) u = `https:${u}`;
    if (!u.startsWith("https://photo.yupoo.com/")) return;
    u = u.replace(/\/(?:big|small|square)\.(png|jpe?g|webp)$/i, "/medium.$1");
    if (seen.has(u)) return;
    seen.add(u);
    urls.push(u);
  };

  const dataSrc = /data-src="(https:\/\/photo\.yupoo\.com\/pinhuistore\/[^"]+)"/gi;
  let m;
  while ((m = dataSrc.exec(html)) !== null) push(m[1]);

  if (urls.length === 0) {
    const cover = html.match(/data-cover="([^"]+)"/i);
    if (cover) {
      for (const part of cover[1].split("||")) push(part);
    }
  }

  return urls;
}

export default async (request) => {
  const url = new URL(request.url);
  const id = String(url.searchParams.get("id") || "").replace(/\D/g, "");
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const albumUrl = `https://pinhuistore.x.yupoo.com/albums/${id}?uid=1`;
  const upstream = await fetch(albumUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en,es;q=0.9",
      "User-Agent": UA,
      Referer: "https://pinhuistore.x.yupoo.com/albums?tab=gallery",
    },
  });

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: `Upstream ${upstream.status}` }), {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const html = await upstream.text();
  const images = parseAlbumImages(html);

  return new Response(JSON.stringify({ id, images }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

export const config = { path: "/api/yupoo-album" };
