import { $ } from 'bun'

import { saveInspo } from './inspos.js'
import {
  initializeMetadata,
  listDirectories,
  readRounds,
  statuses,
  trashRound,
  validSlug,
  writeGallery,
  writeJson,
} from './workspace.js'

const root = import.meta.dir
const [command, slug, value] = Bun.argv.slice(2)
const usage =
  'Usage: bun manage.js index | fork <slug> <new-slug> | status <slug> <status> | inspo <slug> <metadata.json> | delete <slug>'

const designFile = (round) => `${root}/mockups/${round}/design.json`

const forkRound = async (source, target) => {
  if (!validSlug(target)) throw new Error('Provide a kebab-case destination slug')

  const destination = `${root}/mockups/${target}`

  if ((await listDirectories(`${root}/mockups`, '*')).includes(target)) throw new Error('Destination already exists')

  await $`cp -r ${root}/mockups/${source.slug} ${destination}`
  await $`rm -f ${destination}/mockup.html ${destination}/thumbnail.png`

  const { slug, built, customBuilder, thumbnail, createdAt, ...metadata } = source

  await writeJson(designFile(target), {
    ...metadata,
    parent: slug,
    version: source.version + 1,
    status: 'exploring',
    objective: '',
    feedback: '',
    selectedVariant: '',
  })
}

const findRound = async () => {
  if (!validSlug(slug)) throw new Error('Invalid slug')

  const round = (await readRounds(root)).find((item) => item.slug === slug)

  if (!round) throw new Error('Unknown mockup')

  return round
}

await initializeMetadata(root)

if (command === 'inspo') {
  if (!value) throw new Error('Usage: bun manage.js inspo <slug> <metadata.json>')

  await saveInspo(root, slug, await Bun.file(value).json())
} else if (command === 'fork') {
  await forkRound(await findRound(), value)
} else if (command === 'status') {
  await findRound()

  if (!statuses.includes(value)) throw new Error(`Status must be: ${statuses.join(', ')}`)

  await writeJson(designFile(slug), { ...(await Bun.file(designFile(slug)).json()), status: value })
} else if (command === 'delete') {
  await trashRound(root, slug)
} else if (command !== 'index') {
  throw new Error(usage)
}

if (await writeGallery(root)) console.log('Workspace updated')
else console.log('Workspace updated; no gallery.html, so the gallery was not written')
