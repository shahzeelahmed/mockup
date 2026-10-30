<template>
  <article class="project-card" :aria-labelledby="`title-${project.id}`" :style="{ '--entry-delay': `${Math.min(index, 5) * 35}ms` }">
    <a class="cover-link" :href="previewUrl(project.current)" :aria-label="`Open ${project.title} preview`" @click.prevent="$emit('preview', project.current)">
      <Preview :round="project.current" :theme="theme" />
      <span class="cover-open"><span class="lucide-arrow-up-right size-4" />Open preview</span>
    </a>
    <div class="project-content">
      <div class="project-title-row">
        <h2 :id="`title-${project.id}`">{{ project.title }}</h2>
        <button class="history-toggle quiet-link" :aria-expanded="expanded" :aria-controls="`history-${project.id}`" @click="expanded = !expanded">
          {{ project.history.length }} {{ project.history.length === 1 ? 'round' : 'rounds' }}<span class="lucide-chevron-right size-3" :class="{ rotated: expanded }" />
        </button>
      </div>
      <p class="project-meta"><span>Round {{ project.current.version }}</span><span class="meta-divider">·</span><span class="status-dot" :class="project.current.status" />{{ titleCase(project.current.status) }}<span v-if="project.current.selectedVariant" class="selected-variant">{{ project.current.selectedVariant }}</span></p>
      <p class="project-description">{{ project.description }}</p>
      <div class="project-actions">
        <Button label="Open preview" variant="solid" @click="$emit('preview', project.current)" :disabled="!project.current.built" />
        <Button label="Compare" variant="outline" :disabled="project.history.filter(round => round.built).length < 2" @click="$emit('compare', project)" />
        <Dropdown :options="menu" align="end"><Button icon="lucide-ellipsis" variant="ghost" :aria-label="`More options for ${project.title}`" /></Dropdown>
      </div>
    </div>
    <div v-if="expanded" :id="`history-${project.id}`" class="project-history">
      <div v-for="round in project.history" :key="round.slug" class="history-row">
        <div><button class="quiet-link round-name" @click="$emit('preview', round)" :disabled="!round.built">Round {{ round.version }}<span v-if="round.slug === project.current.slug" class="current-label">Current</span></button><span class="round-status"><span class="status-dot" :class="round.status" />{{ titleCase(round.status) }}</span></div>
        <Button label="Notes" variant="ghost" @click="$emit('notes', round)" />
      </div>
    </div>
  </article>
</template>
<script setup>
import { computed, ref } from 'vue'
import { Button, Dropdown } from 'frappe-ui'
import Preview from './Preview.vue'
import { previewUrl, titleCase } from './data'
const props = defineProps({ project: { type: Object, required: true }, theme: { type: String, default: 'dark' }, index: { type: Number, default: 0 } })
const emit = defineEmits(['preview', 'compare', 'notes', 'command'])
const expanded = ref(false)
const menu = computed(() => [
  { label: 'Round notes', icon: 'lucide-file-text', onClick: () => emit('notes', props.project.current) },
  { label: expanded.value ? 'Hide saved rounds' : 'Show saved rounds', icon: 'lucide-history', onClick: () => expanded.value = !expanded.value },
  { label: 'Live preview command', icon: 'lucide-terminal', onClick: () => emit('command', props.project.current) },
])
</script>
