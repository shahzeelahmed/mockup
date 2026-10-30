<script setup>
import { Badge, Dialog, Select, TextInput } from 'frappe-ui'
import { computed, ref } from 'vue'
import { inspoImageUrl, inspos } from './workspace.js'

const query = ref('')
const tag = ref('all')
const preview = ref(null)

const tags = computed(() => {
  const all = [...new Set(inspos.flatMap((inspo) => inspo.tags))].toSorted()

  return [{ value: 'all', label: 'All tags' }, ...all.map((value) => ({ value, label: value }))]
})

const visible = computed(() => {
  const text = query.value.trim().toLowerCase()

  return inspos.filter((inspo) => {
    const haystack = [inspo.title, inspo.url, inspo.notes, ...inspo.tags].join(' ').toLowerCase()

    return (tag.value === 'all' || inspo.tags.includes(tag.value)) && haystack.includes(text)
  })
})

const hostname = (url) => new URL(url).hostname.replace(/^www\./, '')
</script>

<template>
  <section class="flex flex-col gap-5">
    <div class="flex flex-wrap items-center gap-2">
      <TextInput v-model="query" placeholder="Search inspos" class="w-64">
        <template #prefix>
          <LucideSearch class="size-4 text-ink-gray-4" />
        </template>
      </TextInput>

      <Select v-model="tag" :options="tags" class="w-40" />
      <span class="ml-auto text-sm text-ink-gray-5">{{ visible.length }} of {{ inspos.length }}</span>
    </div>

    <div v-if="!inspos.length" class="flex flex-col items-center gap-1.5 rounded-6 border border-dashed border-outline-gray-2 px-6 py-16 text-center">
      <span class="text-base-medium text-ink-gray-7">No inspos yet</span>
      <p class="max-w-sm text-p-sm text-ink-gray-5">Share an image or link in chat and say "save as inspo".</p>
    </div>

    <p v-else-if="!visible.length" class="py-16 text-center text-sm text-ink-gray-5">Nothing matches that search</p>

    <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
      <article
        v-for="(inspo, index) in visible"
        :key="inspo.slug"
        class="enter flex flex-col overflow-hidden rounded-6 border border-outline-gray-2 bg-surface-base"
        :style="{ '--i': index }"
      >
        <button
          v-if="inspo.image"
          class="h-44 overflow-hidden border-b border-outline-gray-2 bg-surface-gray-1"
          :aria-label="`View ${inspo.title} full size`"
          @click="preview = inspo"
        >
          <img :src="inspoImageUrl(inspo)" alt="" class="size-full object-cover object-top" loading="lazy" />
        </button>

        <div class="flex flex-1 flex-col gap-2 px-3 py-3">
          <h3 class="text-sm-medium text-ink-gray-8">{{ inspo.title }}</h3>
          <p v-if="inspo.notes" class="line-clamp-3 text-p-xs text-ink-gray-6">{{ inspo.notes }}</p>

          <div class="mt-auto flex flex-wrap items-center gap-1 pt-1">
            <Badge v-for="name in inspo.tags.filter((name) => name !== 'inspos')" :key="name" :label="name" size="sm" />

            <a
              v-if="inspo.url"
              :href="inspo.url"
              target="_blank"
              rel="noopener noreferrer"
              class="ml-auto flex items-center gap-1 text-xs text-ink-gray-5 hover:text-ink-gray-8"
            >
              {{ hostname(inspo.url) }}
              <LucideArrowUpRight class="size-3" />
            </a>
          </div>
        </div>
      </article>
    </div>

    <Dialog :open="Boolean(preview)" :title="preview?.title" size="5xl" @update:open="preview = null">
      <img v-if="preview" :src="inspoImageUrl(preview)" :alt="preview.title" class="w-full rounded-4" />
    </Dialog>
  </section>
</template>
