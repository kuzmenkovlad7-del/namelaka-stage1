import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const mirror = path.join(root, '..', 'assets', 'original-mirror', 'namelaka.ua', 'ua')
const outFile = path.join(root, 'public', 'original', 'ua', 'original-components.css')

const candidates = [
  path.join(mirror, 'main-7UYDGGLH.js'),
  path.join(mirror, 'chunk-ZOZRNSYK.js'),
].filter((p) => fs.existsSync(p))

if (!candidates.length) {
  console.error('No mirrored JS bundles found in:', mirror)
  process.exit(1)
}

const jsStringRe = /"(?:\\.|[^"\\])*"/g
const seen = new Set()
const collected = []

function normalizeCss(css) {
  return css
    // Убираем Angular scoped placeholders -> делаем стили глобальными для snapshot
    .replace(/\[_nghost-%COMP%\]/g, '')
    .replace(/\[_ngcontent-%COMP%\]/g, '')
    // Нормализуем пути к ресурсам
    .replace(/url\((['"]?)\/?public\/original\/ua\//g, 'url($1/original/ua/')
    .replace(/url\((['"]?)media\//g, 'url($1/original/ua/media/')
    .replace(/url\((['"]?)\.\/media\//g, 'url($1/original/ua/media/')
    .replace(/url\((['"]?)\/?ua\/media\//g, 'url($1/original/ua/media/')
    // Немного чистим мусорные пробелы
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

for (const file of candidates) {
  const src = fs.readFileSync(file, 'utf8')
  const matches = src.match(jsStringRe) || []

  for (const raw of matches) {
    if (!raw.includes('%COMP%')) continue
    if (!raw.includes('_nghost-%COMP%') && !raw.includes('_ngcontent-%COMP%')) continue

    let s = null
    try {
      s = JSON.parse(raw)
    } catch {
      continue
    }

    if (!s || typeof s !== 'string') continue
    if (!s.includes('{') || !s.includes('}')) continue

    const css = normalizeCss(s)
    if (!css) continue
    if (seen.has(css)) continue
    seen.add(css)
    collected.push(css)
  }
}

const banner = `/* Auto-extracted Angular component styles from mirrored bundles
   Generated: ${new Date().toISOString()}
   Source: ${candidates.map((p) => path.basename(p)).join(', ')}
   NOTE: %COMP% placeholders removed to make snapshot styling work in React stage1.
*/
`

fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, banner + '\n' + collected.join('\n\n') + '\n', 'utf8')

console.log('WROTE:', outFile)
console.log('CSS_BLOCKS:', collected.length)
console.log('BYTES:', fs.statSync(outFile).size)
