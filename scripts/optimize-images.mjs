#!/usr/bin/env node
/**
 * Reduce peso de fotos en assets/productos (uso web: catalogo).
 * - Ancho maximo 1920px (sin ampliar imagenes pequeñas)
 * - JPEG: calidad ~82 (mozjpeg)
 * - PNG: compresion alta
 * - WebP: calidad ~80
 *
 * Uso local: npm run optimize-images
 */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "assets", "productos");
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 82;
const WEBP_QUALITY = 80;

function isImage(filePath) {
  const e = path.extname(filePath).toLowerCase();
  return e === ".jpg" || e === ".jpeg" || e === ".png" || e === ".webp";
}

async function walk(dir, files = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (e) {
    if (e.code === "ENOENT") return files;
    throw e;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(full, files);
    else files.push(full);
  }
  return files;
}

async function optimizeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!isImage(filePath)) return null;

  const beforeStat = await fs.stat(filePath);
  const input = await fs.readFile(filePath);
  const meta = await sharp(input).metadata();

  let pipeline = sharp(input).rotate();

  const needsResize = meta.width != null && meta.width > MAX_WIDTH;
  if (needsResize) {
    pipeline = pipeline.resize(MAX_WIDTH, null, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  let out;
  if (ext === ".jpg" || ext === ".jpeg") {
    out = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  } else if (ext === ".png") {
    out = await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  } else if (ext === ".webp") {
    out = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
  } else {
    return null;
  }

  const rel = path.relative(process.cwd(), filePath);
  const shouldWrite = out.length < beforeStat.size || needsResize;
  if (!shouldWrite) {
    console.log(`  ${rel}: sin cambios (ya optimizada)`);
    return { file: rel, before: beforeStat.size, after: out.length, skipped: true };
  }

  await fs.writeFile(filePath, out);
  const saved = beforeStat.size - out.length;
  const pct = beforeStat.size ? ((saved / beforeStat.size) * 100).toFixed(1) : "0";
  console.log(
    `  ${rel}: ${(beforeStat.size / 1024).toFixed(0)} KB -> ${(out.length / 1024).toFixed(0)} KB (-${pct}%)`
  );
  return { file: rel, before: beforeStat.size, after: out.length, saved, pct };
}

async function main() {
  const all = await walk(ROOT);
  const files = all.filter(isImage);
  if (files.length === 0) {
    console.log("optimize-images: no hay imagenes en assets/productos");
    return;
  }

  const results = [];
  for (const f of files) {
    try {
      const r = await optimizeFile(f);
      if (r) results.push(r);
    } catch (err) {
      console.error("optimize-images: error en", f, err.message);
    }
  }

  const changed = results.filter((r) => !r.skipped);
  if (changed.length === 0) {
    console.log("optimize-images: nada que optimizar");
    return;
  }
  let totalBefore = 0;
  let totalAfter = 0;
  for (const r of changed) {
    totalBefore += r.before;
    totalAfter += r.after;
  }
  const tPct = totalBefore ? (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1) : "0";
  console.log(
    `optimize-images: archivos tocados ${changed.length}, total ${(totalBefore / 1024 / 1024).toFixed(2)} MB -> ${(totalAfter / 1024 / 1024).toFixed(2)} MB (-${tPct}%)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
