import fs from "fs";
import path from "path";
import os from "os";

const APP_DIR = process.cwd();
const DATA_DIR = process.env.DATA_DIR || path.join(APP_DIR, ".local-data");
const MEDUSA_URL = (process.env.MEDUSA_URL || "http://127.0.0.1:9000").replace(/\/+$/, "");

function readKeyFromFile() {
  try {
    const p = path.join(os.homedir(), "projects", "namelaka_stage1_key.env");
    if (!fs.existsSync(p)) return "";
    const t = fs.readFileSync(p, "utf8");
    const m = t.match(/^PUBLISHABLE_API_KEY=(.+)$/m);
    return m ? m[1].trim() : "";
  } catch {
    return "";
  }
}

const KEY =
  (process.env.PUBLISHABLE_API_KEY || "").trim() ||
  (process.env.PUBLISHABLE_KEY || "").trim() ||
  readKeyFromFile();

const HEADERS = KEY ? { "x-publishable-api-key": KEY } : {};

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}\n${text}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON from ${url}\n${text.slice(0, 500)}`);
  }
}

function pickArray(j, keys) {
  for (const k of keys) {
    const v = j?.[k];
    if (Array.isArray(v)) return v;
  }
  return Array.isArray(j) ? j : [];
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function main() {
  ensureDir(DATA_DIR);

  console.log(`[sync] DATA_DIR: ${DATA_DIR}`);
  console.log(`[sync] MEDUSA_URL: ${MEDUSA_URL}`);
  console.log(`[sync] KEY: ${KEY ? "OK" : "MISSING"}`);

  if (!KEY) {
    throw new Error("Missing PUBLISHABLE_API_KEY. Put it into ~/projects/namelaka_stage1_key.env");
  }

  // 1) region_id (для цен)
  let regionId = "";
  try {
    const regions = await fetchJson(`${MEDUSA_URL}/store/regions?limit=50`);
    const arr = pickArray(regions, ["regions", "items"]);
    regionId = arr?.[0]?.id || "";
  } catch (e) {
    console.log(`[sync] WARN: regions not fetched, prices may be null`);
  }

  // 2) categories
  console.log("[sync] Fetching categories…");
  const catResp = await fetchJson(`${MEDUSA_URL}/store/product-categories?limit=200&offset=0`);
  const categories = pickArray(catResp, ["product_categories", "categories", "items"]);
  fs.writeFileSync(path.join(DATA_DIR, "medusa_categories.json"), JSON.stringify(categories, null, 2));

  // 3) products per category -> build mapping
  console.log("[sync] Fetching products per category…");
  const byCategory = {};
  const productsById = new Map();

  for (const c of categories) {
    const handle = String(c?.handle || "").replace(/^\/+/, "");
    const id = c?.id;
    if (!handle || !id) continue;

    const url =
      `${MEDUSA_URL}/store/products?limit=200&category_id=${encodeURIComponent(id)}` +
      (regionId ? `&region_id=${encodeURIComponent(regionId)}` : "");

    const prodResp = await fetchJson(url);
    const products = pickArray(prodResp, ["products", "items"]);
    const ids = [];

    for (const p of products) {
      if (!p?.id) continue;
      ids.push(p.id);

      // обогащаем продукт категориями, чтобы дальше было проще
      const cur = productsById.get(p.id) || p;
      const cats = Array.isArray(cur.categories) ? cur.categories : [];
      if (!cats.some((x) => x?.id === id)) {
        cats.push({ id, handle, name: c?.name || "" });
      }
      cur.categories = cats;

      // нормализуем handle у продукта (убрать ведущий /)
      if (typeof cur.handle === "string") cur.handle = cur.handle.replace(/^\/+/, "");

      productsById.set(p.id, cur);
    }

    byCategory[handle] = ids;
  }

  // 4) also fetch all products (на всякий случай)
  console.log("[sync] Fetching all products…");
  const allUrl =
    `${MEDUSA_URL}/store/products?limit=200` +
    (regionId ? `&region_id=${encodeURIComponent(regionId)}` : "");
  const allResp = await fetchJson(allUrl);
  const allProducts = pickArray(allResp, ["products", "items"]);
  for (const p of allProducts) {
    if (!p?.id) continue;
    const cur = productsById.get(p.id) || p;
    if (typeof cur.handle === "string") cur.handle = cur.handle.replace(/^\/+/, "");
    productsById.set(p.id, cur);
  }

  const mergedProducts = Array.from(productsById.values());

  fs.writeFileSync(path.join(DATA_DIR, "medusa_products.json"), JSON.stringify(mergedProducts, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "products_by_category.json"), JSON.stringify(byCategory, null, 2));

  // summary
  const perCat = Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.length]));
  console.log("[sync] OK");
  console.log(`[sync] categories: ${categories.length}`);
  console.log(`[sync] products:   ${mergedProducts.length}`);
  console.log(`[sync] per_category:`, perCat);
  console.log(`[sync] wrote:`);
  console.log(`  ${path.join(DATA_DIR, "medusa_categories.json")}`);
  console.log(`  ${path.join(DATA_DIR, "medusa_products.json")}`);
  console.log(`  ${path.join(DATA_DIR, "products_by_category.json")}`);
}

main().catch((e) => {
  console.error(String(e?.message || e));
  process.exit(1);
});
