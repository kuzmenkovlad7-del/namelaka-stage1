export function formatPrice(v, locale = 'uk-UA') {
  if (v == null || Number.isNaN(Number(v))) return '₴ —'
  return `₴ ${new Intl.NumberFormat(locale).format(Math.round(Number(v)))}`
}

export function getLocaleFromPath(pathname) {
  const seg = pathname.split('/').filter(Boolean)[0]
  return seg === 'en' ? 'en' : 'ua'
}

export function stripLocale(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'ua' || parts[0] === 'en') parts.shift()
  return '/' + parts.join('/')
}

export function withLocale(locale, path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `/${locale}${p === '/' ? '/' : p}`
}
