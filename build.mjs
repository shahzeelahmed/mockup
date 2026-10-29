import { mockupConfig } from './config.mjs'
import { writeGallery } from './workspace.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { build } from 'vite'
const root = import.meta.dirname
const crmSrc = process.env.CRM_SRC_OVERRIDE || path.resolve(root, '../frappe-bench/apps/crm/frontend/src')
const slug = process.argv[2]
const mockupDir = path.join(root, 'mockups', slug ?? '')

if (!slug || !fs.existsSync(path.join(mockupDir, 'Mockup.vue'))) {
  console.error(`Usage: bun build.mjs <slug>  (needs mockups/<slug>/Mockup.vue)`)
  process.exit(1)
}

await build(mockupConfig(root, slug))
const outDir = path.join(root, '.dist', slug)

let html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
const read = (src) => fs.readFileSync(path.join(outDir, src.replace(/^\.?\//, '')), 'utf8')
const readCss = read

html = html
  .replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => `<style>${readCss(href)}</style>`)
  .replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, src) =>
    `<script type="module">${read(src).replace(/<\/script/g, '<\\/script')}</script>`,
  )
  .replace('<title>Mockup</title>', `<title>${slug}</title>`)

const out = path.join(mockupDir, 'mockup.html')
fs.writeFileSync(out, html)
console.log(`${out} (${Math.round(html.length / 1024)} KB)`)

writeGallery(root)
