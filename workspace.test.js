import { expect, test } from 'bun:test'
import { $ } from 'bun'

import { initializeMetadata, readRounds, writeGallery } from './workspace.js'

const temporaryRoot = async () => (await $`mktemp -d`.text()).trim()

test('migration preserves notes and explicit metadata; gallery escapes embedded scripts', async () => {
  const root = await temporaryRoot()

  try {
    for (const slug of ['example', 'example-v2']) {
      await Bun.write(`${root}/mockups/${slug}/Mockup.vue`, '<template>Example</template>')
      await Bun.write(`${root}/mockups/${slug}/notes.md`, 'Historical approval notes')
    }

    await Bun.write(`${root}/gallery.html`, Bun.file(`${import.meta.dir}/gallery.html`))
    await initializeMetadata(root)

    const file = `${root}/mockups/example-v2/design.json`
    const metadata = await Bun.file(file).json()

    expect(metadata.parent).toBe('example')
    expect(metadata.status).toBe('exploring')

    metadata.status = 'selected'
    metadata.objective = '</script><script>alert(1)</script>'

    await Bun.write(file, JSON.stringify(metadata))
    await initializeMetadata(root)
    await writeGallery(root)

    expect((await readRounds(root)).find((round) => round.slug === 'example-v2').status).toBe('selected')
    expect(await Bun.file(`${root}/mockups/example/notes.md`).text()).toBe('Historical approval notes')
    expect(await Bun.file(`${root}/mockups/index.html`).text()).not.toContain(metadata.objective)
  } finally {
    await $`rm -rf ${root}`
  }
})

test('fork keeps the parent and rejects overwrites and traversal', async () => {
  const root = await temporaryRoot()

  try {
    for (const name of ['manage.js', 'workspace.js', 'gallery.html', 'inspos.js']) {
      await Bun.write(`${root}/${name}`, Bun.file(`${import.meta.dir}/${name}`))
    }

    const files = {
      'Mockup.vue': '<template>Hello</template>',
      'notes.md': 'Original notes',
      'mockup.html': 'Original export',
      'thumbnail.png': 'image',
    }

    for (const [name, body] of Object.entries(files)) await Bun.write(`${root}/mockups/example/${name}`, body)

    const run = (...args) => Bun.spawnSync([process.execPath, `${root}/manage.js`, ...args]).exitCode

    expect(run('status', 'example', 'selected')).toBe(0)
    expect(run('fork', 'example', 'example-v2')).toBe(0)
    expect((await Bun.file(`${root}/mockups/example/design.json`).json()).status).toBe('selected')
    expect((await Bun.file(`${root}/mockups/example-v2/design.json`).json()).parent).toBe('example')
    expect(await Bun.file(`${root}/mockups/example-v2/mockup.html`).exists()).toBe(false)
    expect(await Bun.file(`${root}/mockups/example-v2/thumbnail.png`).exists()).toBe(false)
    expect(run('fork', 'example', 'example-v2')).not.toBe(0)
    expect(run('fork', 'example', '../escape')).not.toBe(0)
    expect(run('status', 'example', 'wrong')).not.toBe(0)
  } finally {
    await $`rm -rf ${root}`
  }
}, 30000)
