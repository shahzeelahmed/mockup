import { test, expect } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { initializeMetadata, readRounds, writeGallery } from './workspace.js'

test('migration preserves notes and explicit metadata; gallery escapes embedded scripts', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'frappe-workspace-'))
  try {
    for(const slug of ['example','example-v2']) {
      const dir=path.join(root,'mockups',slug);fs.mkdirSync(dir,{recursive:true})
      fs.writeFileSync(path.join(dir,'Mockup.vue'),'<template>Example</template>')
      fs.writeFileSync(path.join(dir,'notes.md'),'Historical approval notes')
    }
    fs.copyFileSync(path.join(import.meta.dirname,'gallery.html'),path.join(root,'gallery.html'))
    initializeMetadata(root)
    const file=path.join(root,'mockups/example-v2/design.json')
    const metadata=JSON.parse(fs.readFileSync(file,'utf8'))
    expect(metadata.parent).toBe('example'); expect(metadata.status).toBe('exploring')
    metadata.status='selected';metadata.objective='</script><script>alert(1)</script>'
    fs.writeFileSync(file,JSON.stringify(metadata));initializeMetadata(root);writeGallery(root)
    expect(readRounds(root).find(r=>r.slug==='example-v2').status).toBe('selected')
    expect(fs.readFileSync(path.join(root,'mockups/example/notes.md'),'utf8')).toBe('Historical approval notes')
    expect(fs.readFileSync(path.join(root,'mockups/index.html'),'utf8')).not.toContain(metadata.objective)
  } finally {fs.rmSync(root,{recursive:true,force:true})}
})

test('fork keeps the parent and rejects overwrites and traversal', () => {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'frappe-fork-'))
 try {
  for(const name of ['manage.js','workspace.js','gallery.html','inspos.js'])fs.copyFileSync(path.join(import.meta.dirname,name),path.join(root,name))
  const dir=path.join(root,'mockups/example');fs.mkdirSync(dir,{recursive:true})
  for(const [name,body] of Object.entries({'Mockup.vue':'<template>Hello</template>','notes.md':'Original notes','mockup.html':'Original export','thumbnail.png':'image'}))fs.writeFileSync(path.join(dir,name),body)
  const run=(...args)=>Bun.spawnSync([process.execPath,path.join(root,'manage.js'),...args])
  expect(run('status','example','selected').exitCode).toBe(0)
  expect(run('fork','example','example-v2').exitCode).toBe(0)
  expect(JSON.parse(fs.readFileSync(path.join(dir,'design.json'))).status).toBe('selected')
  expect(JSON.parse(fs.readFileSync(path.join(root,'mockups/example-v2/design.json'))).parent).toBe('example')
  expect(fs.existsSync(path.join(root,'mockups/example-v2/mockup.html'))).toBe(false)
  expect(fs.existsSync(path.join(root,'mockups/example-v2/thumbnail.png'))).toBe(false)
  expect(run('fork','example','example-v2').exitCode).not.toBe(0)
  expect(run('fork','example','../escape').exitCode).not.toBe(0)
  expect(run('status','example','wrong').exitCode).not.toBe(0)
 } finally {fs.rmSync(root,{recursive:true,force:true})}
}, 30000)
