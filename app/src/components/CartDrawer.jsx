import React from 'react'

export default function CartDrawer({
  open,
  onClose,
  locale = 'uk',
  cartItems = [],
  removeFromCart,
  updateCartQty,
  onNavigate,
}) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const total = cartItems.reduce((sum, item) => {
    const price =
      parseFloat(String(item.priceText || '').replace(/[^\d.]/g, '')) || 0
    return sum + price * item.quantity
  }, 0)

  const go = (href) => () => {
    onNavigate?.(href)
    onClose()
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="drawer drawer-right" role="dialog" aria-label="Кошик">
        <div className="drawer-header">
          <h2 className="serif" style={{ margin: 0, fontSize: '22px', color: '#9b6a68' }}>
            Кошик
          </h2>
          <button className="drawer-close" onClick={onClose} aria-label="Закрити" type="button">
            ×
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-drawer-empty">
            <img
              src="/original-assets/assets/icons/empty-cart-primary.svg"
              alt="Кошик порожній"
              className="cart-empty-icon"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <p style={{ color: '#8e1500', margin: '12px 0' }}>Ваш кошик порожній</p>
            <button
              className="btn-primary"
              onClick={go(`/${locale}/catalog`)}
              type="button"
            >
              До каталогу
            </button>
          </div>
        ) : (
          <>
            <div className="cart-drawer-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-drawer-item">
                  <div className="cart-drawer-item-img">
                    {item.image ? (
                      <img src={item.image} alt={item.title} />
                    ) : (
                      <div className="cart-drawer-item-placeholder" />
                    )}
                  </div>

                  <div className="cart-drawer-item-info">
                    <div className="cart-drawer-item-title">{item.title}</div>
                    {item.priceText && (
                      <div className="cart-drawer-item-price">{item.priceText}</div>
                    )}
                  </div>

                  <div className="cart-drawer-item-qty">
                    <button
                      type="button"
                      onClick={() => updateCartQty?.(item.id, item.quantity - 1)}
                      aria-label="Зменшити"
                    >
                      <img
                        src="/original-assets/assets/icons/minus-secondary.svg"
                        alt="-"
                        width="14"
                        height="14"
                        onError={(e) => { e.currentTarget.replaceWith(Object.assign(document.createTextNode('−'))) }}
                      />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQty?.(item.id, item.quantity + 1)}
                      aria-label="Збільшити"
                    >
                      <img
                        src="/original-assets/assets/icons/plus-secondary.svg"
                        alt="+"
                        width="14"
                        height="14"
                        onError={(e) => { e.currentTarget.replaceWith(Object.assign(document.createTextNode('+'))) }}
                      />
                    </button>
                  </div>

                  <button
                    className="cart-drawer-item-remove"
                    type="button"
                    onClick={() => removeFromCart?.(item.id)}
                    aria-label="Видалити"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-drawer-footer">
              {total > 0 && (
                <div className="cart-drawer-total">
                  <span>Разом:</span>
                  <span>₴ {Math.round(total)}</span>
                </div>
              )}
              <button
                className="btn-primary"
                type="button"
                onClick={go(`/${locale}/checkout`)}
              >
                Оформити замовлення
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
