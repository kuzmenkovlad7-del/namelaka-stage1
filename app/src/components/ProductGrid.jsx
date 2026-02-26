import React from 'react'
import ProductCard from './ProductCard.jsx'

/**
 * ProductGrid wraps the original .products-grid-container > .products-grid
 * structure. The grid is 4-col on desktop, 3-col at 1400px, 2-col on mobile.
 */
export default function ProductGrid({ products = [], locale = 'uk', emptyText = 'Товарів поки немає', onNavigate }) {
  if (!products.length) {
    return (
      <div className="products-grid-container">
        <div className="stage1-empty">{emptyText}</div>
      </div>
    )
  }

  return (
    <div className="products-grid-container">
      <div className="products-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} locale={locale} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  )
}
