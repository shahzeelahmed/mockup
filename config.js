import vue from '@vitejs/plugin-vue'
import autoprefixer from 'autoprefixer'
import frappeui from 'frappe-ui/vite'
import tailwindcss from 'tailwindcss'

import { validSlug } from './workspace.js'

export const mockupConfig = async (root, slug) => {
const mockupDir = `${root}/mockups/${slug}`
if (!validSlug(slug) || !(await Bun.file(`${mockupDir}/Mockup.vue`).exists())) throw new Error('Unknown mockup: ' + slug)
const outDir = `${root}/.dist/${slug}`

// optional mockups/<slug>/aliases.json: { "import/path": "file relative to the mockup dir" }
const extraAliases = async () => {
  const file = Bun.file(`${mockupDir}/aliases.json`)
  if (!(await file.exists())) return []
  const map = await file.json()
  // keys wrapped in ^...$ match the import path exactly (so `^frappe-ui$` leaves `frappe-ui/style.css` alone)
  return Object.entries(map).map(([k, v]) => ({
    find: k.startsWith('^') ? new RegExp(k) : k,
    replacement: v.startsWith('/') ? v : `${mockupDir}/${v}`,
  }))
}
const aliases = await extraAliases()
process.env.MOCKUP_DIR = mockupDir

return {
  root,
  base: './',
  logLevel: 'warn',
  configFile: false,
  plugins: [
    frappeui({
      frappeProxy: false,
      jinjaBootData: false,
      buildConfig: false,
      lucideIcons: true,
      codeLanguages: false,
    }),
    vue(),
  ],
  resolve: {
    alias: [
      { find: '@mockup', replacement: mockupDir },
      ...aliases,
    ],
    dedupe: ['vue', 'frappe-ui', 'reka-ui', '@vueuse/core'],
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: `${root}/tailwind.config.js` }),
        autoprefixer(),
      ],
    },
  },
  build: {
    outDir,
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    modulePreload: false,
    rolldownOptions: { output: { codeSplitting: false } },
  },
}
}

