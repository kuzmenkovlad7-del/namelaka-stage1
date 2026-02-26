#!/usr/bin/env node
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3010);

function exists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function resolveDataDir() {
  // 1) explicit
  if (process.env.DATA_DIR && exists(process.env.DATA_DIR)) return process.env.DATA_DIR;

  // 2) app/.local-data
  const appRoot = path.resolve(__dirname, "..");
  const localData = path.join(appRoot, ".local-data");
  if (exists(path.join(localData, "medusa_categories.json")) && exists(path.join(localData, "medusa_products.json"))) {
    return localData;
  }

  // 3) repo data/fallback (relative to app/)
  const repoRoot = path.resolve(appRoot, "..");
  const fallback = path.join(repoRoot, "data", "fallback");
  if (exists(path.join(fallback, "medusa_categories.json")) && exists(path.join(fallback, "medusa_products.json"))) {
    return fallback;
  }

  // 4) app/data/fallback (just in case)
  const fallback2 = path.join(appRoot, "data", "fallback");
  if (exists(path.join(fallback2, "medusa_categories.json")) && exists(path.join(fallback2, "medusa_products.json"))) {
    return fallback2;
  }

  // last resort: app/.local-data even if empty
  return localData;
}

const DATA_DIR = resolveDataDir();
const CATS_FILE = path.join(DATA_DIR, "medusa_categories.json");
const PRODS_FILE = path.join(DATA_DIR, "medusa_products.json");

function readJson(file) {
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw);
}

function pickArray(obj) {
  if (Array.isArray(obj)) return obj;
  if (!obj || typeof obj !== "object") return [];
  return (
    obj.product_categories ||
    obj.categories ||
    obj.products ||
    obj.items ||
    obj.data ||
    []
  );
}

function normSlug(v) {
  return String(v ?? "")
    .trim()
    .replace(/^\/+/, "")     // remove leading slashes
    .replace(/\s+/g, "-");
}

function normUrl(u) {
  if (!u) return null;
  const s = String(u);
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return s;
  return `/${s}`;
}

function normalizeCategory(c) {
  const out = { ...c };
  out.handle = normSlug(out.handle || out.slug || out.name || "");
  return out;
}

function normalizeProduct(p) {
  const out = { ...p };

  // normalize handle (critical for routing)
  out.handle = normSlug(out.handle || out.slug || "");

  // normalize category id field used across your app
  out.categoryId = out.categoryId || out.product_category_id || out.productCategoryId || out.product_category?.id || null;

  // normalize images
  // medusa may return images as [{url}], or strings, and thumbnail may be null
  const imgs = Array.isArray(out.images) ? out.images : [];
  const normImgs = imgs.map((img) => {
    if (typeof img === "string") return { url: normUrl(img) };
    if (img && typeof img === "object") return { ...img, url: normUrl(img.url) };
    return null;
  }).filter(Boolean);

  out.images = normImgs;

  // normalize thumbnail
  if (out.thumbnail) out.thumbnail = normUrl(out.thumbnail);
  if (!out.thumbnail && out.images?.[0]?.url) out.thumbnail = out.images[0].url;

  return out;
}

function loadData() {
  let categories = [];
  let products = [];

  try {
    if (exists(CATS_FILE)) {
      const catsRaw = readJson(CATS_FILE);
      categories = pickArray(catsRaw).map(normalizeCategory);
    }
  } catch (e) {
    return { ok: false, error: `Failed to read categories: ${e.message}`, categories: [], products: [] };
  }

  try {
    if (exists(PRODS_FILE)) {
      const prodsRaw = readJson(PRODS_FILE);
      products = pickArray(prodsRaw).map(normalizeProduct);
    }
  } catch (e) {
    return { ok: false, error: `Failed to read products: ${e.message}`, categories: [], products: [] };
  }

  return { ok: true, categories, products };
}

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-publishable-api-key",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function sendText(res, code, text) {
  res.writeHead(code, {
    "Content-Type": "text/plain; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end(text);
}

function notFound(res) {
  sendText(res, 404, "Not Found\n");
}

http
  .createServer((req, res) => {
    if (!req.url) return notFound(res);
    if (req.method === "OPTIONS") return send(res, 204, { ok: true });

    const u = new URL(req.url, "http://127.0.0.1");
    const pathname = u.pathname.replace(/\/+/g, "/"); // collapse // into /
    const parts = pathname.split("/").filter(Boolean);

    const data = loadData();
    if (!data.ok) return send(res, 500, { ok: false, error: data.error, data_dir: DATA_DIR });

    const { categories, products } = data;

    // health
    if (pathname === "/api/health") {
      return send(res, 200, {
        ok: true,
        data_dir: DATA_DIR,
        files: { categories: CATS_FILE, products: PRODS_FILE },
        counts: { categories: categories.length, products: products.length },
      });
    }

    // categories list
    if (pathname === "/api/categories") {
      return send(res, 200, categories);
    }

    // products list
    if (pathname === "/api/products") {
      return send(res, 200, products);
    }

    // single product by id or handle (robust for product page)
    if (parts[0] === "api" && parts[1] === "product" && parts[2]) {
      const key = normSlug(parts.slice(2).join("/"));
      const p = products.find((x) => x.id === key || normSlug(x.handle) === key);
      if (!p) return send(res, 404, { ok: false, error: "Product not found" });
      return send(res, 200, p);
    }

    // /api/:categoryHandle/products
    if (parts[0] === "api" && parts[1] && parts[2] === "products") {
      const catHandle = normSlug(parts[1]);
      const cat = categories.find((c) => normSlug(c.handle) === catHandle);
      if (!cat) return send(res, 200, []);
      const out = products.filter((p) => (p.product_category_id || p.categoryId) === cat.id);
      return send(res, 200, out);
    }

    return notFound(res);
  })
  .listen(PORT, "127.0.0.1", () => {
    console.log(`[adapter] Listening on :${PORT} | DATA_DIR: ${DATA_DIR}`);
    console.log(`[adapter] CATS: ${CATS_FILE}`);
    console.log(`[adapter] PRODS: ${PRODS_FILE}`);
  });
