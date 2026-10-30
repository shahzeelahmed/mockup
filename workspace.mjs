import fs from 'node:fs'
import { readInspos } from './inspos.mjs'
import path from 'node:path'

export const statuses = ['exploring', 'selected', 'superseded', 'implemented']
export function readRounds(root) {
  const directory = path.join(root, 'mockups')

  if (!fs.existsSync(directory)) return []

  return fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(root, 'mockups', entry.name, 'Mockup.vue')))
    .map(entry => readRound(root, entry.name))
}
function readRound(root, slug) {
  const dir = path.join(root, 'mockups', slug)
  const file = path.join(dir, 'design.json')
  const base = slug.replace(/-v\d+$/, '')
  const version = Number(slug.match(/-v(\d+)$/)?.[1] || 1)
  const metadata = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
  return { project: base, title: base.replaceAll('-', ' '), version, status: 'exploring',
    objective: '', feedback: '', selectedVariant: '', sources: [], variants: [], parent: null,
    ...metadata, slug, built: fs.existsSync(path.join(dir, 'mockup.html')),
    customBuilder: fs.existsSync(path.join(dir, 'build.mjs')),
    createdAt: fs.statSync(dir).birthtimeMs,
    thumbnail: fs.existsSync(path.join(dir, 'thumbnail.png')) }
}
export function initializeMetadata(root) {
  for (const round of readRounds(root)) {
    const file = path.join(root, 'mockups', round.slug, 'design.json')
    if (fs.existsSync(file)) continue
    const { slug, built, customBuilder, thumbnail, createdAt, ...metadata } = round
    metadata.parent = readRounds(root).filter(item => item.project === round.project && item.version < round.version)
      .sort((a, b) => b.version - a.version)[0]?.slug || null
    fs.writeFileSync(file, JSON.stringify(metadata, null, 2) + '\n')
  }
}
export function writeGallery(root) {
  const templateFile = path.join(root, 'gallery.html')

  if (!fs.existsSync(templateFile)) return false

  const template = fs.readFileSync(templateFile, 'utf8')
  const data = JSON.stringify(readRounds(root)).replaceAll('<', '\\u003c')
  fs.mkdirSync(path.join(root, 'mockups'), { recursive: true })
  fs.writeFileSync(path.join(root, 'mockups', 'index.html'), template.replace('/* WORKSPACE_DATA */ []', () => data).replace('/* INSPOS_DATA */ []', () => JSON.stringify(readInspos(root)).replaceAll('<', '\\u003c')))

  return true
}

export const trashRound = (root, slug) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '')) throw new Error('Invalid slug')
  if (slug === 'design-workspace-v1') throw new Error('The gallery itself cannot be deleted')

  const source = path.join(root, 'mockups', slug)

  if (!fs.existsSync(path.join(source, 'Mockup.vue'))) throw new Error('Unknown mockup')

  const trash = path.join(root, '.trash')

  fs.mkdirSync(trash, { recursive: true })
  fs.renameSync(source, path.join(trash, `${slug}-${Date.now()}`))
}
