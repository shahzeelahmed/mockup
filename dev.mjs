import { createServer } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { mockupConfig } from './config.mjs'
import { writeGallery } from './workspace.mjs'
const root = import.meta.dirname
const slug = process.argv[2]
if (!slug) throw new Error('Usage: bun dev.mjs <slug>')
writeGallery(root)
const config = mockupConfig(root, slug)
config.cacheDir = path.join(root, '.vite-cache', slug)
config.optimizeDeps = { entries: ['index.html'] }
config.plugins.push({ name: 'workspace-gallery', configureServer(server) {
  server.middlewares.use((request, response, next) => {
    const pathname = new URL(request.url, 'http://localhost').pathname
    if (!pathname.startsWith('/mockups/')) return next()
    const target = pathname === '/mockups/' ? 'index.html' : decodeURIComponent(pathname.slice(9))
    const file = path.resolve(root, 'mockups', target)
    if (!file.startsWith(path.join(root, 'mockups') + path.sep) || !file.endsWith('.html')) return next()
    if (!fs.existsSync(file)) return next()
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    fs.createReadStream(file).pipe(response)
  })
  server.watcher.on('change', file => {
    if (file.endsWith('/design.json') || file.endsWith('/notes.md') || file.endsWith('/inspo.json')) writeGallery(root)
  })
} })
const server = await createServer({ ...config, server: { host: '127.0.0.1', port: 4818, strictPort: true,
  // node_modules is a symlink into the CRM frontend; allow its real path so fonts load.
  fs: { allow: [root, process.env.CRM_SRC, fs.realpathSync(path.join(root, 'node_modules'))] } } })
await server.listen()
console.log(`Gallery: http://127.0.0.1:4818/mockups/\nLive ${slug}: http://127.0.0.1:4818/`)
