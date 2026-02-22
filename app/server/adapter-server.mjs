import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const PORT = Number(process.env.PORT || 3010)
const MEDUSA_URL = process.env.MEDUSA_URL || 'http://127.0.0.1:9000'
const MEDUSA_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || ''
const DATA_DIR = process.env.DATA_DIR || '/var/www/namelaka-stage1'
const CATS_FILE = path.join(DATA_DIR, 'medusa_categories.json')
const PRODS_FILE = path.join(DATA_DIR, 'medusa_products.json')

function send(res, code, data, type='application/json') {
  res.writeHead(code, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' })
  res.end(type === 'application/json' ? JSON.stringify(data) : data)
}
function parseJSONFile(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return fallback }
}
function pick(obj, ...keys) { for (const k of keys) if (obj && obj[k] != null) return obj[k]; return undefined }
function normCats(raw) {
  const arr = Array.isArray(raw) ? raw : raw?.product_categories || raw?.categories || []
  return arr.map((c, i) => ({ id: c.id || String(i), name: c.name || c.title || 'Category', description: c.description || '', handle: c.handle || '', rank: Number.isFinite(c.rank) ? c.rank : i, images: Array.isArray(c.images) ? c.images : [] }))
}
function normProducts(raw) {
  const arr = Array.isArray(raw) ? raw : raw?.products || []
  return arr.map((p) => ({
    id: p.id,
    name: pick(p,'name','title') || 'Product',
    title: pick(p,'title','name') || 'Product',
    description: p.description || '',
    smallSizeDescription: p.smallSizeDescription || '',
    bigSizeDescription: p.bigSizeDescription || '',
    images: Array.isArray(p.images) ? p.images.map(x => typeof x === 'string' ? x : x?.url).filter(Boolean) : [],
    price: p.price ?? null,
    oldPrice: p.oldPrice ?? null,
    hearts: Number(p.hearts || 0),
    handle: p.handle || '',
    product_category_id: p.product_category_id || p.categoryId || p.category?.id || null,
    thumbnail: p.thumbnail || null,
    variants: p.variants || []
  }))
}
async function medusaFetch(url) {
  const headers = { 'accept': 'application/json' }
  if (MEDUSA_KEY) headers['x-publishable-api-key'] = MEDUSA_KEY
  const r = await fetch(url, { headers })
  if (!r.ok) throw new Error(`medusa ${r.status}`)
  return r.json()
}
async function loadData() {
  try {
    const [cats, prods] = await Promise.all([
      medusaFetch(`${MEDUSA_URL}/store/product-categories`),
      medusaFetch(`${MEDUSA_URL}/store/products?limit=200`)
    ])
    return { source: 'medusa', cats: normCats(cats), prods: normProducts(prods), medusa: true }
  } catch {
    const cats = normCats(parseJSONFile(CATS_FILE, []))
    const prods = normProducts(parseJSONFile(PRODS_FILE, []))
    return { source: 'fallback', cats, prods, medusa: false }
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  if (req.method === 'OPTIONS') return send(res, 204, {})
  if (url.pathname === '/_health') {
    const d = await loadData()
    return send(res, 200, { ok:true, port:PORT, medusa_url:MEDUSA_URL, medusa_key_set:Boolean(MEDUSA_KEY), medusa:d.medusa, source:d.source, counts:{ categories:d.cats.length, products:d.prods.length }, fallback:{ catsFile:CATS_FILE, prodsFile:PRODS_FILE } })
  }
  const d = await loadData()
  const p = url.pathname
  if (p === '/api/categories') return send(res, 200, d.cats)
  if (p === '/api/products') return send(res, 200, d.prods)
  if (p === '/api/test/products') return send(res, 200, d.prods.slice(0,20))
  if (p.startsWith('/api/search')) {
    const q = (url.searchParams.get('search') || '').toLowerCase().trim()
    const list = !q ? d.prods : d.prods.filter(x => `${x.name} ${x.title} ${x.description}`.toLowerCase().includes(q))
    return send(res, 200, list)
  }
  const mProd = p.match(/^\/api\/products\/([^/]+)$/)
  if (mProd) {
    const id = decodeURIComponent(mProd[1])
    const item = d.prods.find(x => x.id === id || x.handle === id)
    return item ? send(res, 200, item) : send(res, 404, { error:'Not found' })
  }
  const mCatProducts = p.match(/^\/api\/([^/]+)\/products$/)
  if (mCatProducts) {
    const catId = decodeURIComponent(mCatProducts[1])
    const list = d.prods.filter(x => x.product_category_id === catId || x.categoryId === catId || x.categoryHandle === catId)
    return send(res, 200, list)
  }
  if (/^\/api\/products\/hearts\//.test(p)) return send(res, 200, { ok:true })
  return send(res, 404, { error:'Not found', path:p })
})
server.listen(PORT, '0.0.0.0', () => console.log(`Adapter on :${PORT}`))
