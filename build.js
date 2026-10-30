import { build } from 'vite'

import { mockupConfig } from './config.js'
import { writeGallery } from './workspace.js'

const root = import.meta.dir
const slug = Bun.argv[2]
const mockupDir = `${root}/mockups/${slug}`

if (!slug || !(await Bun.file(`${mockupDir}/Mockup.vue`).exists())) {
  console.error('Usage: bun build.js <slug>  (needs mockups/<slug>/Mockup.vue)')
  process.exit(1)
}

await build(await mockupConfig(root, slug))

const outDir = `${root}/.dist/${slug}`
const read = (src) => Bun.file(`${outDir}/${src.replace(/^\.?\//, '')}`).text()

let html = await read('index.html')

for (const [tag, href] of html.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)) {
  const css = await read(href)

  html = html.replace(tag, () => `<style>${css}</style>`)
}

for (const [tag, src] of html.matchAll(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g)) {
  const code = (await read(src)).replace(/<\/script/g, '<\\/script')

  html = html.replace(tag, () => `<script type="module">${code}</script>`)
}

html = html.replace('<title>Mockup</title>', `<title>${slug}</title>`)

const out = `${mockupDir}/mockup.html`

await Bun.write(out, html)
console.log(`${out} (${Math.round(html.length / 1024)} KB)`)

await writeGallery(root)
