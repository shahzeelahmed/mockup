import fs from 'node:fs'
import path from 'node:path'
import { readRounds, writeGallery } from './workspace.mjs'
import { readInspos } from './inspos.mjs'

const root = import.meta.dirname
const round = path.join(root, 'mockups/design-workspace-v1')

if (!fs.existsSync(path.join(round, 'Mockup.vue'))) throw new Error('Gallery source missing: mockups/design-workspace-v1/Mockup.vue')

fs.writeFileSync(path.join(round, 'snapshot.json'), JSON.stringify({
  rounds: readRounds(root), inspos: readInspos(root),
}, null, 2))
const build = Bun.spawn(['bun', 'build.mjs', 'design-workspace-v1'], {
  cwd: root, stdout: 'inherit', stderr: 'inherit',
})
if (await build.exited) throw new Error('Gallery build failed')
const data = '<script>window.__DESIGN_ROUNDS__ = /* WORKSPACE_DATA */ []; window.__DESIGN_INSPOS__ = /* INSPOS_DATA */ [];</script>'
const html = fs.readFileSync(path.join(round, 'mockup.html'), 'utf8')
fs.writeFileSync(path.join(root, 'gallery.html'), html.replace('<head>', `<head>${data}`).replace('<title>design-workspace-v1</title>', '<title>Frappe design workspace</title>'))
writeGallery(root)
console.log('Built gallery: http://127.0.0.1:4818/mockups/')
