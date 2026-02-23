import React from 'react'
import Header from './components/Header.jsx'
import CategoryTabs from './components/CategoryTabs.jsx'
import ProductGrid from './components/ProductGrid.jsx'
import MenuDrawer from './components/MenuDrawer.jsx'
import SearchPanel from './components/SearchPanel.jsx'
import CartDrawer from './components/CartDrawer.jsx'

function t(locale, uk, en) {
  return locale === 'en' ? en : uk
}

function slugOrIdMatch(routeValue, category) {
  if (!routeValue || !category) return false
  return routeValue === category.id || routeValue === category.handle
}

/**
 * PageShell – wraps every page with the site chrome:
 *   app-root
 *     app-header
 *     app-categories
 *     .main
 *       {children}
 *
 * Also renders the three overlay drawers (menu, search, cart) which are
 * portal-level components that sit on top of the page content.
 */
export function PageShell({
  locale = 'uk',
  categories = [],
  products = [],
  activeCategoryHandle = null,
  onNavigate,
  children,
  // Cart
  cartItems = [],
  addToCart,
  removeFromCart,
  updateCartQty,
  clearCart,
  cartCount = 0,
  // Drawers
  menuOpen = false,
  setMenuOpen,
  searchOpen = false,
  setSearchOpen,
  cartOpen = false,
  setCartOpen,
}) {
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
          pointerEvents: 'none',
        }}
      />

      <Header
        locale={locale}
        onNavigate={onNavigate}
        cartCount={cartCount}
        onMenuOpen={() => setMenuOpen?.(true)}
        onSearchOpen={() => setSearchOpen?.(true)}
        onCartOpen={() => setCartOpen?.(true)}
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

      {/* Overlay drawers */}
      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen?.(false)}
        locale={locale}
        categories={categories}
        onNavigate={onNavigate}
      />
      <SearchPanel
        open={searchOpen}
        onClose={() => setSearchOpen?.(false)}
        locale={locale}
        products={products}
        onNavigate={onNavigate}
      />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen?.(false)}
        locale={locale}
        cartItems={cartItems}
        removeFromCart={removeFromCart}
        updateCartQty={updateCartQty}
        onNavigate={onNavigate}
      />
    </app-root>
  )
}

// ─── Home ──────────────────────────────────────────────────────────────────
export function HomePage(props) {
  const { locale, products, categories, onNavigate } = props
  return (
    <PageShell {...props}>
      <app-catalog>
        <ProductGrid
          locale={locale}
          products={products}
          onNavigate={onNavigate}
          emptyText={t(locale, 'Товарів поки немає', 'No products yet')}
        />
      </app-catalog>
    </PageShell>
  )
}

// ─── Catalog ───────────────────────────────────────────────────────────────
export function CatalogPage(props) {
  const { locale, products, onNavigate } = props
  return (
    <PageShell {...props}>
      <app-catalog>
        <ProductGrid
          locale={locale}
          products={products}
          onNavigate={onNavigate}
          emptyText={t(locale, 'Товарів поки немає', 'No products yet')}
        />
      </app-catalog>
    </PageShell>
  )
}

