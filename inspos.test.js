import { test, expect } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { saveInspo, readInspos } from './inspos.js'
import { writeGallery } from './workspace.js'

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frappe-inspos-'))
  fs.mkdirSync(path.join(root, 'mockups'))
  fs.copyFileSync(path.join(import.meta.dirname, 'gallery.html'), path.join(root, 'gallery.html'))
  return root
}
test('saves image and source with searchable tags without moving the original', () => {
  const root = fixture()
  try {
    const image = path.join(root, 'original.png')
    const contents = Buffer.from('89504e470d0a1a0a', 'hex');fs.writeFileSync(image, contents)
    saveInspo(root, 'navigation', { title: 'Navigation reference', image, url: 'https://example.com/design', tags: ['Navigation', 'navigation', ' Motion '], notes: 'Like the quiet hover state.' })
    const [saved] = readInspos(root)
    expect(saved.tags).toEqual(['inspos', 'navigation', 'motion'])
    expect(saved.notes).toBe('Like the quiet hover state.')
    expect(fs.readFileSync(path.join(root, 'inspos/navigation/reference.png'))).toEqual(contents)
    expect(fs.existsSync(image)).toBe(true)
    expect(() => saveInspo(root, 'navigation', { title: 'Overwrite', notes: 'Changed' })).toThrow('already exists')
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
test('accepts links and notes, rejects unsafe sources, and escapes embedded gallery data', () => {
  const root = fixture()
  try {
    expect(readInspos(root)).toEqual([])
    for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'https://user:password@example.com']) {
      expect(() => saveInspo(root, 'unsafe', { title: 'Unsafe', url })).toThrow()
    }
    expect(() => saveInspo(root, '../escape', { title: 'Escape', notes: 'x' })).toThrow()
    expect(() => saveInspo(root, 'empty', { title: 'Empty' })).toThrow()
    expect(() => saveInspo(root, 'tags', { title: 'Tags', notes: 'x', tags: 'bad' })).toThrow()
    saveInspo(root, 'link', { title: 'Source', url: 'https://example.com' })
    saveInspo(root, 'notes', { title: 'Notes', notes: '</script><script>alert(1)</script> $& $`'  })
    writeGallery(root)
    const html = fs.readFileSync(path.join(root, 'mockups/index.html'), 'utf8')
    expect(readInspos(root)).toHaveLength(2)
    expect(html).not.toContain('</script><script>alert(1)</script>')
    expect(html).toContain('\\u003c/script>')
    expect(html).toContain('$& $`')
    expect(html).not.toContain('/* INSPOS_DATA */ []')
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
