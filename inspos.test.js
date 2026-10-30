import { expect, test } from 'bun:test'
import { $ } from 'bun'

import { readInspos, saveInspo } from './inspos.js'
import { writeGallery } from './workspace.js'

const fixture = async () => {
  const root = (await $`mktemp -d`.text()).trim()

  await Bun.write(`${root}/gallery.html`, Bun.file(`${import.meta.dir}/gallery.html`))

  return root
}

test('saves image and source with searchable tags without moving the original', async () => {
  const root = await fixture()

  try {
    const image = `${root}/original.png`
    const contents = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

    await Bun.write(image, contents)
    await saveInspo(root, 'navigation', {
      title: 'Navigation reference',
      image,
      url: 'https://example.com/design',
      tags: ['Navigation', 'navigation', ' Motion '],
      notes: 'Like the quiet hover state.',
    })

    const [saved] = await readInspos(root)

    expect(saved.tags).toEqual(['inspos', 'navigation', 'motion'])
    expect(saved.notes).toBe('Like the quiet hover state.')
    expect(await Bun.file(`${root}/inspos/navigation/reference.png`).bytes()).toEqual(contents)
    expect(await Bun.file(image).exists()).toBe(true)
    await expect(saveInspo(root, 'navigation', { title: 'Overwrite', notes: 'Changed' })).rejects.toThrow('already exists')
  } finally {
    await $`rm -rf ${root}`
  }
})

test('accepts links and notes, rejects unsafe sources, and escapes embedded gallery data', async () => {
  const root = await fixture()

  try {
    expect(await readInspos(root)).toEqual([])

    for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'https://user:password@example.com']) {
      await expect(saveInspo(root, 'unsafe', { title: 'Unsafe', url })).rejects.toThrow()
    }

    await expect(saveInspo(root, '../escape', { title: 'Escape', notes: 'x' })).rejects.toThrow()
    await expect(saveInspo(root, 'empty', { title: 'Empty' })).rejects.toThrow()
    await expect(saveInspo(root, 'tags', { title: 'Tags', notes: 'x', tags: 'bad' })).rejects.toThrow()

    await saveInspo(root, 'link', { title: 'Source', url: 'https://example.com' })
    await saveInspo(root, 'notes', { title: 'Notes', notes: '</script><script>alert(1)</script> $& $`' })
    await writeGallery(root)

    const html = await Bun.file(`${root}/mockups/index.html`).text()

    expect(await readInspos(root)).toHaveLength(2)
    expect(html).not.toContain('</script><script>alert(1)</script>')
    expect(html).toContain('\\u003c/script>')
    expect(html).toContain('$& $`')
    expect(html).not.toContain('/* INSPOS_DATA */ []')
  } finally {
    await $`rm -rf ${root}`
  }
})
