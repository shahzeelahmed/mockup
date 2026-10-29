import fs from 'node:fs'
import path from 'node:path'

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'])
export function referenceUrl(value) {
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Reference links must use HTTP or HTTPS')
  if (url.username || url.password) throw new Error('Reference links cannot include credentials')
  return url.href
}
function normalizeTags(tags = []) {
  if (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string')) throw new Error('Tags must be a list of strings')
  return [...new Set(['inspos', ...tags.map(tag => tag.trim().toLowerCase()).filter(Boolean)])]
}
function imageSource(file) {
  if (!file) return null
  const extension = path.extname(file).toLowerCase()
  if (!imageExtensions.has(extension)) throw new Error('Use a PNG, JPEG, WebP, GIF, or AVIF image')
  if (!fs.statSync(file).isFile()) throw new Error('Image must be a local file')
  return { file, extension }
}
export function saveInspo(root, slug, input) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '')) throw new Error('Use a kebab-case inspiration slug')
  const destination = path.join(root, 'inspos', slug)
  if (fs.existsSync(destination)) throw new Error('Inspiration already exists; choose another slug')
  const metadata = inspoMetadata(input)
  const image = imageSource(input.image)
  if (!metadata.url && !image && !metadata.notes) throw new Error('Provide an image, source link, or reference notes')
  metadata.image = image ? `reference${image.extension}` : null
  fs.mkdirSync(destination, { recursive: true })
  if (image) fs.copyFileSync(image.file, path.join(destination, metadata.image))
  fs.writeFileSync(path.join(destination, 'inspo.json'), JSON.stringify(metadata, null, 2) + '\n')
  return { ...metadata, slug }
}
function inspoMetadata(input) {
  for (const field of ['title', 'notes', 'url']) {
    if (input[field] != null && typeof input[field] !== 'string') throw new Error(`${field} must be text`)
  }
  if (!input.title?.trim()) throw new Error('Give the inspiration a title')
  return { title: input.title.trim(), tags: normalizeTags(input.tags), notes: input.notes || '',
    url: input.url ? referenceUrl(input.url) : null, createdAt: new Date().toISOString() }
}
export function readInspos(root) {
  const directory = path.join(root, 'inspos')
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).filter(entry => entry.isDirectory())
    .filter(entry => fs.existsSync(path.join(directory, entry.name, 'inspo.json')))
    .map(entry => readInspo(directory, entry.name))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
function readInspo(directory, slug) {
  const data = JSON.parse(fs.readFileSync(path.join(directory, slug, 'inspo.json'), 'utf8'))
  const image = data.image && /^reference\.(png|jpe?g|webp|gif|avif)$/.test(data.image) ? data.image : null
  return { title: String(data.title || slug), notes: String(data.notes || ''),
    tags: normalizeTags(data.tags), url: data.url ? referenceUrl(data.url) : null,
    image: image && fs.existsSync(path.join(directory, slug, image)) ? image : null,
    createdAt: String(data.createdAt || ''), slug }
}
