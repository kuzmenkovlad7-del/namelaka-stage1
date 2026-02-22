import React from 'react'
import ProductGrid from './components/ProductGrid.jsx'

function t(locale, uk, en) {
  return locale === 'en' ? en : uk
}

function slugOrIdMatch(routeValue, category) {
  if (!routeValue || !category) return false
  return routeValue === category.id || routeValue === category.handle
}

function renderOriginalFragment(html) {
  if (!html) return null
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

export function PageShell({
  locale = 'uk',
  snapshot,
  children,
}) {
  return (
    <>
      {renderOriginalFragment(snapshot?.headerHtml)}
      {renderOriginalFragment(snapshot?.categoriesHtml)}
      <div className="stage1-page-content">
        {children}
      </div>
    </>
  )
}

export function HomePage({ locale = 'uk', products = [], snapshot }) {
  return (
    <PageShell locale={locale} snapshot={snapshot}>
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

export function CatalogPage({ locale = 'uk', products = [], snapshot }) {
  return (
    <PageShell locale={locale} snapshot={snapshot}>
      <div className="stage1-title-wrap">
        <h1>{t(locale, 'Каталог', 'Catalog')}</h1>
      </div>
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
  snapshot,
}) {
  const category = categories.find((c) => slugOrIdMatch(categoryId, c))
  const filtered = category
    ? products.filter((p) => !p.categoryId || p.categoryId === category.id)
    : []

  return (
    <PageShell locale={locale} snapshot={snapshot}>
      <div className="stage1-title-wrap">
        <h1>{category ? category.name : t(locale, 'Категорія не знайдена', 'Category not found')}</h1>
      </div>

      {category ? (
        <app-catalog>
          <ProductGrid
            locale={locale}
            products={filtered}
            emptyText={t(
              locale,
              'У цій категорії поки немає товарів',
              'No products in this category yet'
            )}
          />
        </app-catalog>
      ) : (
        <div className="stage1-empty">
          {t(locale, 'Перевірте адресу категорії', 'Check the category URL')}
        </div>
      )}
    </PageShell>
  )
}

export function ProductPage({
  locale = 'uk',
  productId,
  products = [],
  snapshot,
}) {
  const product = products.find((p) => p.id === productId || p.handle === productId)

  if (!product) {
    return (
      <PageShell locale={locale} snapshot={snapshot}>
        <div className="stage1-empty">
          {t(locale, 'Товар не знайдено', 'Product not found')}
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell locale={locale} snapshot={snapshot}>
      <div className="stage1-product-page">
        <div className="stage1-product-media">
          {product.image ? (
            <img src={product.image} alt={product.title} />
          ) : (
            <div className="stage1-image-fallback stage1-image-fallback-large">No image</div>
          )}
        </div>

        <div className="stage1-product-info">
          <h1>{product.title}</h1>
          <div className="stage1-product-price">{product.priceText || '—'}</div>
          {product.description ? <p>{product.description}</p> : null}

          <div className="stage1-actions">
            <a href={`/${locale}/catalog`} className="stage1-btn">
              {t(locale, 'Назад до каталогу', 'Back to catalog')}
            </a>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

export function SearchPage({ locale = 'uk', query = '', products = [], snapshot }) {
  const q = String(query || '').trim().toLowerCase()
  const filtered = !q
    ? []
    : products.filter((p) =>
        `${p.title} ${p.description}`.toLowerCase().includes(q)
      )

  return (
    <PageShell locale={locale} snapshot={snapshot}>
      <div className="stage1-title-wrap">
        <h1>
          {t(locale, 'Пошук', 'Search')}
          {q ? `: ${q}` : ''}
        </h1>
      </div>

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

export function NotFoundPage({ locale = 'uk', snapshot }) {
  return (
    <PageShell locale={locale} snapshot={snapshot}>
      <div className="stage1-empty">
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
