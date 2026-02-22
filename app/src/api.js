const API_BASE = (import.meta.env.VITE_STAGE1_API_BASE || '').replace(/\/$/, '')

function apiUrl(path) {
  if (!API_BASE) return path
  return `${API_BASE}${path}`
}

async function readJson(path) {
  const res = await fetch(apiUrl(path), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${path} -> ${res.status} ${res.statusText} ${text}`.trim())
  }
  return res.json()
}

export async function getCategories() {
  return readJson('/api/categories')
}

export async function getProducts() {
  return readJson('/api/products')
}

export async function getProductById(id) {
  return readJson(`/api/products/${encodeURIComponent(id)}`)
}

export async function getProductsByCategory(categoryId) {
  return readJson(`/api/${encodeURIComponent(categoryId)}/products`)
}
