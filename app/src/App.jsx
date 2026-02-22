import React from 'react'
import * as Pages from './pages.jsx'
import { getCategories, getProducts } from './api.js'
import { normalizeCategory, normalizeProduct } from './lib/normalizeProduct.js'
import { loadOriginalSnapshot } from './lib/originalSnapshot.js'

function parseRoute() {
  const url = new URL(window.location.href)
  const parts = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean)

  let locale = 'uk'
  let rest = parts

  if (parts[0] === 'ua' || parts[0] === 'en') {
    locale = parts[0] === 'ua' ? 'uk' : 'en'
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
  const [snapshot, setSnapshot] = React.useState({ headerHtml: '', categoriesHtml: '', demoCards: [] })
  const [categories, setCategories] = React.useState([])
  const [products, setProducts] = React.useState([])

  React.useEffect(() => {
    const onNav = () => setRoute(parseRoute())
    window.addEventListener('popstate', onNav)

    const onClick = (e) => {
      const a = e.target.closest('a[href]')
      if (!a) return
      const href = a.getAttribute('href') || ''
      if (!href.startsWith('/')) return
      if (a.target === '_blank') return
      e.preventDefault()
      window.history.pushState({}, '', href)
      setRoute(parseRoute())
    }

    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('popstate', onNav)
      document.removeEventListener('click', onClick)
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        setLoading(true)
        setError('')

        const [snap, catsRaw, prodsRaw] = await Promise.all([
          loadOriginalSnapshot(),
          getCategories(),
          getProducts(),
        ])

        if (cancelled) return

        const cats = Array.isArray(catsRaw) ? catsRaw.map(normalizeCategory) : []
        const demoCards = Array.isArray(snap?.demoCards) ? snap.demoCards : []
        const prods = Array.isArray(prodsRaw)
          ? prodsRaw.map((p, i) => normalizeProduct(p, i, demoCards[i] || demoCards[i % Math.max(demoCards.length, 1)] || null))
          : []

        setSnapshot(snap)
        setCategories(cats.sort((a, b) => a.rank - b.rank))
        setProducts(prods)
      } catch (err) {
        console.error(err)
        if (!cancelled) setError(err?.message || 'Failed to load stage1 data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    boot()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <div className="stage1-boot">Loading…</div>
  }

  if (error) {
    return <div className="stage1-boot stage1-error">{error}</div>
  }

  const common = { locale: route.locale, snapshot, categories, products }

  if (route.type === 'home') {
    return <Pages.HomePage {...common} />
  }

  if (route.type === 'catalog') {
    return <Pages.CatalogPage {...common} />
  }

  if (route.type === 'category') {
    return <Pages.CategoryPage {...common} categoryId={route.categoryId} />
  }

  if (route.type === 'product') {
    return <Pages.ProductPage {...common} productId={route.productId} />
  }

  if (route.type === 'search') {
    return <Pages.SearchPage {...common} query={route.query} />
  }

  return <Pages.NotFoundPage {...common} />
}
