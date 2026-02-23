import React from 'react'
import * as Pages from './pages.jsx'
import { getCategories, getProducts } from './api.js'
import { normalizeCategory, normalizeProduct } from './lib/normalizeProduct.js'

/**
 * Parse the current URL into a route descriptor.
 *
 * Locale prefixes recognised: /ua, /uk (both map to locale='uk'), /en
 * /  → home (locale='uk')
 * /ua, /uk, /en  → home for that locale
 * /<locale>/category/:handle
 * /<locale>/product/:handleOrId
 * /<locale>/catalog
 * /<locale>/search?q=...
 * /<locale>/cart
 * /<locale>/checkout
 */
function parseRoute() {
  const url = new URL(window.location.href)
  const raw = url.pathname.replace(/\/+$/, '')
  const parts = raw.split('/').filter(Boolean)

  // Root path → home
  if (parts.length === 0) return { type: 'home', locale: 'uk' }

  let locale = 'uk'
  let rest = parts

  if (['ua', 'uk', 'en'].includes(parts[0])) {
    locale = parts[0] === 'en' ? 'en' : 'uk'
    rest = parts.slice(1)
  }

  if (rest.length === 0) return { type: 'home', locale }

  if (rest[0] === 'catalog') return { type: 'catalog', locale }
  if (rest[0] === 'cart') return { type: 'cart', locale }
  if (rest[0] === 'checkout') return { type: 'checkout', locale }
  if (rest[0] === 'category' && rest[1]) {
    return { type: 'category', locale, categoryId: decodeURIComponent(rest[1]) }
  }
  if (rest[0] === 'product' && rest[1]) {
    return { type: 'product', locale, productId: decodeURIComponent(rest[1]) }
  }
  if (rest[0] === 'search') {
    return { type: 'search', locale, query: url.searchParams.get('q') || '' }
  }

  return { type: 'notfound', locale }
}

export default function App() {
  const [route, setRoute] = React.useState(() => parseRoute())
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [categories, setCategories] = React.useState([])
  const [products, setProducts] = React.useState([])

  // ── Cart state ──────────────────────────────────────────────────────────
  const [cartItems, setCartItems] = React.useState([])

  const addToCart = React.useCallback((product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, { ...product, quantity }]
    })
  }, [])

  const removeFromCart = React.useCallback((productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId))
  }, [])

  const updateCartQty = React.useCallback((productId, qty) => {
    if (qty <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== productId))
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, quantity: qty } : item
        )
      )
    }
  }, [])

  const clearCart = React.useCallback(() => setCartItems([]), [])

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // ── Drawer state ────────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [cartOpen, setCartOpen] = React.useState(false)

  // ── SPA navigation ──────────────────────────────────────────────────────
  React.useEffect(() => {
    const onNav = () => setRoute(parseRoute())
    window.addEventListener('popstate', onNav)
    return () => window.removeEventListener('popstate', onNav)
  }, [])

  const navigate = React.useCallback((href) => {
    window.history.pushState({}, '', href)
    setRoute(parseRoute())
    window.scrollTo(0, 0)
    // Close all drawers on navigation
    setMenuOpen(false)
    setSearchOpen(false)
    setCartOpen(false)
  }, [])

  // ── Data bootstrap ──────────────────────────────────────────────────────
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

  // Common props passed to every page
  const common = {
    locale: route.locale,
    categories,
    products,
    onNavigate: navigate,
    // Cart
    cartItems,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    cartCount,
    // Drawers
    menuOpen,
    setMenuOpen,
    searchOpen,
    setSearchOpen,
    cartOpen,
    setCartOpen,
  }

  if (route.type === 'home')     return <Pages.HomePage {...common} />
  if (route.type === 'catalog')  return <Pages.CatalogPage {...common} />
  if (route.type === 'cart')     return <Pages.CartPage {...common} />
  if (route.type === 'checkout') return <Pages.CheckoutPage {...common} />
  if (route.type === 'category') return <Pages.CategoryPage {...common} categoryId={route.categoryId} />
  if (route.type === 'product')  return <Pages.ProductPage {...common} productId={route.productId} />
  if (route.type === 'search')   return <Pages.SearchPage {...common} query={route.query} />

  return <Pages.NotFoundPage {...common} />
}
