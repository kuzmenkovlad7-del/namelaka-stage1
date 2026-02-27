#!/usr/bin/env node
/**
 * check-data.mjs
 *
 * Prints a summary of the local data files used by the adapter:
 *   - total products
 *   - total categories
 *   - per category: handle -> count
 *
 * Usage:
 *   node app/scripts/check-data.mjs
 *   DATA_DIR=/path/to/data node app/scripts/check-data.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, "..");

function exists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function resolveDataDir() {
  if (process.env.DATA_DIR && exists(process.env.DATA_DIR)) return process.env.DATA_DIR;

  const localData = path.join(APP_DIR, ".local-data");
  if (exists(path.join(localData, "medusa_categories.json")) && exists(path.join(localData, "medusa_products.json"))) {
    return localData;
  }

  const repoRoot = path.resolve(APP_DIR, "..");
  const fallback = path.join(repoRoot, "data", "fallback");
  if (exists(path.join(fallback, "medusa_categories.json")) && exists(path.join(fallback, "medusa_products.json"))) {
    return fallback;
  }

  return localData;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function pickArray(obj) {
  if (Array.isArray(obj)) return obj;
  if (!obj || typeof obj !== "object") return [];
  return obj.product_categories ?? obj.categories ?? obj.products ?? obj.items ?? obj.data ?? [];
}

function normSlug(v) {
  return String(v ?? "").trim().replace(/^\/+/, "").replace(/\s+/g, "-");
}

const DATA_DIR = resolveDataDir();
const CATS_FILE = path.join(DATA_DIR, "medusa_categories.json");
const PRODS_FILE = path.join(DATA_DIR, "medusa_products.json");
const BY_CAT_FILE = path.join(DATA_DIR, "products_by_category.json");

console.log(`\nData directory: ${DATA_DIR}`);
console.log(`  medusa_categories.json  exists: ${exists(CATS_FILE)}`);
console.log(`  medusa_products.json    exists: ${exists(PRODS_FILE)}`);
console.log(`  products_by_category.json exists: ${exists(BY_CAT_FILE)}`);
console.log();

if (!exists(CATS_FILE) || !exists(PRODS_FILE)) {
  console.error("ERROR: Required data files not found. Run the sync script first:");
  console.error("  MEDUSA_URL=http://localhost:9000 PUBLISHABLE_KEY=pk_xxx node app/scripts/sync-medusa.mjs");
  process.exit(1);
}

const categories = pickArray(readJson(CATS_FILE)).filter(Boolean);
const products = pickArray(readJson(PRODS_FILE)).filter(Boolean);
const byCategory = exists(BY_CAT_FILE) ? readJson(BY_CAT_FILE) : null;

console.log(`Total categories: ${categories.length}`);
console.log(`Total products:   ${products.length}`);
console.log();

if (byCategory) {
  console.log("Per-category product counts (from products_by_category.json):");
  for (const cat of categories) {
    const handle = normSlug(cat.handle || cat.name || "");
    const ids = Array.isArray(byCategory[handle]) ? byCategory[handle] : [];
    const marker = ids.length > 0 ? "✓" : "·";
    console.log(`  ${marker} ${handle.padEnd(25)} ${ids.length} product(s)`);
  }
} else {
  console.log("No products_by_category.json found – computing from product fields:");
  for (const cat of categories) {
    const handle = normSlug(cat.handle || cat.name || "");
    const count = products.filter((p) => {
      const id = p.product_category_id || p.categoryId || p.category_id;
      if (id && id === cat.id) return true;
      const cats = p.categories || p.product_categories || [];
      return Array.isArray(cats) && cats.some((cc) => {
        if (!cc) return false;
        if (typeof cc === "string") return cc === cat.id || normSlug(cc) === handle;
        return (cc.id && cc.id === cat.id) || (cc.handle && normSlug(cc.handle) === handle);
      });
    }).length;
    const marker = count > 0 ? "✓" : "·";
    console.log(`  ${marker} ${handle.padEnd(25)} ${count} product(s)`);
  }
}

console.log();
console.log("To sync from live Medusa:");
console.log("  MEDUSA_URL=http://localhost:9000 PUBLISHABLE_KEY=<key> node app/scripts/sync-medusa.mjs");
console.log();
