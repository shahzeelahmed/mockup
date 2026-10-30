<script setup>
import { Checkbox, useColorScheme } from 'frappe-ui'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { roundUrl, statuses, thumbnailUrl } from './workspace.js'

defineProps({
  round: { type: Object, required: true },
  rounds: { type: Array, default: () => [] },
  comparing: { type: Boolean, default: false },
})

const emit = defineEmits(['open', 'toggle-compare'])
const thumbnailFailed = ref(false)
const cover = ref(null)
const scale = ref(0.22)
const observer = new ResizeObserver(([entry]) => (scale.value = entry.contentRect.width / 1280))

onMounted(() => cover.value && observer.observe(cover.value))

const frame = ref(null)
const { resolvedColorScheme } = useColorScheme()

const syncTheme = () => frame.value?.contentDocument?.documentElement.setAttribute('data-theme', resolvedColorScheme.value)

const loaded = ref(false)

const onFrameLoad = () => {
  syncTheme()
  loaded.value = true
}

watch(resolvedColorScheme, syncTheme)
onBeforeUnmount(() => observer.disconnect())

const units = [
  ['day', 86400000],
  ['hour', 3600000],
  ['minute', 60000],
]

const relative = (time) => {
  const diff = time - Date.now()
  const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const unit = units.find(([, size]) => Math.abs(diff) >= size)

  return unit ? format.format(Math.round(diff / unit[1]), unit[0]) : 'just now'
}
</script>

<template>
  <article
    class="card group relative flex flex-col overflow-hidden rounded-5 border bg-surface-base"
    :class="round.status === 'selected' ? 'border-outline-gray-4' : 'border-outline-gray-2 hover:border-outline-gray-3'"
  >
    <div
      ref="cover"
      class="relative aspect-[16/10] overflow-hidden border-b border-outline-gray-1 bg-surface-gray-1"
      :class="{ 'animate-pulse': round.built && !round.thumbnail && !loaded }"
    >
      <div class="preview size-full origin-top">
        <img
          v-if="round.thumbnail && !thumbnailFailed"
          :src="thumbnailUrl(round)"
          alt=""
          class="size-full object-cover object-top"
          loading="lazy"
          @error="thumbnailFailed = true"
        />

        <iframe
          v-else-if="round.built"
          ref="frame"
          :src="roundUrl(round)"
          class="cover-frame pointer-events-none origin-top-left border-0 transition-opacity duration-300"
          :class="loaded ? 'opacity-100' : 'opacity-0'"
          :style="{ scale }"
          loading="lazy"
          tabindex="-1"
          inert
          :title="`${round.title} v${round.version} preview`"
          @load="onFrameLoad"
        />

        <div v-else class="flex size-full flex-col items-center justify-center gap-1.5">
          <span class="text-sm text-ink-gray-5">Not built yet</span>
          <code class="text-xs text-ink-gray-4">bun build.mjs {{ round.slug }}</code>
        </div>
      </div>

      <Checkbox
        v-if="round.built"
        :model-value="comparing"
        class="absolute right-2.5 top-2.5 z-10 rounded-3 bg-surface-base p-1 shadow-sm transition-opacity"
        :class="comparing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'"
        :aria-label="`Compare ${round.slug}`"
        @update:model-value="emit('toggle-compare', round)"
      />
    </div>

    <div class="flex flex-col gap-1.5 p-3.5">
      <div class="flex items-center gap-2">
        <a
          v-if="round.built"
          :href="roundUrl(round)"
          class="truncate text-base-medium capitalize text-ink-gray-8 after:absolute after:inset-0 focus-visible:outline-none"
        >
          {{ round.title }}
        </a>

        <button
          v-else
          class="truncate text-base-medium capitalize text-ink-gray-8 after:absolute after:inset-0 focus-visible:outline-none"
          @click="emit('open', round)"
        >
          {{ round.title }}
        </button>

        <button
          class="relative z-10 ml-auto grid size-5 shrink-0 place-items-center rounded-3 text-ink-gray-5 opacity-0 hover:text-ink-gray-8 focus-visible:opacity-100 group-hover:opacity-100"
          :aria-label="`Details for ${round.slug}`"
          @click="emit('open', round)"
        >
          <span class="lucide-info size-3.5" aria-hidden="true" />
        </button>

        <span class="flex shrink-0 items-center gap-1.5 text-xs text-ink-gray-6">
          <span class="size-1.5 rounded-full" :class="statuses[round.status]?.dot ?? 'bg-surface-gray-5'" />
          {{ statuses[round.status]?.label ?? round.status }}
        </span>
      </div>

      <p class="text-sm text-ink-gray-5">
        v{{ round.version }}
        <template v-if="round.createdAt">· {{ relative(round.createdAt) }}</template>
      </p>

      <p v-if="round.objective" class="line-clamp-2 text-p-sm text-ink-gray-6">{{ round.objective }}</p>

      <div v-if="rounds.length > 1" class="relative z-10 flex flex-wrap gap-1 pt-1.5">
        <a
          v-for="item in rounds"
          :key="item.slug"
          :href="item.built ? roundUrl(item) : undefined"
          class="rounded-3 px-1.5 py-0.5 text-xs tabular-nums"
          :class="item.slug === round.slug ? 'bg-surface-gray-3 text-ink-gray-8' : 'text-ink-gray-5 hover:text-ink-gray-8'"
          @click="!item.built && emit('open', item)"
        >
          v{{ item.version }}
        </a>
      </div>
    </div>
  </article>
</template>

<style scoped>
.cover-frame {
  width: 1280px;
  height: 800px;
}

.card:has(a:focus-visible, button:focus-visible) {
  outline: 2px solid var(--outline-gray-4);
  outline-offset: 2px;
}

.card:active {
  scale: 0.99;
}

@media (prefers-reduced-motion: no-preference) {
  .preview {
    transition: scale 300ms ease;
  }

  .card:hover .preview {
    scale: 1.03;
  }

  .card {
    transition:
      translate 200ms ease,
      scale 150ms ease,
      border-color 150ms ease;
  }

  .card:hover {
    translate: 0 -2px;
  }
}
</style>
