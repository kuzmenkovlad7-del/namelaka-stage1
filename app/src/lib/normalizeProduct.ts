type AnyObj = Record<string, any>

function asObj(input: unknown): AnyObj {
  return input && typeof input === 'object' ? (input as AnyObj) : {}
}

function str(v: unknown): string {
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return ''
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.').replace(/[^\d.-]/g, ''))
    return Number.isFinite(n) ? n : null
  }
  return null
}

function firstNonEmpty(...values: unknown[]): string {
  for (const v of values) {
    const s = str(v)
    if (s) return s
  }
  return ''
}

function flattenImages(input: any): string[] {
  if (!input) return []
  const out: string[] = []

  const pushIf = (v: unknown) => {
    const s = str(v)
    if (s) out.push(s)
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item === 'string') pushIf(item)
      else if (item && typeof item === 'object') {
        pushIf((item as AnyObj).url)
        pushIf((item as AnyObj).src)
        pushIf((item as AnyObj).original)
        pushIf((item as AnyObj).thumbnail)
        pushIf((item as AnyObj).image)
      }
    }
    return [...new Set(out)]
  }

  if (typeof input === 'object') {
    const obj = input as AnyObj
    pushIf(obj.url)
    pushIf(obj.src)
    pushIf(obj.original)
    pushIf(obj.thumbnail)
    pushIf(obj.image)
    if (Array.isArray(obj.images)) return [...new Set([...out, ...flattenImages(obj.images)])]
    if (Array.isArray(obj.gallery)) return [...new Set([...out, ...flattenImages(obj.gallery)])]
  }

  return [...new Set(out)]
}

function pickPrice(obj: AnyObj): number | null {
  const candidates = [
    obj.price,
    obj.sale_price,
    obj.salePrice,
    obj.final_price,
    obj.finalPrice,
    obj.amount,
    obj.cost,
    obj.min_price,
    obj.minPrice,
  ]
  for (const c of candidates) {
    const n = num(c)
    if (n !== null) return n
  }

  // common nested price shapes
  if (obj.prices && typeof obj.prices === 'object') {
    const po = obj.prices as AnyObj
    const nested = [
      po.price,
      po.amount,
      po.value,
      po.uah,
      po.UAH,
      po.current,
      po.default,
    ]
    for (const c of nested) {
      const n = num(c)
      if (n !== null) return n
    }
  }

  return null
}

function pickCurrency(obj: AnyObj): string {
  return (
    firstNonEmpty(
      obj.currency,
      obj.currency_code,
      obj.currencyCode,
      obj?.prices?.currency,
      obj?.prices?.currency_code,
      obj?.prices?.currencyCode
    ) || 'UAH'
  ).toUpperCase()
}

function pickCategoryId(obj: AnyObj): string | null {
  const direct = firstNonEmpty(
    obj.category_id,
    obj.categoryId,
    obj.category?.id,
    obj.collection_id,
    obj.collectionId,
    obj.group_id,
    obj.groupId
  )
  return direct || null
}

function pickCategoryTitle(obj: AnyObj): string | null {
  const t = firstNonEmpty(
    obj.category_name,
    obj.categoryName,
    obj.category?.name,
    obj.category?.title,
    obj.collection_name,
    obj.collectionName,
    obj.group_name,
    obj.groupName
  )
  return t || null
}

