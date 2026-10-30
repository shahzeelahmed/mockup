<template>
  <Dialog v-model="open" :title="title" :size="mode === 'compare' || mode === 'preview' ? '7xl' : '3xl'">
    <template #default>
      <template v-if="mode === 'preview'"><p class="dialog-context">Round {{ round.version }} · {{ titleCase(round.status) }}</p><iframe class="full-preview" :src="previewUrl(round)" :title="`${round.title} preview`" @load="syncFrameTheme" /></template>
      <div v-else-if="mode === 'compare'" class="comparison">
        <section v-for="(_, index) in choices" :key="index">
          <FormControl type="select" variant="outline" :aria-label="`Comparison ${index + 1} round`" v-model="choices[index]" :options="roundOptions" />
          <iframe :src="`/mockups/${choices[index]}/mockup.html`" :title="`Comparison ${index + 1} preview`" @load="syncFrameTheme" />
        </section>
      </div>
      <div v-else-if="mode === 'notes'" class="notes-content"><p v-if="loading" role="status">Loading round notes…</p><p v-else-if="error" role="alert">{{ error }}</p><pre v-else>{{ notes }}</pre></div>
      <div v-else-if="mode === 'command'" class="command-content"><p>Run this in your Frappe Mockup folder to edit this round with live updates.</p><code>bun dev.mjs {{ round.slug }}</code><p v-if="round.customBuilder">This round has a custom builder. Use its local build instructions in the round notes.</p><Button :label="copied ? 'Copied' : 'Copy command'" icon-left="lucide-copy" @click="copyCommand" /><p v-if="error" role="alert">{{ error }}</p></div>
    </template>
  </Dialog>
</template>
<script setup>
import { computed, ref } from 'vue'
import { Button, Dialog, FormControl } from 'frappe-ui'
import { notesUrl, previewUrl, titleCase } from './data'
const props = defineProps({ theme: { type: String, default: 'dark' } })
const open = ref(false), mode = ref('preview'), round = ref(null), project = ref(null)
const choices = ref([]), notes = ref(''), error = ref(''), loading = ref(false), copied = ref(false)
let notesRequest = 0
const title = computed(() => mode.value === 'compare' ? `Compare ${project.value?.title}` : mode.value === 'notes' ? `Round ${round.value?.version} notes` : mode.value === 'command' ? 'Live preview' : titleCase(round.value?.title || 'Preview'))
const roundOptions = computed(() => project.value?.history.filter(item => item.built).map(item => ({ value: item.slug, label: `Round ${item.version} · ${titleCase(item.status)}` })) || [])
function show(nextMode, item) {
  mode.value = nextMode; error.value = ''; copied.value = false
  if (nextMode === 'compare') {
    project.value = item
    choices.value = item.history.filter(entry => entry.built).slice(0, 2).map(entry => entry.slug)
  } else round.value = item
  open.value = true
  if (nextMode === 'notes') loadNotes(item)
}
async function loadNotes(item) {
  const request = ++notesRequest
  loading.value = true; notes.value = ''
  try {
    const response = await fetch(notesUrl(item))
    if (!response.ok || response.headers.get('content-type')?.includes('text/html')) throw new Error('Notes unavailable')
    const text = await response.text()
    if (request === notesRequest) notes.value = text
  } catch (exception) {
    if (request === notesRequest) error.value = 'Could not load these notes. Try reopening them.'
    console.error('Could not load round notes', exception)
  } finally { if (request === notesRequest) loading.value = false }
}
async function copyCommand() {
  try { await navigator.clipboard.writeText(`bun dev.mjs ${round.value.slug}`); copied.value = true }
  catch { error.value = 'Copy unavailable. Select the command above to copy it.' }
}
function syncFrameTheme(event) { event.target.contentDocument?.documentElement.setAttribute('data-theme', props.theme) }
defineExpose({ show })
</script>
