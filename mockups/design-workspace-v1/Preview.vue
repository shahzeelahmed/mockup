<template>
  <div ref="host" class="design-cover" :class="{ ready }" aria-hidden="true" inert>
    <iframe v-if="visible && round.built" :key="round.slug" ref="frame" :src="previewUrl(round)"
      :title="`${round.title} cover`" tabindex="-1" loading="lazy" @load="prepare" />
    <div v-if="!ready" class="cover-loading"><span class="lucide-image size-5" /><span>{{ round.built ? 'Loading preview' : 'Preview not built' }}</span></div>
  </div>
</template>
<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { previewConfig, previewUrl } from './data'
const props = defineProps({ round: { type: Object, required: true }, theme: { type: String, default: 'dark' } })
const host = ref(null), frame = ref(null), visible = ref(false), ready = ref(false)
let observer, resizer
function syncTheme() {
  const doc = frame.value?.contentDocument
  if (!doc) return
  doc.documentElement.setAttribute('data-theme', props.theme)
  doc.documentElement.style.colorScheme = props.theme
}
function fit() {
  const config = previewConfig[props.round.project] || { width: 1280, height: 800 }
  if (!frame.value || !host.value) return
  const scale = Math.min(host.value.clientWidth / config.width, host.value.clientHeight / config.height)
  Object.assign(frame.value.style, { width: `${config.width}px`, height: `${config.height}px`, transform: `scale(${scale})`, left: `${(host.value.clientWidth - config.width * scale) / 2}px`, top: `${(host.value.clientHeight - config.height * scale) / 2}px` })
}
function isolate(doc, target, config) {
  for (const child of doc.body.children) child.style.visibility = 'hidden'
  Object.assign(doc.body.style, { margin: '0', padding: '0', overflow: 'hidden', background: 'var(--surface-base)' })
  Object.assign(target.style, { position: 'fixed', visibility: 'visible', inset: '0 auto auto 0', margin: '0', width: `${config.width}px`, maxWidth: 'none', height: `${config.height}px`, border: '0', borderRadius: '0', transform: 'none' })
}
function prepare() {
  try {
    const doc = frame.value.contentDocument
    const config = previewConfig[props.round.project] || { width: 1280, height: 800 }
    const target = config.selector && doc.querySelector(config.selector)
    if (target) isolate(doc, target, config)
    if (target && props.round.project === 'workflow-blocks') Object.assign(target.style, { alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap' })
    syncTheme()
    fit()
    ready.value = true
  } catch (error) { console.error('Could not prepare design cover', error) }
}
watch(() => props.theme, syncTheme)
onMounted(() => {
  observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) visible.value = true }, { rootMargin: '150px' })
  observer.observe(host.value)
  resizer = new ResizeObserver(fit)
  resizer.observe(host.value)
})
onUnmounted(() => { observer?.disconnect(); resizer?.disconnect() })
</script>