export function normalizeProduct(input: unknown) {
  const obj = asObj(input)

  const id =
    firstNonEmpty(
      obj.id,
      obj._id,
      obj.uuid,
      obj.slug,
      obj.handle,
      obj.code,
      obj.sku
    ) || cryptoRandomFallback()

  const title =
    firstNonEmpty(
      obj.title,
      obj.name,
      obj.product_name,
      obj.productName,
      obj.label
    ) || 'Товар'

  const description =
    firstNonEmpty(
      obj.description,
      obj.desc,
      obj.short_description,
      obj.shortDescription,
      obj.content,
      obj.body
    ) || ''

  const images = [
    ...flattenImages(obj.images),
    ...flattenImages(obj.gallery),
    ...flattenImages(obj.media),
    ...flattenImages(obj.photos),
    ...flattenImages(obj.image),
    ...flattenImages(obj.thumbnail),
    ...flattenImages(obj.cover),
  ].filter(Boolean)

  const uniqueImages = [...new Set(images)]

  const image =
    firstNonEmpty(
      obj.image,
      obj.thumbnail,
      obj.cover,
      uniqueImages[0]
    ) || null

  const activeRaw = obj.is_active ?? obj.active ?? obj.enabled ?? obj.status
  const isActive =
    typeof activeRaw === 'boolean'
      ? activeRaw
      : typeof activeRaw === 'number'
        ? activeRaw !== 0
        : typeof activeRaw === 'string'
          ? !['0', 'false', 'disabled', 'inactive', 'draft'].includes(activeRaw.toLowerCase())
          : true

  return {
    raw: obj,
    id,
    slug: firstNonEmpty(obj.slug, obj.handle) || id,
    title,
    description,
    image,
    images: uniqueImages,
    price: pickPrice(obj),
    currency: pickCurrency(obj),
    categoryId: pickCategoryId(obj),
    categoryTitle: pickCategoryTitle(obj),
    sku: firstNonEmpty(obj.sku, obj.code) || null,
    isActive,
  }
}

export function normalizeProducts(input: unknown): ReturnType<typeof normalizeProduct>[] {
  if (!input) return []

  let list: unknown[] = []

  if (Array.isArray(input)) {
    list = input
  } else if (typeof input === 'object') {
    const obj = input as AnyObj
    list =
      Array.isArray(obj.items) ? obj.items :
      Array.isArray(obj.products) ? obj.products :
      Array.isArray(obj.data) ? obj.data :
      Array.isArray(obj.results) ? obj.results :
      Array.isArray(obj.rows) ? obj.rows :
      []
  }

  return list.map(normalizeProduct).filter((p) => p && p.id)
}

export function normalizeCategory(input: unknown) {
  const obj = asObj(input)

  const id =
    firstNonEmpty(
      obj.id,
      obj._id,
      obj.slug,
      obj.handle,
      obj.code,
      obj.key
    ) || cryptoRandomFallback()

  const title =
    firstNonEmpty(
      obj.title,
      obj.name,
      obj.label
    ) || 'Категорія'

  const icon =
    firstNonEmpty(
      obj.icon,
      obj.icon_url,
      obj.iconUrl,
      obj.image,
      obj.image_url,
      obj.imageUrl,
      obj.thumbnail
    ) || null

  const status = firstNonEmpty(obj.status)
  const activeRaw = obj.is_active ?? obj.active ?? obj.enabled ?? status
  const isActive =
    typeof activeRaw === 'boolean'
      ? activeRaw
      : typeof activeRaw === 'number'
        ? activeRaw !== 0
        : typeof activeRaw === 'string'
          ? !['0', 'false', 'disabled', 'inactive', 'draft'].includes(activeRaw.toLowerCase())
          : true

  return {
    raw: obj,
    id,
    slug: firstNonEmpty(obj.slug, obj.handle) || id,
    title,
    icon,
    isActive,
    sortOrder: num(obj.sort_order ?? obj.sortOrder ?? obj.position ?? obj.order) ?? 9999,
  }
}

export function normalizeCategories(input: unknown): ReturnType<typeof normalizeCategory>[] {
  if (!input) return []

  let list: unknown[] = []

  if (Array.isArray(input)) {
    list = input
  } else if (typeof input === 'object') {
    const obj = input as AnyObj
    list =
      Array.isArray(obj.items) ? obj.items :
      Array.isArray(obj.categories) ? obj.categories :
      Array.isArray(obj.data) ? obj.data :
      Array.isArray(obj.results) ? obj.results :
      Array.isArray(obj.rows) ? obj.rows :
      []
  }

  return list
    .map(normalizeCategory)
    .filter((c) => c && c.id)
    .sort((a, b) => (a.sortOrder - b.sortOrder) || a.title.localeCompare(b.title))
}

function cryptoRandomFallback() {
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {}
  return `id_${Math.random().toString(36).slice(2, 10)}`
}
