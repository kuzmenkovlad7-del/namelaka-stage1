import React from 'react'

function heartCounter(value) {
  return Number.isFinite(value) ? value : 0
}

export default function ProductCard({ product, locale = 'uk' }) {
  const href = `/${locale}/product/${encodeURIComponent(product.id)}`

  return (
    <app-product-card>
      <div className="item">
        <a href={href} className="cursor-pointer text-decoration-none">
          <div className="image-container">
            <div className="image">
              {product.image ? (
                <img src={product.image} alt={product.title} loading="lazy" />
              ) : (
                <div className="stage1-image-fallback">No image</div>
              )}
            </div>

            <div className="counter-container">
              <div className="counter">
                <span>♡</span>
                <span>{heartCounter(product.hearts)}</span>
              </div>
            </div>
          </div>

          <div className="info">
            <h1 className="serif">{product.title}</h1>

            <div className="price-container">
              <div className="price">
                {product.priceText || '—'}
              </div>
            </div>
          </div>
        </a>
      </div>
    </app-product-card>
  )
}
