import React from 'react'

/**
 * Category icons from the original live site (Salesforce/CMS content URLs).
 * Keyed by Medusa category handle to allow lookup after API normalisation.
 */
const CATEGORY_ICONS = {
  'love-is':             'https://namelaka.ua/public/content/a0ESp0000028EvtMAE/a.svg',
  'sweets':              'https://namelaka.ua/public/content/a0EJ6000000UIk1MAG/a.svg',
  'mini-cakes':          'https://namelaka.ua/public/content/a0EJ6000000UIjxMAG/a.svg',
  'cakes':               'https://namelaka.ua/public/content/a0EJ6000000UIjyMAG/a.svg',
  'puffs':               'https://namelaka.ua/public/content/a0EJ6000000UIk6MAG/a.svg',
  'chocolate':           'https://namelaka.ua/public/content/a0EJ6000000UIjrMAG/a.svg',
  'candies':             'https://namelaka.ua/public/content/a0EJ6000000UIkBMAW/a.svg',
  'gift-certificates':   'https://namelaka.ua/public/content/a0ESp0000023UbVMAU/a.svg',
}

/**
 * Ukrainian display names for categories (API returns English from Medusa).
 * Falls back to the API name when a handle is not listed here.
 */
export const UK_NAMES = {
  'love-is':           'Love is',
  'sweets':            'Солодощі',
  'mini-cakes':        'Міні-торти',
  'cakes':             'Торти',
  'puffs':             'Пуфи',
  'chocolate':         'Шоколад',
  'candies':           'Цукерки',
  'gift-certificates': 'Подарункові сертифікати',
}

export default function CategoryTabs({
  locale = 'ua',
  categories = [],
  activeCategoryHandle = null,
  onNavigate,
}) {
  const navigate = (href) => (e) => {
    e.preventDefault()
    if (onNavigate) onNavigate(href)
  }

  return (
    <app-categories className="content-below-sidebar">
      <div className="categories hide-scroll-bar">
        {categories.map((cat) => {
          const iconUrl = CATEGORY_ICONS[cat.handle] || null
          // locale is 'ua' for Ukrainian, 'en' for English.
          // UK_NAMES maps handles → Ukrainian display names.
          const displayName = locale !== 'en' ? (UK_NAMES[cat.handle] || cat.name) : cat.name
          const isSelected = activeCategoryHandle === cat.handle
          const href = `/${locale}/category/${encodeURIComponent(cat.handle)}`

          return (
            <a
              key={cat.id}
              href={href}
              className={`category cursor-pointer${isSelected ? ' selected' : ''}`}
              onClick={navigate(href)}
              style={{ textDecoration: 'none' }}
            >
              {iconUrl && (
                <div className="icon">
                  <div className="image" style={{ '--icon-url': `url(${iconUrl})` }} />
                </div>
              )}
              <span className="text-caption small italic">{displayName}</span>
              <span className="text-body large italic">{displayName}</span>
            </a>
          )
        })}
      </div>
    </app-categories>
  )
}
