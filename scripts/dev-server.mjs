#!/usr/bin/env node
/**
 * Servidor local estático + proxy de miniaturas Yupoo.
 * Sustituye `python3 -m http.server` para que las imágenes del catálogo completo carguen.
 *
 *   npm run dev
 *   → http://localhost:8080
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

async function proxyYupoo(req, res, searchParams) {
  const raw = searchParams.get("u");
  if (!raw) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Missing u");
    return;
  }
  let target;
  try {
    target = new URL(raw);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Bad url");
    return;
  }
  if (target.protocol !== "https:" || target.hostname !== "photo.yupoo.com") {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Host not allowed");
    return;
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://pinhuistore.x.yupoo.com/",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!upstream.ok) {
      res.writeHead(upstream.status, { "Content-Type": "text/plain" });
      res.end(`Upstream ${upstream.status}`);
      return;
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(200, {
      "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
      "Content-Length": buf.length,
    });
    res.end(buf);
  } catch (err) {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end(String(err.message || err));
  }
}

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

async function proxyYupooAlbum(req, res, searchParams) {
  const id = String(searchParams.get("id") || "").replace(/\D/g, "");
  if (!id) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing id" }));
    return;
  }
  try {
    const albumUrl = `https://pinhuistore.x.yupoo.com/albums/${id}?uid=1`;
    const upstream = await fetch(albumUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en,es;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://pinhuistore.x.yupoo.com/albums?tab=gallery",
      },
    });
    if (!upstream.ok) {
      res.writeHead(upstream.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Upstream ${upstream.status}` }));
      return;
    }
    const html = await upstream.text();
    const images = parseAlbumImages(html);
    const body = JSON.stringify({ id, images });
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
      "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
  } catch (err) {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err.message || err) }));
  }
}

function safeJoin(root, reqPath) {
  const decoded = decodeURIComponent(reqPath.split("?")[0]);
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(root, cleaned);
  if (!full.startsWith(root)) return null;
  return full;
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url || "/", `http://localhost:${PORT}`);

  if (u.pathname === "/api/yupoo-img") {
    await proxyYupoo(req, res, u.searchParams);
    return;
  }

  if (u.pathname === "/api/yupoo-album") {
    await proxyYupooAlbum(req, res, u.searchParams);
    return;
  }

  let filePath = safeJoin(ROOT, u.pathname === "/" ? "/index.html" : u.pathname);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, st) => {
    if (!err && st.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`90 Minutos → http://localhost:${PORT}`);
  console.log("Proxy Yupoo activo en /api/yupoo-img");
});
