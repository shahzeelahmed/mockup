import fs from 'node:fs'
import { readInspos } from './inspos.mjs'
import path from 'node:path'

export const statuses = ['exploring', 'selected', 'superseded', 'implemented']
export function readRounds(root) {
  return fs.readdirSync(path.join(root, 'mockups'), { withFileTypes: true })
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
    thumbnail: fs.existsSync(path.join(dir, 'thumbnail.png')) }
}
export function initializeMetadata(root) {
  for (const round of readRounds(root)) {
    const file = path.join(root, 'mockups', round.slug, 'design.json')
    if (fs.existsSync(file)) continue
    const { slug, built, customBuilder, thumbnail, ...metadata } = round
    metadata.parent = readRounds(root).filter(item => item.project === round.project && item.version < round.version)
      .sort((a, b) => b.version - a.version)[0]?.slug || null
    fs.writeFileSync(file, JSON.stringify(metadata, null, 2) + '\n')
  }
}
export function writeGallery(root) {
  const template = fs.readFileSync(path.join(root, 'gallery.html'), 'utf8')
  const data = JSON.stringify(readRounds(root)).replaceAll('<', '\\u003c')
  fs.writeFileSync(path.join(root, 'mockups', 'index.html'), template.replace('/* WORKSPACE_DATA */ []', () => data).replace('/* INSPOS_DATA */ []', () => JSON.stringify(readInspos(root)).replaceAll('<', '\\u003c')))
}
