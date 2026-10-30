import { createServer } from 'vite'
import { mockupConfig } from './config.js'
import { trashRound, writeGallery } from './workspace.js'
const root = import.meta.dir
const slug = Bun.argv[2] ?? 'design-workspace-v1'
const galleryDir = `${root}/mockups/design-workspace-v1`
const gallerySource = /\/mockups\/design-workspace-v1\/[^/]+\.(vue|js|css)$/

const galleryStale = async () => {
  const built = Bun.file(`${root}/gallery.html`)

  if (!(await built.exists())) return true

  const sources = await Array.fromAsync(new Bun.Glob('*.{vue,js,css}').scan({ cwd: galleryDir }))

  return sources.some(file => Bun.file(`${galleryDir}/${file}`).lastModified > built.lastModified)
}

const buildGallery = () => Bun.spawn(['bun', 'build-gallery.js'], { cwd: root, stdout: 'inherit', stderr: 'inherit' }).exited

let galleryTimer

const queueGalleryBuild = () => {
  clearTimeout(galleryTimer)
  galleryTimer = setTimeout(buildGallery, 300)
}

if (await galleryStale()) await buildGallery()
else await writeGallery(root)

const config = await mockupConfig(root, slug)
config.cacheDir = `${root}/.vite-cache/${slug}`
config.optimizeDeps = { entries: ['index.html'] }
config.plugins.push({ name: 'workspace-gallery', configureServer(server) {
  server.middlewares.use(async (request, response, next) => {
    const pathname = new URL(request.url, 'http://localhost').pathname
    if (pathname === '/mockups') {
      response.statusCode = 301
      response.setHeader('Location', '/mockups/')
      return response.end()
    }
    if (!pathname.startsWith('/mockups/')) return next()
    if (request.method === 'DELETE' && pathname.startsWith('/mockups/api/rounds/')) {
      try {
        await trashRound(root, decodeURIComponent(pathname.slice('/mockups/api/rounds/'.length)))
        await writeGallery(root)
        response.statusCode = 204
        return response.end()
      } catch (error) {
        response.statusCode = 400
        return response.end(error.message)
      }
    }
    const target = pathname === '/mockups/' ? 'index.html' : decodeURIComponent(pathname.slice(9))
    if (!/^(index|[a-z0-9-]+\/mockup)\.html$/.test(target)) return next()
    const file = Bun.file(`${root}/mockups/${target}`)
    if (!(await file.exists())) return next()
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end(await file.bytes())
  })
  server.watcher.on('change', file => {
    if (gallerySource.test(file)) return queueGalleryBuild()
    if (file.endsWith('/design.json') || file.endsWith('/notes.md') || file.endsWith('/inspo.json')) writeGallery(root)
  })
} })
const server = await createServer({ ...config, server: { host: '127.0.0.1', port: 4818, strictPort: true,
  fs: { allow: [root] } } })
await server.listen()
console.log(`Gallery: http://127.0.0.1:4818/mockups/\nLive ${slug}: http://127.0.0.1:4818/`)
