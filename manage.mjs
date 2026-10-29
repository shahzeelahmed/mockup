import fs from 'node:fs'
import { saveInspo } from './inspos.mjs'
import path from 'node:path'
import { initializeMetadata, writeGallery, readRounds, statuses } from './workspace.mjs'
const root = import.meta.dirname
const [command, slug, value] = process.argv.slice(2)
const validSlug = input => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input || '')
function save(slug, metadata) {
  fs.writeFileSync(path.join(root, 'mockups', slug, 'design.json'), JSON.stringify(metadata, null, 2) + '\n')
}
function forkRound(source, target) {
  if (!validSlug(target)) throw new Error('Provide a kebab-case destination slug')
  const destination = path.join(root, 'mockups', target)
  if (fs.existsSync(destination)) throw new Error('Destination already exists')
  fs.cpSync(path.join(root, 'mockups', source.slug), destination, { recursive: true,
    filter: file => !['mockup.html', 'thumbnail.png'].includes(path.basename(file)) })
  const { slug, built, customBuilder, thumbnail, ...metadata } = source
  save(target, { ...metadata, parent: slug, version: source.version + 1,
    status: 'exploring', objective: '', feedback: '', selectedVariant: '' })
}
initializeMetadata(root)
if (command === 'inspo') {
  if (!value) throw new Error('Usage: bun manage.mjs inspo <slug> <metadata.json>')
  saveInspo(root, slug, JSON.parse(fs.readFileSync(value, 'utf8')))
} else if (command === 'fork' || command === 'status') {
  if (!validSlug(slug)) throw new Error('Invalid slug')
  const round = readRounds(root).find(item => item.slug === slug)
  if (!round) throw new Error('Unknown mockup')
  if (command === 'fork') forkRound(round, value)
  else {
    if (!statuses.includes(value)) throw new Error('Status must be: ' + statuses.join(', '))
    const file = path.join(root, 'mockups', slug, 'design.json')
    save(slug, { ...JSON.parse(fs.readFileSync(file, 'utf8')), status: value })
  }
} else if (command !== 'index') throw new Error('Usage: bun manage.mjs index | fork <slug> <new-slug> | status <slug> <status> | inspo <slug> <metadata.json>')
writeGallery(root)
console.log('Workspace updated')
