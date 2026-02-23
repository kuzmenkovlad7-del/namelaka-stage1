import React from 'react'

export default function SearchPanel({
  open,
  onClose,
  locale = 'uk',
  products = [],
  onNavigate,
}) {
  const [query, setQuery] = React.useState('')
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    if (open) {
      setQuery('')
      // Focus input after animation
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      document.body.style.overflow = 'hidden'
      return () => clearTimeout(t)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const q = query.trim().toLowerCase()
  const results = !q
    ? []
    : products
        .filter((p) =>
          `${p.title} ${p.description || ''}`.toLowerCase().includes(q)
        )
        .slice(0, 8)

  const go = (href) => (e) => {
    e.preventDefault()
    onNavigate?.(href)
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (q) {
      onNavigate?.(
        `/${locale}/search?q=${encodeURIComponent(query.trim())}`
      )
      onClose()
    }
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="search-panel" role="search">
        <div className="search-panel-header">
          <form className="search-form" onSubmit={handleSubmit}>
            <img
              src="/original-assets/assets/icons/search-primary.svg"
              alt=""
              className="search-icon"
              aria-hidden="true"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Пошук товарів…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Пошук товарів"
            />
            {query && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setQuery('')}
                aria-label="Очистити"
              >
                ×
              </button>
            )}
          </form>
          <button
            className="drawer-close"
            onClick={onClose}
            aria-label="Закрити пошук"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="search-results">
          {!q && (
            <p className="search-hint">Введіть назву товару для пошуку</p>
          )}
          {q && results.length === 0 && (
            <p className="search-empty">Нічого не знайдено за «{query}»</p>
          )}
          {results.map((p) => {
            const href = `/${locale}/product/${encodeURIComponent(p.handle || p.id)}`
            return (
              <a
                key={p.id}
                href={href}
                className="search-result-item"
                onClick={go(href)}
              >
                <div className="search-result-img">
                  {p.image ? (
                    <img src={p.image} alt={p.title} />
                  ) : (
                    <div className="search-result-img-placeholder" />
                  )}
                </div>
                <div className="search-result-info">
                  <div className="search-result-title">{p.title}</div>
                  {p.priceText && (
                    <div className="search-result-price">{p.priceText}</div>
                  )}
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </>
  )
}
