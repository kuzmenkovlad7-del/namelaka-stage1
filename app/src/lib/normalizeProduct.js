function firstImage(images) {
  if (!Array.isArray(images) || images.length === 0) return null
  const x = images[0]
  if (!x) return null
  if (typeof x === 'string') return x
  return x.url || x.src || null
}

function formatPriceUA(value) {
  if (value == null || Number.isNaN(Number(value))) return null
  return `₴ ${Math.round(Number(value))}`
}

export function normalizeCategory(cat, index = 0) {
  const handle = cat?.handle || `category-${index + 1}`
  return {
    id: cat?.id || handle,
    handle,
    name: cat?.name || handle,
    description: cat?.description || '',
    rank: Number.isFinite(cat?.rank) ? cat.rank : index,
    images: Array.isArray(cat?.images) ? cat.images : [],
  }
}

export function normalizeProduct(raw, index = 0, _demo = null) {
  const priceFromRaw =
    raw?.price ??
    raw?.calculated_price ??
    raw?.variants?.[0]?.calculated_price?.calculated_amount ??
    raw?.variants?.[0]?.prices?.[0]?.amount ??
    null

  const title = raw?.title || raw?.name || `Product ${index + 1}`
  const description = raw?.description || raw?.subtitle || raw?.short_description || ''

  // Normalize image: prefer thumbnail, fall back to first image.
  // If the URL is absolute pointing to localhost (already rewritten by adapter),
  // use it as-is (relative path).
  const image =
    raw?.thumbnail ||
    firstImage(raw?.images) ||
    null

  const heartsRaw = raw?.hearts ?? raw?.metadata?.hearts ?? 0
  const hearts = Number.parseInt(String(heartsRaw).replace(/[^\d]/g, ''), 10) || 0

  const priceText =
    formatPriceUA(priceFromRaw) ||
    raw?.price_text ||
    ''

  // Category linkage — the adapter resolves product_category_id via its
  // guessCategoryId() function (title/handle keyword matching) before sending
  // the payload. Both product_category_id and categoryId fields are set there.
  const categoryId =
    raw?.product_category_id ||
    raw?.categoryId ||
    raw?.category_id ||
    raw?.category?.id ||
    raw?.metadata?.category_id ||
    null

  return {
    id: raw?.id || `demo-${index + 1}`,
    handle: String(raw?.handle || `product-${index + 1}`).replace(/^\/+/, ''),
    title,
    description,
    image,
    hearts,
    priceText,
    oldPriceText: raw?.oldPrice ? formatPriceUA(raw.oldPrice) : '',
    categoryId,
    product_category_id: categoryId,
    raw,
  }
}
