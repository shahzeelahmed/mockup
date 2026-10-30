<script setup>
import { Button, TabButtons } from 'frappe-ui'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { roundUrl } from './workspace.js'

defineProps({
  rounds: { type: Array, required: true },
})

const emit = defineEmits(['close', 'remove'])
const width = ref(1280)

const widths = [
  { value: 390, label: 'Mobile' },
  { value: 768, label: 'Tablet' },
  { value: 1280, label: 'Desktop' },
]

const onKeydown = (event) => {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <section class="fixed inset-0 z-40 flex flex-col bg-surface-gray-1" aria-label="Compare rounds">
    <header class="flex items-center gap-3 border-b border-outline-gray-2 bg-surface-base px-5 py-3">
      <h2 class="text-base-semibold text-ink-gray-8">Compare {{ rounds.length }} rounds</h2>
      <TabButtons v-model="width" :options="widths" class="ml-auto" />
      <Button icon="lucide-x" variant="ghost" tooltip="Close (Esc)" @click="emit('close')" />
    </header>

    <div class="flex flex-1 gap-4 overflow-auto p-5">
      <figure v-for="round in rounds" :key="round.slug" class="flex shrink-0 flex-col gap-2">
        <figcaption class="flex items-center gap-2">
          <span class="text-sm-medium text-ink-gray-8">{{ round.title }} v{{ round.version }}</span>
          <a :href="roundUrl(round)" target="_blank" class="text-xs text-ink-gray-5 hover:text-ink-gray-8">Open</a>
          <Button icon="lucide-x" variant="ghost" size="sm" class="ml-auto" :tooltip="`Remove ${round.slug}`" @click="emit('remove', round)" />
        </figcaption>

        <iframe
          :src="roundUrl(round)"
          :style="{ width: `${width}px` }"
          class="frame flex-1 rounded-6 border border-outline-gray-2 bg-surface-base"
          :title="round.slug"
        />
      </figure>
    </div>
  </section>
</template>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .frame {
    transition: width 180ms ease;
  }
}
</style>
