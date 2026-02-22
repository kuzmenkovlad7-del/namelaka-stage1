import React from 'react'

function CategoryIcon({ cat, active }) {
  const img = active ? (cat.icons?.[1] || cat.icons?.[0]) : (cat.icons?.[0] || '')
  if (img) return <img src={img} alt="" className="cat-icon-img" loading="lazy" />
  return <span className="cat-icon-fallback" aria-hidden>{active ? '■' : '□'}</span>
}

export default function CategoryTabs({ categories, activeCategoryId, onSelect }) {
  return (
    <div className="nm-tabs-wrap">
      <div className="nm-tabs">
        {categories.map((cat) => {
          const active = cat.id === activeCategoryId
          return (
            <button key={cat.id} className={`nm-tab ${active ? 'active' : ''}`} onClick={() => onSelect(cat)}>
              <CategoryIcon cat={cat} active={active} />
              <span>{cat.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
