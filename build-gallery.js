import { readInspos } from './inspos.js'
import { readRounds, writeGallery } from './workspace.js'

const root = import.meta.dir
const round = `${root}/mockups/design-workspace-v1`

if (!(await Bun.file(`${round}/Mockup.vue`).exists())) {
  throw new Error('Gallery source missing: mockups/design-workspace-v1/Mockup.vue')
}

await Bun.write(
  `${round}/snapshot.json`,
  JSON.stringify({ rounds: await readRounds(root), inspos: await readInspos(root) }, null, 2),
)

const build = Bun.spawn(['bun', 'build.js', 'design-workspace-v1'], {
  cwd: root,
  stdout: 'inherit',
  stderr: 'inherit',
})

if (await build.exited) throw new Error('Gallery build failed')

const data =
  '<script>window.__DESIGN_ROUNDS__ = /* WORKSPACE_DATA */ []; window.__DESIGN_INSPOS__ = /* INSPOS_DATA */ [];</script>'
const html = await Bun.file(`${round}/mockup.html`).text()

await Bun.write(
  `${root}/gallery.html`,
  html
    .replace('<head>', `<head>${data}`)
    .replace('<title>design-workspace-v1</title>', '<title>Frappe design workspace</title>'),
)
await writeGallery(root)

console.log('Built gallery: http://127.0.0.1:4818/mockups/')
