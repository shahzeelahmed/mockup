import { $ } from 'bun'

import { readInspos } from './inspos.js'

export const statuses = ['exploring', 'selected', 'superseded', 'implemented']

export const validSlug = (input) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input || '')

export const listDirectories = async (directory, marker) => {
  const files = await Array.fromAsync(new Bun.Glob(`*/${marker}`).scan({ cwd: directory })).catch(() => [])

  return files.map((file) => file.split('/')[0])
}

const readRound = async (root, slug) => {
  const dir = `${root}/mockups/${slug}`
  const design = Bun.file(`${dir}/design.json`)
  const base = slug.replace(/-v\d+$/, '')
  const version = Number(slug.match(/-v(\d+)$/)?.[1] || 1)
  const metadata = (await design.exists()) ? await design.json() : {}

  return {
    project: base,
    title: base.replaceAll('-', ' '),
    version,
    status: 'exploring',
    objective: '',
    feedback: '',
    selectedVariant: '',
    sources: [],
    variants: [],
    parent: null,
    ...metadata,
    slug,
    built: await Bun.file(`${dir}/mockup.html`).exists(),
    customBuilder: await Bun.file(`${dir}/build.js`).exists(),
    createdAt: (await Bun.file(dir).stat()).birthtimeMs,
    thumbnail: await Bun.file(`${dir}/thumbnail.png`).exists(),
  }
}

export const readRounds = async (root) => {
  const slugs = await listDirectories(`${root}/mockups`, 'Mockup.vue')

  return Promise.all(slugs.map((slug) => readRound(root, slug)))
}

export const writeJson = (file, data) => Bun.write(file, `${JSON.stringify(data, null, 2)}\n`)

export const initializeMetadata = async (root) => {
  const rounds = await readRounds(root)

  for (const round of rounds) {
    const file = `${root}/mockups/${round.slug}/design.json`

    if (await Bun.file(file).exists()) continue

    const { slug, built, customBuilder, thumbnail, createdAt, ...metadata } = round

    metadata.parent =
      rounds
        .filter((item) => item.project === round.project && item.version < round.version)
        .sort((a, b) => b.version - a.version)[0]?.slug || null

    await writeJson(file, metadata)
  }
}

const embed = (data) => JSON.stringify(data).replaceAll('<', '\\u003c')

export const writeGallery = async (root) => {
  const template = Bun.file(`${root}/gallery.html`)

  if (!(await template.exists())) return false

  const rounds = embed(await readRounds(root))
  const inspos = embed(await readInspos(root))
  const html = (await template.text())
    .replace('/* WORKSPACE_DATA */ []', () => rounds)
    .replace('/* INSPOS_DATA */ []', () => inspos)

  await Bun.write(`${root}/mockups/index.html`, html)

  return true
}

export const trashRound = async (root, slug) => {
  if (!validSlug(slug)) throw new Error('Invalid slug')
  if (slug === 'design-workspace-v1') throw new Error('The gallery itself cannot be deleted')

  const source = `${root}/mockups/${slug}`

  if (!(await Bun.file(`${source}/Mockup.vue`).exists())) throw new Error('Unknown mockup')

  await $`mkdir -p ${root}/.trash`
  await $`mv ${source} ${root}/.trash/${slug}-${Date.now()}`
}
