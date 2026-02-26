import React from 'react'

/**
 * ProductCard matches the original Angular app-product-card DOM structure.
 *
 * Original structure:
 *   <app-product-card style="cursor:pointer">
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
 *     <div class="info" tabindex="0">
 *       <h1 class="serif">Product Name</h1>        ← desktop
 *       <h3 class="serif">Product Name</h3>        ← mobile (display:none on desktop)
 *       <span class="text-caption default price">₴ 360</span>   ← mobile
 *       <span class="text-body large default price">₴ 360</span> ← desktop
 *     </div>
 *   </app-product-card>
 */
export default function ProductCard({ product, locale = 'uk', onNavigate }) {
  const handle = String(product.handle || product.id || '').replace(/^\/+/, '')
  const href = `/${locale}/product/${encodeURIComponent(handle)}`

  function handleClick(e) {
    // Middle-click or ctrl/cmd-click: let the browser open in a new tab
    if (e.ctrlKey || e.metaKey || e.button === 1) return
    e.preventDefault()
    if (onNavigate) {
      onNavigate(href)
    } else {
      window.history.pushState({}, '', href)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  return (
    <app-product-card style={{ cursor: 'pointer' }}>
      {/* Wrap everything in an anchor so the entire card (image + info) is clickable */}
      <a href={href} onClick={handleClick} style={{ textDecoration: 'none', display: 'contents' }}>
        {/* Image container: aspect-ratio 0.836, rounded, overflow hidden */}
        <div className="image">
          {product.image ? (
            <img alt="photo" src={product.image} loading="lazy" />
          ) : (
            <div className="stage1-image-fallback" />
          )}

          {/* Heart / like counter — positioned absolute bottom-right by CSS */}
          <app-product-like>
            <div className="heart small">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                alt="person"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <span className="text-caption small">{product.hearts || 0}</span>
            </div>
          </app-product-like>
        </div>

        {/* Info: title + price */}
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
