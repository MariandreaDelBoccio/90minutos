/**
 * Proxy de miniaturas Yupoo.
 * photo.yupoo.com bloquea hotlink (HTTP 567) si el Referer no es de yupoo.com.
 * Esta edge function pide la imagen con Referer de Yupoo y la sirve desde nuestro dominio.
 */
export default async (request) => {
  const url = new URL(request.url);
  const raw = url.searchParams.get("u");
  if (!raw) {
    return new Response("Missing u", { status: 400 });
  }

  let target;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Bad url", { status: 400 });
  }

  if (target.protocol !== "https:" || target.hostname !== "photo.yupoo.com") {
    return new Response("Host not allowed", { status: 403 });
  }

  const upstream = await fetch(target.toString(), {
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      Referer: "https://pinhuistore.x.yupoo.com/",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!upstream.ok) {
    return new Response(`Upstream ${upstream.status}`, { status: upstream.status });
  }

  const headers = new Headers();
  const ct = upstream.headers.get("content-type") || "image/jpeg";
  headers.set("Content-Type", ct);
  headers.set("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
  headers.set("Access-Control-Allow-Origin", "*");

  return new Response(upstream.body, { status: 200, headers });
};

export const config = { path: "/api/yupoo-img" };
