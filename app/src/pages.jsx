import React from 'react'
import Header from './components/Header.jsx'
import CategoryTabs, { UK_NAMES } from './components/CategoryTabs.jsx'
import ProductGrid from './components/ProductGrid.jsx'

function t(locale, uk, en) {
  return locale === 'en' ? en : uk
}


function slugOrIdMatch(routeValue, category) {
  if (!routeValue || !category) return false
  return routeValue === category.id || routeValue === category.handle
}

/* ─── Back arrow icon ────────────────────────────────────────────────── */
function BackArrow() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
         xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M19 12H5" strokeWidth="1.3" strokeLinecap="round"
            strokeLinejoin="round" stroke="currentColor" />
      <path d="M12 19l-7-7 7-7" strokeWidth="1.3" strokeLinecap="round"
            strokeLinejoin="round" stroke="currentColor" />
    </svg>
  )
}

/**
 * MenuDrawer — slides in from the left, shows site navigation.
 * Used by PageShell when burger is tapped.
 */
function MenuDrawer({ locale, categories, onNavigate, onClose }) {
  const nav = (href) => (e) => {
    e.preventDefault()
    onClose()
    onNavigate(href)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.25)',
        }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 280, zIndex: 101,
        background: '#ffebef',
        display: 'flex', flexDirection: 'column',
        padding: '24px 0 24px',
        boxShadow: '2px 0 16px rgba(142,21,0,0.08)',
        overflowY: 'auto',
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            alignSelf: 'flex-end', marginRight: 20, marginBottom: 16,
            color: '#8e1500', padding: 4,
          }}
          aria-label="Закрити меню"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18" strokeWidth="1.5" strokeLinecap="round" stroke="currentColor"/>
            <path d="M6 6L18 18" strokeWidth="1.5" strokeLinecap="round" stroke="currentColor"/>
          </svg>
        </button>

        {/* Logo */}
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #f0c9ce' }}>
          <a href={`/${locale}`} onClick={nav(`/${locale}`)} style={{ textDecoration: 'none' }}>
            <img
              src="/original-assets/assets/icons/logo-header-primary.svg"
              alt="Namelaka"
              style={{ height: 48, display: 'block' }}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </a>
        </div>

        {/* Categories */}
        <nav style={{ padding: '12px 0' }}>
          {categories.map((cat) => {
            const displayName = locale !== 'en' ? (UK_NAMES[cat.handle] || cat.name) : cat.name
            return (
              <a
                key={cat.id}
                href={`/${locale}/category/${encodeURIComponent(cat.handle)}`}
                onClick={nav(`/${locale}/category/${encodeURIComponent(cat.handle)}`)}
                style={{
                  display: 'block',
                  padding: '12px 20px',
                  color: '#8e1500',
                  textDecoration: 'none',
                  fontSize: 16,
                  fontWeight: 400,
                  borderBottom: '1px solid #f8e8eb',
                }}
              >
                {displayName}
              </a>
            )
          })}
        </nav>

        {/* Bottom links */}
        <div style={{ marginTop: 'auto', padding: '16px 20px 0', borderTop: '1px solid #f0c9ce' }}>
          <a
            href={`/${locale}/search`}
            onClick={nav(`/${locale}/search`)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8e1500', textDecoration: 'none', padding: '10px 0' }}
          >
            <img src="/original-assets/assets/icons/search-primary.svg" alt="" style={{ width: 20, height: 20 }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
            <span style={{ fontSize: 15 }}>Пошук</span>
          </a>
          <a
            href={`/${locale}/cart`}
            onClick={nav(`/${locale}/cart`)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8e1500', textDecoration: 'none', padding: '10px 0' }}
          >
            <img src="/original-assets/assets/icons/cart-secondary.svg" alt="" style={{ width: 20, height: 20 }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
            <span style={{ fontSize: 15 }}>Кошик</span>
          </a>
        </div>
      </div>
    </>
  )
}

/**
 * PageShell – wraps every page with the original site chrome:
 *   app-root
 *     app-header
 *     app-categories (category strip)
 *     .main
 *       {children}
 *
 * Uses React components with original class names so both
 * styles-ZBSN6PDF.css and original-components.css apply correctly.
 */
export function PageShell({
  locale = 'ua',
  categories = [],
  activeCategoryHandle = null,
  onNavigate,
  children,
}) {
  const [menuOpen, setMenuOpen] = React.useState(false)

  return (
    <app-root>
      {/* Fixed background pattern */}
      <div
        className="pattern-background"
        style={{
          backgroundImage: 'url(/original/ua/media/pattern-row-H7J5CE3O.svg)',
          backgroundRepeat: 'repeat',
          backgroundSize: '100% auto',
          backgroundPosition: 'top center',
          position: 'fixed',
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
        }}
      />

      {menuOpen && (
        <MenuDrawer
          locale={locale}
          categories={categories}
          onNavigate={onNavigate}
          onClose={() => setMenuOpen(false)}
        />
      )}

      <Header
        locale={locale}
        onNavigate={onNavigate}
        onMenuToggle={() => setMenuOpen((o) => !o)}
      />

      <CategoryTabs
        locale={locale}
        categories={categories}
        activeCategoryHandle={activeCategoryHandle}
        onNavigate={onNavigate}
      />

      <div className="main content-below-sidebar categories-margin">
        {children}
      </div>
    </app-root>
  )
}

/* ======================================================================
   Home / Catalog pages
   ====================================================================== */

export function HomePage({ locale = 'ua', products = [], categories = [], onNavigate }) {
  return (
    <PageShell locale={locale} categories={categories} onNavigate={onNavigate}>
      <app-catalog>
        <ProductGrid
          locale={locale}
          products={products}
          emptyText={t(locale, 'Товарів поки немає', 'No products yet')}
          onNavigate={onNavigate}
        />
      </app-catalog>
    </PageShell>
  )
}

export function CatalogPage({ locale = 'ua', products = [], categories = [], onNavigate }) {
  return (
    <PageShell locale={locale} categories={categories} onNavigate={onNavigate}>
      <app-catalog>
        <ProductGrid
          locale={locale}
          products={products}
          emptyText={t(locale, 'Товарів поки немає', 'No products yet')}
          onNavigate={onNavigate}
        />
      </app-catalog>
    </PageShell>
  )
}

/* ======================================================================
   Category page
   ====================================================================== */

export function CategoryPage({
  locale = 'ua',
  categoryId,
  categories = [],
  products = [],
  onNavigate,
}) {
  const category = categories.find((c) => slugOrIdMatch(categoryId, c))

  const filtered = category
    ? products.filter(
        (p) => p.categoryId === category.id || p.product_category_id === category.id
      )
    : []

  return (
    <PageShell
      locale={locale}
      categories={categories}
      activeCategoryHandle={category?.handle || null}
      onNavigate={onNavigate}
    >
      <app-catalog>
        {category ? (
          <ProductGrid
            locale={locale}
            products={filtered}
            emptyText={t(
              locale,
              'У цій категорії поки немає товарів',
              'No products in this category yet'
            )}
            onNavigate={onNavigate}
          />
        ) : (
          <div className="stage1-empty">
            {t(locale, 'Категорію не знайдено', 'Category not found')}
          </div>
        )}
      </app-catalog>
    </PageShell>
  )
}

/* ======================================================================
   Product detail page
   ====================================================================== */

export function ProductPage({
  locale = 'ua',
  productId,
  products = [],
  categories = [],
  onNavigate,
}) {
  const product = products.find((p) => p.id === productId || p.handle === productId)

  const backHref = `/${locale}`

  return (
    <PageShell locale={locale} categories={categories} onNavigate={onNavigate}>
      {!product ? (
        <div className="stage1-empty">
          {t(locale, 'Товар не знайдено', 'Product not found')}
        </div>
      ) : (
        <div className="stage1-product-page">
          <div className="stage1-product-media">
            {product.image ? (
              <img src={product.image} alt={product.title} />
            ) : (
              <div className="stage1-image-fallback stage1-image-fallback-large" />
            )}
          </div>

          <div className="stage1-product-info">
            <h1 className="serif">{product.title}</h1>

            {product.priceText && (
              <div className="stage1-product-price">{product.priceText}</div>
            )}

            {product.description && (
              <p>{product.description}</p>
            )}

            <div className="stage1-actions">
              {/* Add to cart – navigates to cart in Stage 1 */}
              <a
                href={`/${locale}/cart`}
                className="stage1-btn-primary"
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(`/${locale}/cart`)
                }}
              >
                {t(locale, 'Замовити', 'Order')}
              </a>

              <a
                href={backHref}
                className="stage1-btn"
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(backHref)
                }}
              >
                {t(locale, 'Назад', 'Back')}
              </a>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

/* ======================================================================
   Search page
   ====================================================================== */

export function SearchPage({
  locale = 'ua',
  query = '',
  products = [],
  categories = [],
  onNavigate,
}) {
  const [inputValue, setInputValue] = React.useState(query || '')
  const inputRef = React.useRef(null)

  // Sync if query changes via URL navigation
  React.useEffect(() => {
    setInputValue(query || '')
  }, [query])

  // Auto-focus the input when the search page mounts
  React.useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  const q = String(inputValue || '').trim().toLowerCase()
  const filtered = !q
    ? []
    : products.filter((p) =>
        `${p.title} ${p.description}`.toLowerCase().includes(q)
      )

  const handleChange = (e) => {
    const val = e.target.value
    setInputValue(val)
    // Update URL without navigation flash (replaceState keeps history clean)
    const newUrl = `/${locale}/search` + (val.trim() ? `?q=${encodeURIComponent(val.trim())}` : '')
    window.history.replaceState({}, '', newUrl)
  }

  return (
    <PageShell locale={locale} categories={categories} onNavigate={onNavigate}>
      <app-catalog>
        {/* Search input */}
        <div className="stage1-search-input-wrap">
          <img
            src="/original-assets/assets/icons/search-primary.svg"
            alt=""
            className="stage1-search-icon"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <input
            ref={inputRef}
            type="search"
            className="stage1-search-input"
            value={inputValue}
            onChange={handleChange}
            placeholder={t(locale, 'Введіть запит для пошуку', 'Search...')}
            autoComplete="off"
          />
        </div>

        {q && (
          <div className="stage1-search-header">
            <span className="stage1-search-query-display">
              {t(locale, `Результати для: "${q}"`, `Results for: "${q}"`)}
            </span>
          </div>
        )}
        {/* Only render ProductGrid when there's a query — avoids duplicate hint */}
        {q ? (
          <ProductGrid
            locale={locale}
            products={filtered}
            emptyText={t(locale, 'Нічого не знайдено', 'Nothing found')}
            onNavigate={onNavigate}
          />
        ) : null}
      </app-catalog>
    </PageShell>
  )
}

/* ======================================================================
   Cart page
   ====================================================================== */

export function CartPage({ locale = 'ua', categories = [], onNavigate }) {
  return (
    <PageShell locale={locale} categories={categories} onNavigate={onNavigate}>
      <div className="stage1-cart-page">
        {/* Header row */}
        <div className="stage1-cart-header">
          <h1 className="serif">
            {t(locale, 'Кошик', 'Cart')}
          </h1>
        </div>

        {/* Empty cart state */}
        <div className="stage1-empty-cart">
          <div className="stage1-empty-cart-icon">
            <img
              src="/original-assets/assets/icons/empty-cart-primary.svg"
              alt="empty cart"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>

          <div className="stage1-empty-cart-text">
            <h3 className="serif" style={{ marginBottom: 8 }}>
              {t(locale, 'Кошик порожній', 'Your cart is empty')}
            </h3>
            <p className="text-body default" style={{ color: '#9b6a68' }}>
              {t(
                locale,
                'Додайте товари, щоб продовжити оформлення замовлення',
                'Add items to proceed with checkout'
              )}
            </p>
          </div>

          <div className="stage1-empty-cart-actions">
            <a
              href={`/${locale}`}
              className="stage1-btn-primary"
              onClick={(e) => {
                e.preventDefault()
                onNavigate(`/${locale}`)
              }}
            >
              {t(locale, 'Перейти до каталогу', 'Go to catalogue')}
            </a>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

/* ======================================================================
   Checkout page
   ====================================================================== */

export function CheckoutPage({ locale = 'ua', categories = [], onNavigate }) {
  return (
    <PageShell locale={locale} categories={categories} onNavigate={onNavigate}>
      <div className="stage1-checkout-page">
        <div className="stage1-checkout-inner">
          <h1 className="serif stage1-checkout-title">
            {t(locale, 'Оформлення замовлення', 'Checkout')}
          </h1>

          <div className="stage1-checkout-section">
            <h3>{t(locale, 'Контактні дані', 'Contact details')}</h3>
            <p>
              {t(
                locale,
                'Будь ласка, поверніться до кошика та додайте товари перед оформленням замовлення.',
                'Please return to the cart and add items before proceeding to checkout.'
              )}
            </p>
          </div>

          <div className="stage1-checkout-actions">
            <a
              href={`/${locale}/cart`}
              className="stage1-btn-primary"
              onClick={(e) => {
                e.preventDefault()
                onNavigate(`/${locale}/cart`)
              }}
            >
              {t(locale, 'Повернутись до кошика', 'Return to cart')}
            </a>
            <a
              href={`/${locale}`}
              className="stage1-btn"
              onClick={(e) => {
                e.preventDefault()
                onNavigate(`/${locale}`)
              }}
            >
              {t(locale, 'Продовжити покупки', 'Continue shopping')}
            </a>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

/* ======================================================================
   404 page
   ====================================================================== */

export function NotFoundPage({ locale = 'ua', categories = [], onNavigate }) {
  return (
    <PageShell locale={locale} categories={categories} onNavigate={onNavigate}>
      <div className="stage1-empty" style={{ textAlign: 'center', marginTop: 40 }}>
        <img
          src="/original-assets/assets/icons/errors/error-404.svg"
          alt="404"
          style={{ display: 'block', margin: '0 auto 16px', maxWidth: '200px' }}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        {t(locale, 'Сторінку не знайдено', 'Page not found')}
      </div>
    </PageShell>
  )
}

export default {
  HomePage,
  CatalogPage,
  CategoryPage,
  ProductPage,
  SearchPage,
  CartPage,
  CheckoutPage,
  NotFoundPage,
}
