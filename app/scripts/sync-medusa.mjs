#!/usr/bin/env node
/**
 * sync-medusa.mjs
 *
 * Syncs categories and products from a local Medusa Store API into
 * app/.local-data/ so the adapter-server can serve them.
 *
 * Usage:
 *   node app/scripts/sync-medusa.mjs
 *   MEDUSA_URL=http://localhost:9000 PUBLISHABLE_KEY=pk_xxx node app/scripts/sync-medusa.mjs
 *
 * Output files (written to DATA_DIR, default app/.local-data/):
 *   medusa_categories.json       – raw categories list
 *   medusa_products.json         – all products enriched with category IDs
 *   products_by_category.json    – { categoryHandle: [productId, ...] }
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, "..");

const MEDUSA_URL = (process.env.MEDUSA_URL || "http://localhost:9000").replace(/\/$/, "");
const PUB_KEY = process.env.PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
const DATA_DIR = process.env.DATA_DIR || path.join(APP_DIR, ".local-data");

function log(msg) {
  process.stdout.write(`[sync] ${msg}\n`);
}

function headers() {
  const h = { "Content-Type": "application/json" };
  if (PUB_KEY) h["x-publishable-api-key"] = PUB_KEY;
  return h;
}

async function get(path) {
  const url = `${MEDUSA_URL}${path}`;
  log(`GET ${url}`);
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}\n${body.slice(0, 400)}`);
  }
  return res.json();
}

async function fetchAllPages(basePath, resultKey, pageSize = 100) {
  const all = [];
  let offset = 0;
  while (true) {
    const sep = basePath.includes("?") ? "&" : "?";
    const data = await get(`${basePath}${sep}limit=${pageSize}&offset=${offset}`);
    const items = data[resultKey] ?? data.data ?? [];
    all.push(...items);
    if (items.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

async function fetchRegionId() {
  try {
    const data = await get("/store/regions?limit=1");
    const regions = data.regions ?? data.data ?? [];
    if (regions.length > 0) {
      const id = regions[0].id;
      log(`Using region_id: ${id} (${regions[0].name ?? ""})`);
      return id;
    }
  } catch (e) {
    log(`WARN: could not fetch regions – prices may be null. ${e.message}`);
  }
  return null;
}

async function fetchCategories() {
  try {
    return await fetchAllPages("/store/product-categories", "product_categories");
  } catch (e) {
    throw new Error(`fetchCategories failed: ${e.message}`);
  }
}

/**
 * Fetch all products belonging to a category, trying both Medusa v1 and v2
 * query param conventions.
 */
async function fetchProductsForCategory(categoryId, regionId) {
  const regionParam = regionId ? `&region_id=${encodeURIComponent(regionId)}` : "";

  // Medusa v2 uses category_id[] array syntax; v1 uses category_id
  const paths = [
    `/store/products?category_id[]=${encodeURIComponent(categoryId)}${regionParam}`,
    `/store/products?category_id=${encodeURIComponent(categoryId)}${regionParam}`,
  ];

  for (const p of paths) {
    try {
      const all = await fetchAllPages(p.split("?")[0] + "?" + p.split("?")[1], "products");
      if (all.length > 0 || p === paths[paths.length - 1]) {
        return all;
      }
    } catch (e) {
      // try next
    }
  }
  return [];
}

function normUrl(u) {
  if (!u) return null;
  try {
    const parsed = new URL(u);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return parsed.pathname + (parsed.search || "");
    }
  } catch (_) {}
  return u;
}

function extractPrice(product, regionId) {
  // calculated_price is present when region_id is supplied
  const variants = product.variants ?? [];
  for (const v of variants) {
    if (v.calculated_price?.calculated_amount != null) {
      return v.calculated_price.calculated_amount;
    }
    const prices = v.prices ?? [];
    for (const pr of prices) {
      if (pr.amount != null) return pr.amount;
    }
  }
  return product.price ?? null;
}

function enrichProduct(product, categoryId, categoryHandle, regionId) {
  const price = extractPrice(product, regionId);

  const images = (product.images ?? []).map((img) => {
    if (typeof img === "string") return { url: normUrl(img) };
    if (img && typeof img === "object") return { ...img, url: normUrl(img.url) };
    return null;
  }).filter(Boolean);

  let thumbnail = product.thumbnail ? normUrl(product.thumbnail) : null;
  if (!thumbnail && images[0]?.url) thumbnail = images[0].url;

  // Build categories array (preserve existing + add this one if not present)
  const existingCats = Array.isArray(product.categories) ? product.categories : [];
  const alreadyLinked = existingCats.some((c) => c.id === categoryId);
  const categories = alreadyLinked
    ? existingCats
    : [...existingCats, { id: categoryId, handle: categoryHandle }];

  return {
    ...product,
    product_category_id: categoryId,
    category_id: categoryId,
    categories,
    price,
    thumbnail,
    images,
  };
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  log(`DATA_DIR: ${DATA_DIR}`);
  log(`MEDUSA_URL: ${MEDUSA_URL}`);

  // 1. fetch region
  const regionId = await fetchRegionId();

  // 2. fetch categories
  log("Fetching categories…");
  const categories = await fetchCategories();
  log(`  Got ${categories.length} categories`);

  const catsOut = { product_categories: categories, count: categories.length, offset: 0, limit: 500 };
  fs.writeFileSync(path.join(DATA_DIR, "medusa_categories.json"), JSON.stringify(catsOut, null, 2));
  log(`Wrote medusa_categories.json`);

  // 3. fetch products per category, dedup
  const productMap = new Map(); // id -> enriched product
  const byCategory = {}; // categoryHandle -> [productId, ...]

  for (const cat of categories) {
    const catId = cat.id;
    const catHandle = cat.handle ?? cat.name ?? catId;
    log(`Fetching products for category ${catHandle} (${catId})…`);

    const prods = await fetchProductsForCategory(catId, regionId);
    log(`  Got ${prods.length} products`);

    byCategory[catHandle] = [];
    for (const p of prods) {
      const enriched = enrichProduct(p, catId, catHandle, regionId);
      if (productMap.has(p.id)) {
        // merge categories
        const existing = productMap.get(p.id);
        const ids = new Set(existing.categories.map((c) => c.id));
        for (const c of enriched.categories) {
          if (!ids.has(c.id)) existing.categories.push(c);
        }
      } else {
        productMap.set(p.id, enriched);
      }
      byCategory[catHandle].push(p.id);
    }
  }

  // 4. write products
  const allProducts = [...productMap.values()];
  const prodsOut = { products: allProducts, count: allProducts.length, offset: 0, limit: 9999 };
  fs.writeFileSync(path.join(DATA_DIR, "medusa_products.json"), JSON.stringify(prodsOut, null, 2));
  log(`Wrote medusa_products.json (${allProducts.length} products)`);

  // 5. write category mapping
  fs.writeFileSync(
    path.join(DATA_DIR, "products_by_category.json"),
    JSON.stringify(byCategory, null, 2)
  );
  log(`Wrote products_by_category.json`);

  // 6. summary
  log("\n=== Sync summary ===");
  log(`  Categories: ${categories.length}`);
  log(`  Total products: ${allProducts.length}`);
  for (const [handle, ids] of Object.entries(byCategory)) {
    log(`  ${handle}: ${ids.length} product(s)`);
  }
  log("Done.");
}

main().catch((e) => {
  process.stderr.write(`[sync] ERROR: ${e.message}\n${e.stack}\n`);
  process.exit(1);
});
