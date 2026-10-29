import fs from 'node:fs'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import frappeui from 'frappe-ui/vite'

export function mockupConfig(root, slug) {
const crmSrc = process.env.CRM_SRC_OVERRIDE || path.resolve(root, '../frappe-bench/apps/crm/frontend/src')
const mockupDir = path.join(root, 'mockups', slug)
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !fs.existsSync(path.join(mockupDir, 'Mockup.vue'))) throw new Error('Unknown mockup: ' + slug)
const outDir = path.join(root, '.dist', slug)

// optional mockups/<slug>/aliases.json: { "import/path": "file relative to the mockup dir" }
function extraAliases() {
  const file = path.join(mockupDir, 'aliases.json')
  if (!fs.existsSync(file)) return []
  const map = JSON.parse(fs.readFileSync(file, 'utf8'))
  // keys wrapped in ^...$ match the import path exactly (so `^frappe-ui$` leaves `frappe-ui/style.css` alone)
  return Object.entries(map).map(([k, v]) => ({
    find: k.startsWith('^') ? new RegExp(k) : k,
    replacement: path.isAbsolute(v) ? v : path.join(mockupDir, v),
  }))
}
process.env.MOCKUP_DIR = mockupDir
process.env.CRM_SRC = crmSrc

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
      ...extraAliases(),
      { find: '@', replacement: crmSrc },
    ],
    dedupe: ['vue', 'frappe-ui', 'reka-ui', '@vueuse/core'],
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: path.join(root, 'tailwind.config.js') }),
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

