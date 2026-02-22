import React from 'react'
import Header from './components/Header.jsx'
import CategoryTabs from './components/CategoryTabs.jsx'
import ProductGrid from './components/ProductGrid.jsx'

function t(locale, uk, en) {
  return locale === 'en' ? en : uk
}

function slugOrIdMatch(routeValue, category) {
  if (!routeValue || !category) return false
  return routeValue === category.id || routeValue === category.handle
}

/**
 * PageShell – wraps every page with the original site chrome:
 *   app-root
 *     app-header
 *     app-categories (category strip)
 *     .main.content-below-sidebar.categories-margin.pattern
 *       {children}
 *
 * Uses React components with original class names so both
 * styles-ZBSN6PDF.css and original-components.css apply correctly.
 * No dangerouslySetInnerHTML / snapshot injection needed.
 */
export function PageShell({
  locale = 'uk',
  categories = [],
  activeCategoryHandle = null,
  onNavigate,
  children,
}) {
  return (
    <app-root>
      {/* Fixed background pattern (original: .pattern-background element) */}
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

      <Header locale={locale} onNavigate={onNavigate} />

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

export function HomePage({ locale = 'uk', products = [], categories = [], onNavigate }) {
  return (
    <PageShell locale={locale} categories={categories} onNavigate={onNavigate}>
      <app-catalog>
        <ProductGrid
          locale={locale}
          products={products}
          emptyText={t(locale, 'Товарів поки немає', 'No products yet')}
        />
      </app-catalog>
    </PageShell>
  )
}

export function CatalogPage({ locale = 'uk', products = [], categories = [], onNavigate }) {
  return (
    <PageShell locale={locale} categories={categories} onNavigate={onNavigate}>
      <app-catalog>
        <ProductGrid
          locale={locale}
          products={products}
          emptyText={t(locale, 'Товарів поки немає', 'No products yet')}
        />
      </app-catalog>
    </PageShell>
  )
}

export function CategoryPage({
  locale = 'uk',
  categoryId,
  categories = [],
  products = [],
  onNavigate,
}) {
  const category = categories.find((c) => slugOrIdMatch(categoryId, c))

  // Filter products to this category only.
  // Falls back to showing all products if the category is unknown (shouldn't happen in prod).
  const filtered = category
    ? products.filter((p) => p.categoryId === category.id || p.product_category_id === category.id)
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
            emptyText={t(locale, 'У цій категорії поки немає товарів', 'No products in this category yet')}
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

export function ProductPage({
  locale = 'uk',
  productId,
  products = [],
  categories = [],
  onNavigate,
}) {
  const product = products.find((p) => p.id === productId || p.handle === productId)

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
            {product.description && <p>{product.description}</p>}

            <div className="stage1-actions">
              <a
                href={`/${locale}/catalog`}
                className="stage1-btn"
                onClick={(e) => { e.preventDefault(); onNavigate(`/${locale}/catalog`) }}
              >
                {t(locale, 'Назад до каталогу', 'Back to catalog')}
              </a>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

export function SearchPage({ locale = 'uk', query = '', products = [], categories = [], onNavigate }) {
  const q = String(query || '').trim().toLowerCase()
  const filtered = !q
    ? []
    : products.filter((p) =>
        `${p.title} ${p.description}`.toLowerCase().includes(q)
      )

  return (
    <PageShell locale={locale} categories={categories} onNavigate={onNavigate}>
      <app-catalog>
        <ProductGrid
          locale={locale}
          products={filtered}
          emptyText={t(locale, 'Нічого не знайдено', 'Nothing found')}
        />
      </app-catalog>
    </PageShell>
  )
}

export function NotFoundPage({ locale = 'uk', categories = [], onNavigate }) {
  return (
    <PageShell locale={locale} categories={categories} onNavigate={onNavigate}>
      <div className="stage1-empty">
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
  NotFoundPage,
}
