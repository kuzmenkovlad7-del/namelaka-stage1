import React from 'react'
import { Link } from 'react-router-dom'
import { withLocale } from '../utils'

export default function Header({ locale, search, setSearch }) {
  return (
    <header className="nm-header">
      <div className="nm-header-row">
        <button className="icon-btn" aria-label="Menu">☰</button>
        <div className="nm-search-wrap">
          <span className="nm-search-icon">⌕</span>
          <input
            className="nm-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === 'en' ? 'Search sweets' : 'Пошук смаколиків'}
          />
        </div>
        <Link to={withLocale(locale, '/')} className="nm-logo" aria-label="Namelaka">
          <img src="/original-assets/logo.svg" alt="Namelaka" onError={(e)=>{e.currentTarget.style.display='none'}} />
          <span>NAMELAKA</span>
        </Link>
        <button className="nm-cart-btn">{locale === 'en' ? 'Cart' : 'Кошик'} <span className="nm-badge">0</span></button>
      </div>
    </header>
  )
}
