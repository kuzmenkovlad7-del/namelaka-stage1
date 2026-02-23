import React from 'react'

const UK_NAMES = {
  'love-is':           'Love is',
  'sweets':            'Солодощі',
  'mini-cakes':        'Міні-торти',
  'cakes':             'Торти',
  'puffs':             'Пуфи',
  'chocolate':         'Шоколад',
  'candies':           'Цукерки',
  'gift-certificates': 'Подарункові сертифікати',
}

export default function MenuDrawer({
  open,
  onClose,
  locale = 'uk',
  categories = [],
  onNavigate,
}) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const go = (href) => (e) => {
    e.preventDefault()
    onNavigate?.(href)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Left panel */}
      <div className="drawer drawer-left" role="dialog" aria-label="Навігаційне меню">
        <div className="drawer-header">
          <a href={`/${locale}`} onClick={go(`/${locale}`)}>
            <img
              src="/original-assets/assets/icons/logo-header-primary.svg"
              alt="Namelaka"
              className="drawer-logo"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </a>
          <button className="drawer-close" onClick={onClose} aria-label="Закрити" type="button">
            ×
          </button>
        </div>

        <nav className="drawer-nav">
          <a
            href={`/${locale}`}
            className="drawer-link"
            onClick={go(`/${locale}`)}
          >
            Головна
          </a>
          <a
            href={`/${locale}/catalog`}
            className="drawer-link"
            onClick={go(`/${locale}/catalog`)}
          >
            Каталог
          </a>

          {categories.length > 0 && (
            <>
              <div className="drawer-section-title">Категорії</div>
              {categories.map((cat) => {
                const name = locale === 'uk'
                  ? (UK_NAMES[cat.handle] || cat.name)
                  : cat.name
                const href = `/${locale}/category/${encodeURIComponent(cat.handle)}`
                return (
                  <a
                    key={cat.id}
                    href={href}
                    className="drawer-link drawer-link-sub"
                    onClick={go(href)}
                  >
                    {name}
                  </a>
                )
              })}
            </>
          )}

          <a
            href={`/${locale}/cart`}
            className="drawer-link"
            onClick={go(`/${locale}/cart`)}
          >
            Кошик
          </a>
          <a
            href={`/${locale}/checkout`}
            className="drawer-link"
            onClick={go(`/${locale}/checkout`)}
          >
            Оформлення замовлення
          </a>
        </nav>
      </div>
    </>
  )
}
