let snapshotPromise = null

function toAbsoluteAsset(url) {
  if (!url) return url
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `https://namelaka.ua${url}`
  if (url.startsWith('assets/')) return `https://namelaka.ua/ua/${url}`
  return url
}

function patchFragmentHtml(html) {
  if (!html) return ''
  return html
    .replace(/src="assets\//g, 'src="https://namelaka.ua/ua/assets/')
    .replace(/href="assets\//g, 'href="https://namelaka.ua/ua/assets/')
    .replace(/routerlink="/g, 'data-routerlink="')
}

function text(el, selector) {
  const x = el.querySelector(selector)
  return x ? x.textContent.trim() : ''
}

function loadFromString(htmlText) {
  const doc = new DOMParser().parseFromString(htmlText, 'text/html')
  const appRoot = doc.querySelector('app-root') || doc.body

  const header = appRoot.querySelector('app-header')
  const categories = appRoot.querySelector('app-categories')

  const demoCards = Array.from(appRoot.querySelectorAll('app-catalog app-product-card')).map((card, idx) => {
    const img = card.querySelector('.image img')
    const title = text(card, '.info h1') || text(card, 'h1')
    const priceText = text(card, '.price')
    const hearts = text(card, '.counter span') || text(card, '.counter')
    return {
      index: idx,
      title,
      image: toAbsoluteAsset(img?.getAttribute('src') || ''),
      priceText,
      hearts,
      description: '',
    }
  })

  return {
    headerHtml: patchFragmentHtml(header?.outerHTML || ''),
    categoriesHtml: patchFragmentHtml(categories?.outerHTML || ''),
    demoCards,
  }
}

export async function loadOriginalSnapshot() {
  if (snapshotPromise) return snapshotPromise

  snapshotPromise = fetch('/original/ua/ua-home-app-root.html', { cache: 'no-store' })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Snapshot fetch failed: ${res.status}`)
      const html = await res.text()
      return loadFromString(html)
    })
    .catch((err) => {
      console.error('Failed to load original snapshot', err)
      return {
        headerHtml: '',
        categoriesHtml: '',
        demoCards: [],
      }
    })

  return snapshotPromise
}
