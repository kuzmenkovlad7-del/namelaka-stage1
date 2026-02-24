import React from 'react'

/**
 * Header component matching the original Angular app-header structure.
 * Layout: 3-column grid  (icons | logo | cart)
 * Class names match the original exactly so original-components.css applies.
 */
export default function Header({ locale = 'uk', onNavigate, cartCount = 0 }) {
  const nav = (href) => (e) => {
    e.preventDefault()
    if (onNavigate) onNavigate(href)
  }

  return (
    <app-header>
      {/* Left column: burger + search */}
      <div className="icons-container">
        <svg
          className="cursor-pointer"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Меню"
          onClick={nav(`/${locale}`)}
        >
          <path d="M4 6H20" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
          <path d="M4 12H20" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
          <path d="M4 18H20" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
        </svg>
        <img
          src="/original-assets/assets/icons/search-primary.svg"
          alt="search"
          className="cursor-pointer"
          onClick={nav(`/${locale}/search`)}
          onError={(e) => {
            e.currentTarget.style.visibility = 'hidden'
          }}
        />
      </div>

      {/* Center column: logo */}
      <div className="logo-container">
        <a href={`/${locale}`} onClick={nav(`/${locale}`)}>
          <img
            src="/original-assets/assets/icons/logo-header-primary.svg"
            alt="Namelaka"
            className="cursor-pointer"
            onError={(e) => {
              e.currentTarget.style.visibility = 'hidden'
            }}
          />
        </a>
      </div>

      {/* Right column: cart */}
      <div className="cart-container">
        <a
          href={`/${locale}/cart`}
          className="cart"
          onClick={nav(`/${locale}/cart`)}
          style={{ textDecoration: 'none' }}
        >
          <span className="button-text primary desktop-block mobile-hidden">Кошик</span>
          <img
            src="/original-assets/assets/icons/cart-secondary.svg"
            alt="cart"
            onError={(e) => {
              e.currentTarget.style.visibility = 'hidden'
            }}
          />
          <span className="text-caption small mobile-block desktop-hidden">Кошик</span>
          {cartCount > 0 && (
            <span className="cart__badge">{cartCount}</span>
          )}
        </a>
      </div>
    </app-header>
  )
}