// ─── Category ──────────────────────────────────────────────────────────────
export function CategoryPage(props) {
  const { locale, categoryId, categories, products, onNavigate } = props

  const category = categories.find((c) => slugOrIdMatch(categoryId, c))

  const filtered = category
    ? products.filter(
        (p) =>
          p.categoryId === category.id ||
          p.product_category_id === category.id
      )
    : []

  return (
    <PageShell
      {...props}
      activeCategoryHandle={category?.handle || null}
    >
      <app-catalog>
        {category ? (
          <ProductGrid
            locale={locale}
            products={filtered}
            onNavigate={onNavigate}
            emptyText={t(
              locale,
              'У цій категорії поки немає товарів',
              'No products in this category yet'
            )}
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

// ─── Product ───────────────────────────────────────────────────────────────
export function ProductPage(props) {
  const { locale, productId, products, categories, onNavigate, addToCart } = props

  const product = products.find(
    (p) => p.id === productId || p.handle === productId
  )

  const [added, setAdded] = React.useState(false)

  const handleAddToCart = () => {
    if (!product) return
    addToCart?.(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <PageShell {...props}>
      {!product ? (
        <div className="stage1-empty">
          <img
            src="/original-assets/assets/icons/errors/error-404.svg"
            alt="404"
            style={{ display: 'block', margin: '0 auto 12px', maxWidth: '120px', opacity: 0.5 }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          {t(locale, 'Товар не знайдено', 'Product not found')}
        </div>
      ) : (
        <div className="product-page">
          <div className="product-page-media">
            {product.image ? (
              <img
                className="product-page-img"
                src={product.image}
                alt={product.title}
                loading="lazy"
              />
            ) : (
              <div className="product-page-img-placeholder">
                <img
                  src="/original-assets/assets/icons/out-of-stock-primary.svg"
                  alt=""
                  style={{ width: 80, height: 80, opacity: 0.25 }}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
            )}
          </div>

          <div className="product-page-info">
            <h1 className="serif product-page-title">{product.title}</h1>

            {product.priceText && (
              <div className="product-page-price">{product.priceText}</div>
            )}

            {product.description && (
              <p className="product-page-desc">{product.description}</p>
            )}

            <div className="product-page-actions">
              <button
                className={`btn-primary btn-add-cart${added ? ' btn-added' : ''}`}
                type="button"
                onClick={handleAddToCart}
              >
                {added
                  ? t(locale, '✓ Додано до кошика', '✓ Added to cart')
                  : t(locale, 'Додати до кошика', 'Add to cart')}
              </button>

              <a
                href={`/${locale}/catalog`}
                className="btn-back"
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(`/${locale}/catalog`)
                }}
              >
                {t(locale, '← Назад до каталогу', '← Back to catalog')}
              </a>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

// ─── Search (full page) ─────────────────────────────────────────────────────
export function SearchPage(props) {
  const { locale, query = '', products, onNavigate } = props
  const [localQuery, setLocalQuery] = React.useState(query)

  const q = localQuery.trim().toLowerCase()
  const filtered = !q
    ? []
    : products.filter((p) =>
        `${p.title} ${p.description || ''}`.toLowerCase().includes(q)
      )

  const handleSearch = (e) => {
    e.preventDefault()
    if (localQuery.trim()) {
      onNavigate?.(
        `/${locale}/search?q=${encodeURIComponent(localQuery.trim())}`
      )
    }
  }

  return (
    <PageShell {...props}>
      <app-catalog>
        <div className="search-page">
          <form className="search-page-form" onSubmit={handleSearch}>
            <img
              src="/original-assets/assets/icons/search-primary.svg"
              alt=""
              className="search-icon"
              aria-hidden="true"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <input
              type="text"
              className="search-input search-page-input"
              placeholder={t(locale, 'Пошук товарів…', 'Search products…')}
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              autoFocus
            />
            {localQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setLocalQuery('')}
              >
                ×
              </button>
            )}
          </form>

          {q && (
            <p className="search-page-count">
              {filtered.length > 0
                ? t(locale, `Знайдено ${filtered.length} товар(ів)`, `Found ${filtered.length} product(s)`)
                : t(locale, 'Нічого не знайдено', 'Nothing found')}
            </p>
          )}

          <ProductGrid
            locale={locale}
            products={filtered}
            onNavigate={onNavigate}
            emptyText={
              q
                ? t(locale, 'Нічого не знайдено', 'Nothing found')
                : t(locale, 'Введіть запит для пошуку', 'Enter a search query')
            }
          />
        </div>
      </app-catalog>
    </PageShell>
  )
}

// ─── Cart (full page) ───────────────────────────────────────────────────────
export function CartPage(props) {
  const { locale, cartItems = [], removeFromCart, updateCartQty, onNavigate } = props

  const total = cartItems.reduce((sum, item) => {
    const price =
      parseFloat(String(item.priceText || '').replace(/[^\d.]/g, '')) || 0
    return sum + price * item.quantity
  }, 0)

  return (
    <PageShell {...props}>
      <div className="cart-page">
        <div className="cart-page-header">
          <h1 className="serif">{t(props.locale, 'Кошик', 'Cart')}</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-page-empty">
            <img
              src="/original-assets/assets/icons/empty-cart-primary.svg"
              alt=""
              className="cart-empty-icon"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <p>{t(locale, 'Ваш кошик порожній', 'Your cart is empty')}</p>
            <button
              className="btn-primary"
              type="button"
              onClick={() => onNavigate?.(`/${locale}/catalog`)}
            >
              {t(locale, 'До каталогу', 'To catalog')}
            </button>
          </div>
        ) : (
          <div className="cart-page-layout">
            <div className="cart-page-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-page-item">
                  <div className="cart-page-item-img">
                    {item.image ? (
                      <img src={item.image} alt={item.title} />
                    ) : (
                      <div className="cart-page-item-placeholder" />
                    )}
                  </div>

                  <div className="cart-page-item-info">
                    <a
                      className="cart-page-item-title"
                      href={`/${locale}/product/${encodeURIComponent(item.handle || item.id)}`}
                      onClick={(e) => {
                        e.preventDefault()
                        onNavigate?.(`/${locale}/product/${encodeURIComponent(item.handle || item.id)}`)
                      }}
                    >
                      {item.title}
                    </a>
                    {item.priceText && (
                      <div className="cart-page-item-price">{item.priceText}</div>
                    )}
                  </div>

                  <div className="cart-page-item-qty">
                    <button
                      type="button"
                      onClick={() => updateCartQty?.(item.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQty?.(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="cart-page-item-remove"
                    type="button"
                    onClick={() => removeFromCart?.(item.id)}
                    aria-label={t(locale, 'Видалити', 'Remove')}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-page-sidebar">
              <div className="cart-page-summary">
                <h2 className="serif">{t(locale, 'Підсумок', 'Summary')}</h2>

                <div className="cart-page-total">
                  <span>{t(locale, 'Разом:', 'Total:')}</span>
                  <span>
                    {total > 0
                      ? `₴ ${Math.round(total)}`
                      : '—'}
                  </span>
                </div>

                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => onNavigate?.(`/${locale}/checkout`)}
                >
                  {t(locale, 'Оформити замовлення', 'Checkout')}
                </button>

                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => onNavigate?.(`/${locale}/catalog`)}
                >
                  {t(locale, '← Продовжити покупки', '← Continue shopping')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}

// ─── Checkout ───────────────────────────────────────────────────────────────
export function CheckoutPage(props) {
  const { locale, cartItems = [], clearCart, onNavigate } = props

  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    comment: '',
  })
  const [submitted, setSubmitted] = React.useState(false)

  const total = cartItems.reduce((sum, item) => {
    const price =
      parseFloat(String(item.priceText || '').replace(/[^\d.]/g, '')) || 0
    return sum + price * item.quantity
  }, 0)

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    clearCart?.()
  }

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

  return (
    <PageShell {...props}>
      <div className="checkout-page">
        <h1 className="serif checkout-title">
          {t(locale, 'Оформлення замовлення', 'Checkout')}
        </h1>

        {submitted ? (
          <div className="checkout-success">
            <div className="checkout-success-icon">✓</div>
            <h2 className="serif">
              {t(locale, 'Дякуємо за замовлення!', 'Thank you for your order!')}
            </h2>
            <p>
              {t(
                locale,
                'Ми зв’яжемося з вами найближчим часом для підтвердження.',
                'We will contact you shortly to confirm your order.'
              )}
            </p>
            <button
              className="btn-primary"
              type="button"
              style={{ marginTop: 20 }}
              onClick={() => onNavigate?.(`/${locale}`)}
            >
              {t(locale, 'На головну', 'Home')}
            </button>
          </div>
        ) : (
          <form className="checkout-layout" onSubmit={handleSubmit}>
            {/* Left: delivery */}
            <div className="checkout-section">
              <h2 className="serif checkout-section-title">
                {t(locale, 'Доставка', 'Delivery')}
              </h2>

              {/* Mapbox area */}
              <div className="mapbox-area" id="mapbox-container">
                {mapboxToken ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: '#8e1500', fontSize: 14, textAlign: 'center' }}>
                      {t(locale, 'Карта зони доставки (Mapbox GL JS)', 'Delivery zone map (Mapbox GL JS)')}
                      <br />
                      <small style={{ color: '#b89797' }}>
                        {t(locale, '(Mapbox інтеграція готова, токен присутній)', '(Mapbox integration ready, token present)')}
                      </small>
                    </p>
                  </div>
                ) : (
                  <>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b89797" strokeWidth="1.2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4l3 3" strokeLinecap="round" />
                    </svg>
                    <p style={{ margin: 0 }}>
                      {t(locale, 'Зона доставки Namelaka', 'Namelaka delivery zone')}
                    </p>
                    <small>
                      {t(
                        locale,
                        'Mapbox GL JS / встановіть VITE_MAPBOX_TOKEN для активації карти',
                        'Set VITE_MAPBOX_TOKEN env var to enable the map'
                      )}
                    </small>
                  </>
                )}
              </div>

              <div className="checkout-form">
                <input
                  className="checkout-input"
                  type="text"
                  placeholder={t(locale, "Ім'я та прізвище", 'Full name')}
                  value={formData.name}
                  onChange={handleChange('name')}
                  required
                />
                <input
                  className="checkout-input"
                  type="tel"
                  placeholder={t(locale, 'Номер телефону', 'Phone number')}
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  required
                />
                <input
                  className="checkout-input"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange('email')}
                />
                <input
                  className="checkout-input"
                  type="text"
                  placeholder={t(locale, 'Адреса доставки', 'Delivery address')}
                  value={formData.address}
                  onChange={handleChange('address')}
                  required
                />
                <textarea
                  className="checkout-input checkout-textarea"
                  placeholder={t(locale, 'Коментар до замовлення (необов’язково)', 'Order comment (optional)')}
                  value={formData.comment}
                  onChange={handleChange('comment')}
                  rows={3}
                />
              </div>
            </div>

            {/* Right: order summary + Stripe */}
            <div className="checkout-section checkout-sidebar">
              <h2 className="serif checkout-section-title">
                {t(locale, 'Ваше замовлення', 'Your order')}
              </h2>

              {cartItems.length === 0 ? (
                <p style={{ color: '#b89797', fontSize: 14 }}>
                  {t(locale, 'Кошик порожній', 'Cart is empty')}
                </p>
              ) : (
                <div className="checkout-items">
                  {cartItems.map((item) => (
                    <div key={item.id} className="checkout-order-item">
                      <span>
                        {item.title}
                        {item.quantity > 1 && (
                          <small style={{ color: '#b89797' }}>
                            {' '}×{item.quantity}
                          </small>
                        )}
                      </span>
                      <span>
                        {item.priceText
                          ? `₴ ${Math.round(
                              (parseFloat(
                                String(item.priceText).replace(/[^\d.]/g, '')
                              ) || 0) * item.quantity
                            )}`
                          : '—'}
                      </span>
                    </div>
                  ))}
                  <div className="checkout-total">
                    <span>{t(locale, 'Разом:', 'Total:')}</span>
                    <span>
                      {total > 0 ? `₴ ${Math.round(total)}` : '—'}
                    </span>
                  </div>
                </div>
              )}

              {/* Stripe placeholder */}
              <div className="stripe-area">
                <div className="stripe-area-title">
                  {t(locale, 'Оплата', 'Payment')}
                </div>
                <p>
                  {t(
                    locale,
                    'Stripe Checkout (тестовий режим) — платіжна форма буде інтегрована на фінальному етапі',
                    'Stripe Checkout (test mode) — payment form will be integrated in the final stage'
                  )}
                </p>
                <div className="stripe-card-mock">
                  <div className="stripe-card-mock-row">
                    <div className="stripe-card-mock-field stripe-card-mock-number">
                      •••• •••• •••• ••••
                    </div>
                  </div>
                  <div className="stripe-card-mock-row">
                    <div className="stripe-card-mock-field">MM / YY</div>
                    <div className="stripe-card-mock-field">CVC</div>
                  </div>
                </div>
              </div>

              <button
                className="btn-primary"
                type="submit"
                style={{ marginTop: 20 }}
              >
                {t(locale, 'Підтвердити замовлення', 'Place order')}
              </button>
            </div>
          </form>
        )}
      </div>
    </PageShell>
  )
}

// ─── Not Found ──────────────────────────────────────────────────────────────
export function NotFoundPage(props) {
  const { locale } = props
  return (
    <PageShell {...props}>
      <div className="stage1-empty" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <img
          src="/original-assets/assets/icons/errors/error-404.svg"
          alt="404"
          style={{ display: 'block', margin: '0 auto 16px', maxWidth: '200px', opacity: 0.6 }}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <div style={{ fontSize: 18, marginBottom: 16 }}>
          {t(locale, 'Сторінку не знайдено', 'Page not found')}
        </div>
        <a
          href={`/${locale}`}
          className="btn-primary"
          style={{ display: 'inline-block', textDecoration: 'none' }}
          onClick={(e) => {
            e.preventDefault()
            props.onNavigate?.(`/${locale}`)
          }}
        >
          {t(locale, 'На головну', 'Home')}
        </a>
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
