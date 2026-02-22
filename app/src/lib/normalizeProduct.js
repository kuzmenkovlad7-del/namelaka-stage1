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

export function normalizeProduct(raw, index = 0, demo = null) {
  const priceFromRaw =
    raw?.price ??
    raw?.calculated_price ??
    raw?.variants?.[0]?.calculated_price?.calculated_amount ??
    raw?.variants?.[0]?.prices?.[0]?.amount ??
    null

  const title = raw?.title || raw?.name || demo?.title || `Product ${index + 1}`
  const description =
    raw?.description ||
    raw?.subtitle ||
    raw?.short_description ||
    demo?.description ||
    ''

  const image =
    raw?.thumbnail ||
    firstImage(raw?.images) ||
    demo?.image ||
    null

  const heartsRaw = raw?.hearts ?? raw?.metadata?.hearts ?? demo?.hearts ?? 0
  const hearts = Number.parseInt(String(heartsRaw).replace(/[^\d]/g, ''), 10) || 0

  const priceText =
    formatPriceUA(priceFromRaw) ||
    raw?.price_text ||
    demo?.priceText ||
    ''

  return {
    id: raw?.id || `demo-${index + 1}`,
    handle: raw?.handle || `product-${index + 1}`,
    title,
    description,
    image,
    hearts,
    priceText,
    oldPriceText: raw?.oldPrice ? formatPriceUA(raw.oldPrice) : '',
    categoryId:
      raw?.product_category_id ||
      raw?.category_id ||
      raw?.metadata?.category_id ||
      null,
    raw,
  }
}
