import React from 'react'
import * as Pages from './pages.jsx'
import { getCategories, getProducts } from './api.js'
import { normalizeCategory, normalizeProduct } from './lib/normalizeProduct.js'

function parseRoute() {
  const url = new URL(window.location.href)
  const parts = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean)

  let locale = 'uk'
  let rest = parts

  if (parts[0] === 'ua') {
    locale = 'uk'
    rest = parts.slice(1)
  } else if (parts[0] === 'en') {
    locale = 'en'
    rest = parts.slice(1)
  }

  if (rest.length === 0) return { type: 'home', locale }

  if (rest[0] === 'catalog') return { type: 'catalog', locale }
  if (rest[0] === 'category' && rest[1]) return { type: 'category', locale, categoryId: decodeURIComponent(rest[1]) }
  if (rest[0] === 'product' && rest[1]) return { type: 'product', locale, productId: decodeURIComponent(rest[1]) }
  if (rest[0] === 'search') return { type: 'search', locale, query: url.searchParams.get('q') || '' }

  return { type: 'notfound', locale }
}

export default function App() {
  const [route, setRoute] = React.useState(() => parseRoute())
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [categories, setCategories] = React.useState([])
  const [products, setProducts] = React.useState([])

  // SPA navigation: intercept anchor clicks and popstate
  React.useEffect(() => {
    const onNav = () => setRoute(parseRoute())
    window.addEventListener('popstate', onNav)
    return () => window.removeEventListener('popstate', onNav)
  }, [])

  const navigate = React.useCallback((href) => {
    window.history.pushState({}, '', href)
    setRoute(parseRoute())
    window.scrollTo(0, 0)
  }, [])

  // Bootstrap: load categories and products from adapter
  React.useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        setLoading(true)
        setError('')

        const [catsRaw, prodsRaw] = await Promise.all([
          getCategories(),
          getProducts(),
        ])

        if (cancelled) return

        const cats = Array.isArray(catsRaw)
          ? catsRaw.map(normalizeCategory).sort((a, b) => a.rank - b.rank)
          : []

        const prods = Array.isArray(prodsRaw)
          ? prodsRaw.map((p, i) => normalizeProduct(p, i, null))
          : []

        setCategories(cats)
        setProducts(prods)
      } catch (err) {
        console.error('[App] boot error:', err)
        if (!cancelled) setError(err?.message || 'Failed to load data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    boot()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return <div className="stage1-boot">Завантаження…</div>
  }

  if (error) {
    return <div className="stage1-boot stage1-error">{error}</div>
  }

  const common = {
    locale: route.locale,
    categories,
    products,
    onNavigate: navigate,
  }

  if (route.type === 'home') return <Pages.HomePage {...common} />
  if (route.type === 'catalog') return <Pages.CatalogPage {...common} />
  if (route.type === 'category') return <Pages.CategoryPage {...common} categoryId={route.categoryId} />
  if (route.type === 'product') return <Pages.ProductPage {...common} productId={route.productId} />
  if (route.type === 'search') return <Pages.SearchPage {...common} query={route.query} />

  return <Pages.NotFoundPage {...common} />
}
