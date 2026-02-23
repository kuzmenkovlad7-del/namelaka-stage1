import React from 'react'

/**
 * ProductCard matches the original Angular app-product-card DOM structure.
 *
 * The entire card navigates to the product page on click.
 * The heart/like area stops propagation so it doesn't trigger navigation.
 *
 * Original structure:
 *   <app-product-card>
 *     <div class="image">
 *       <img alt="photo" src="...">
 *       <app-product-like>
 *         <div class="heart small">…SVG…</div>
 *         <div class="counter small">
 *           <img src="person-disabled.svg">
 *           <span class="text-caption small">65</span>
 *         </div>
 *       </app-product-like>
 *     </div>
 *     <a> → <div class="info">
 *       <h1 class="serif">…</h1>   (desktop)
 *       <h3 class="serif">…</h3>   (mobile)
 *       <span class="text-caption default price">₴ 360</span>  (mobile)
 *       <span class="text-body large default price">₴ 360</span> (desktop)
 *     </div>
 *   </app-product-card>
 */
export default function ProductCard({ product, locale = 'uk', onNavigate }) {
  const href = `/${locale}/product/${encodeURIComponent(product.handle || product.id)}`

  const handleCardClick = (e) => {
    // Only navigate on direct card clicks, not on the like widget
    if (e.defaultPrevented) return
    e.preventDefault()
    onNavigate?.(href)
  }

  return (
    <app-product-card
      style={{ cursor: 'pointer' }}
      onClick={handleCardClick}
    >
      {/* Image container */}
      <div className="image">
        {product.image ? (
          <img
            alt={product.title}
            src={product.image}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextSibling?.style && (e.currentTarget.nextSibling.style.display = 'flex')
            }}
          />
        ) : null}
        {/* Fallback shown when image absent or broken */}
        <div
          className="product-img-placeholder"
          style={{ display: product.image ? 'none' : 'flex' }}
        />

        {/* Heart / like widget — stopPropagation prevents card navigation */}
        <app-product-like onClick={(e) => e.stopPropagation()}>
          <div className="heart small">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.8892 2.77775C13.1645 1.99174 12.1701 1.55884 11.089 1.55884C10.2808 1.55884 9.54076 1.81433 8.8892 2.31816C8.56045 2.57246 8.26254 2.88362 7.99991 3.24675C7.73736 2.88371 7.43937 2.57246 7.11051 2.31816C6.45905 1.81433 5.71898 1.55884 4.91084 1.55884C3.82971 1.55884 2.83521 1.99174 2.1105 2.77775C1.39446 3.55458 1 4.61586 1 5.76619C1 6.95016 1.44124 8.034 2.38852 9.17706C3.23595 10.1996 4.45391 11.2375 5.86433 12.4395C6.34596 12.85 6.89187 13.3152 7.4587 13.8108C7.60847 13.942 7.80081 14.0143 7.99991 14.0142C8.1991 14.0142 8.39135 13.942 8.5409 13.811C9.10772 13.3153 9.65396 12.8499 10.1358 12.4392C11.546 11.2374 12.7639 10.1996 13.6114 9.17695C14.5587 8.03403 14.9998 6.95019 14.9998 5.76608C14.9998 4.61586 14.6054 3.55458 13.8892 2.77775Z"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="currentColor"
                fill="none"
              />
            </svg>
          </div>
          <div className="counter small">
            <img
              src="/original-assets/assets/icons/person-disabled.svg"
              alt=""
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <span className="text-caption small">{product.hearts || 0}</span>
          </div>
        </app-product-like>
      </div>

      {/* Info: title + price */}
      <a href={href} style={{ textDecoration: 'none' }} onClick={(e) => e.preventDefault()}>
        <div className="info" tabIndex={0}>
          <h1 className="serif">{product.title}</h1>
          <h3 className="serif">{product.title}</h3>
          {product.priceText && (
            <>
              <span className="text-caption default price">{product.priceText}</span>
              <span className="text-body large default price">{product.priceText}</span>
            </>
          )}
        </div>
      </a>
    </app-product-card>
  )
}
