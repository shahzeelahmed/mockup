import { listDirectories, validSlug, writeJson } from './workspace.js'

const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'])

export const referenceUrl = (value) => {
  const url = new URL(value)

  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Reference links must use HTTP or HTTPS')
  if (url.username || url.password) throw new Error('Reference links cannot include credentials')

  return url.href
}

const normalizeTags = (tags = []) => {
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) throw new Error('Tags must be a list of strings')

  return [...new Set(['inspos', ...tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)])]
}

const imageSource = async (file) => {
  if (!file) return null

  const extension = file.split('.').pop().toLowerCase()

  if (!imageExtensions.has(extension)) throw new Error('Use a PNG, JPEG, WebP, GIF, or AVIF image')
  if (!(await Bun.file(file).exists())) throw new Error('Image must be a local file')

  return { file, extension }
}

const inspoMetadata = (input) => {
  for (const field of ['title', 'notes', 'url']) {
    if (input[field] != null && typeof input[field] !== 'string') throw new Error(`${field} must be text`)
  }

  if (!input.title?.trim()) throw new Error('Give the inspiration a title')

  return {
    title: input.title.trim(),
    tags: normalizeTags(input.tags),
    notes: input.notes || '',
    url: input.url ? referenceUrl(input.url) : null,
    createdAt: new Date().toISOString(),
  }
}

export const saveInspo = async (root, slug, input) => {
  if (!validSlug(slug)) throw new Error('Use a kebab-case inspiration slug')

  const destination = `${root}/inspos/${slug}`

  if ((await listDirectories(`${root}/inspos`, '*')).includes(slug)) {
    throw new Error('Inspiration already exists; choose another slug')
  }

  const metadata = inspoMetadata(input)
  const image = await imageSource(input.image)

  if (!metadata.url && !image && !metadata.notes) throw new Error('Provide an image, source link, or reference notes')

  metadata.image = image ? `reference.${image.extension}` : null

  if (image) await Bun.write(`${destination}/${metadata.image}`, Bun.file(image.file))
  await writeJson(`${destination}/inspo.json`, metadata)

  return { ...metadata, slug }
}

const readInspo = async (directory, slug) => {
  const data = await Bun.file(`${directory}/${slug}/inspo.json`).json()
  const image = data.image && /^reference\.(png|jpe?g|webp|gif|avif)$/.test(data.image) ? data.image : null

  return {
    title: String(data.title || slug),
    notes: String(data.notes || ''),
    tags: normalizeTags(data.tags),
    url: data.url ? referenceUrl(data.url) : null,
    image: image && (await Bun.file(`${directory}/${slug}/${image}`).exists()) ? image : null,
    createdAt: String(data.createdAt || ''),
    slug,
  }
}

export const readInspos = async (root) => {
  const directory = `${root}/inspos`
  const slugs = await listDirectories(directory, 'inspo.json')
  const inspos = await Promise.all(slugs.map((slug) => readInspo(directory, slug)))

  return inspos.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
