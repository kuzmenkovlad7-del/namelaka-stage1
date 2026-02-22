import React from 'react'
import ProductCard from './ProductCard.jsx'

export default function ProductGrid({ products = [], locale = 'uk', emptyText = 'Товарів поки немає' }) {
  if (!products.length) {
    return (
      <div className="products-grid-container">
        <div className="stage1-empty">{emptyText}</div>
      </div>
    )
  }

  return (
    <div className="products-grid-container">
      <div className="product-list">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} locale={locale} />
        ))}
      </div>
    </div>
  )
}
