<script setup>
import { Button, Dialog, TabButtons, TextInput, useColorScheme } from 'frappe-ui'
import { computed, ref } from 'vue'
import CompareView from './CompareView.vue'
import InsposView from './InsposView.vue'
import RoundCard from './RoundCard.vue'
import { groupProjects, inspos, roundUrl, rounds, statuses } from './workspace.js'

const { resolvedColorScheme, toggleColorScheme } = useColorScheme()
const tab = ref('rounds')
const query = ref('')
const status = ref('all')
const sort = ref('newest')
const comparing = ref([])
const compareOpen = ref(false)
const detail = ref(null)
const confirmingDelete = ref(false)
const deleting = ref(false)
const deleteError = ref('')

const deleteRound = async () => {
  deleting.value = true
  deleteError.value = ''

  const response = await fetch(`/mockups/api/rounds/${detail.value.slug}`, { method: 'DELETE' }).catch(() => null)

  if (response?.ok) return location.reload()

  deleting.value = false
  deleteError.value = response ? await response.text() : 'Deleting needs the dev server (bun dev.mjs).'
}

const closeDetail = () => {
  detail.value = null
  confirmingDelete.value = false
  deleteError.value = ''
}

const tabs = computed(() => [
  { value: 'rounds', label: `Rounds ${rounds.length}` },
  { value: 'inspos', label: `Inspos ${inspos.length}` },
])

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'A–Z' },
]

const statusOptions = [
  { value: 'all', label: 'All' },
  ...Object.entries(statuses).map(([value, { label }]) => ({ value, label })),
]

const projects = computed(() => {
  const text = query.value.trim().toLowerCase()

  return groupProjects(rounds)
    .filter((project) =>
      project.rounds.some((round) => {
        const haystack = [round.title, round.slug, round.project, round.objective, round.feedback].join(' ').toLowerCase()

        return (status.value === 'all' || round.status === status.value) && haystack.includes(text)
      }),
    )
    .toSorted((a, b) => (sort.value === 'newest' ? b.createdAt - a.createdAt : a.title.localeCompare(b.title)))
})

const toggleCompare = (round) => {
  const index = comparing.value.findIndex((item) => item.slug === round.slug)

  if (index === -1) comparing.value.push(round)
  else comparing.value.splice(index, 1)
}

const removeFromCompare = (round) => {
  toggleCompare(round)

  if (comparing.value.length < 2) compareOpen.value = false
}

const describe = (item) => (typeof item === 'string' ? item : (item.label ?? item.name ?? item.title ?? JSON.stringify(item)))
const isComparing = (round) => comparing.value.some((item) => item.slug === round.slug)
</script>

<template>
  <div class="fixed inset-0 overflow-y-auto bg-surface-base">
    <header class="sticky top-0 z-30 border-b border-outline-gray-2 bg-surface-base/90 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
        <h1 class="flex items-center gap-2 text-lg-medium text-ink-gray-8">
          <span class="grid size-6 place-items-center rounded-3 bg-surface-gray-9 text-ink-base">
            <span class="lucide-pen-tool size-3.5" aria-hidden="true" />
          </span>
          Design workspace
        </h1>

        <TabButtons v-model="tab" :options="tabs" class="ml-auto" />

        <Button
          :icon="resolvedColorScheme === 'dark' ? 'lucide-sun' : 'lucide-moon'"
          :tooltip="resolvedColorScheme === 'dark' ? 'Light theme' : 'Dark theme'"
          @click="toggleColorScheme"
        />
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-6 py-6">
      <InsposView v-if="tab === 'inspos'" />

      <section v-else class="flex flex-col gap-6">
        <div class="flex flex-wrap items-center gap-2">
          <TextInput v-model="query" placeholder="Search rounds" class="w-64">
            <template #prefix>
              <LucideSearch class="size-4 text-ink-gray-4" />
            </template>
          </TextInput>

          <TabButtons v-model="status" :options="statusOptions" class="ml-auto" />
          <TabButtons v-model="sort" :options="sortOptions" />

          <template v-if="comparing.length">
            <Button variant="ghost" label="Clear" @click="comparing = []" />

            <Button
              variant="solid"
              icon-left="lucide-columns-2"
              :label="`Compare ${comparing.length}`"
              :disabled="comparing.length < 2"
              :tooltip="comparing.length < 2 ? 'Pick at least two built rounds' : undefined"
              @click="compareOpen = true"
            />
          </template>
        </div>

        <div v-if="!rounds.length" class="flex flex-col items-center gap-1.5 rounded-6 border border-dashed border-outline-gray-2 px-6 py-16 text-center">
          <span class="text-base-medium text-ink-gray-7">No rounds yet</span>

          <p class="max-w-sm text-p-sm text-ink-gray-5">
            Add a folder with a Mockup.vue under mockups/, then run bun manage.mjs index.
          </p>
        </div>

        <p v-else-if="!projects.length" class="py-16 text-center text-sm text-ink-gray-5">No projects match these filters</p>

        <TransitionGroup v-if="projects.length" tag="div" name="grid" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <RoundCard
            v-for="(project, index) in projects"
            :key="project.name"
            :round="project.selected ?? project.rounds[0]"
            :rounds="project.rounds"
            :comparing="isComparing(project.selected ?? project.rounds[0])"
            class="enter"
            :style="{ '--i': index }"
            @open="detail = $event"
            @toggle-compare="toggleCompare"
          />
        </TransitionGroup>
      </section>
    </main>

    <Dialog :open="Boolean(detail)" :title="detail ? `${detail.title} v${detail.version}` : ''" size="xl" @update:open="closeDetail">
      <dl v-if="detail" class="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3">
        <dt class="text-sm text-ink-gray-5">Status</dt>

        <dd class="flex items-center gap-1.5 text-sm text-ink-gray-8">
          <span class="size-1.5 rounded-full" :class="statuses[detail.status]?.dot ?? 'bg-surface-gray-5'" />
          {{ statuses[detail.status]?.label ?? detail.status }}
        </dd>

        <dt class="text-sm text-ink-gray-5">Folder</dt>
        <dd class="text-sm text-ink-gray-8">mockups/{{ detail.slug }}</dd>

        <template v-if="detail.parent">
          <dt class="text-sm text-ink-gray-5">Forked from</dt>
          <dd class="text-sm text-ink-gray-8">{{ detail.parent }}</dd>
        </template>

        <template v-if="detail.selectedVariant">
          <dt class="text-sm text-ink-gray-5">Chosen variant</dt>
          <dd class="text-sm text-ink-gray-8">{{ detail.selectedVariant }}</dd>
        </template>

        <dt class="text-sm text-ink-gray-5">Objective</dt>
        <dd class="whitespace-pre-line text-p-sm text-ink-gray-8">{{ detail.objective || 'None yet' }}</dd>

        <template v-if="detail.feedback">
          <dt class="text-sm text-ink-gray-5">Feedback</dt>
          <dd class="whitespace-pre-line text-p-sm text-ink-gray-8">{{ detail.feedback }}</dd>
        </template>

        <template v-if="detail.variants?.length">
          <dt class="text-sm text-ink-gray-5">Variants</dt>

          <dd>
            <ul class="flex flex-col gap-1 text-p-sm text-ink-gray-8">
              <li v-for="variant in detail.variants" :key="describe(variant)">{{ describe(variant) }}</li>
            </ul>
          </dd>
        </template>

        <template v-if="detail.sources?.length">
          <dt class="text-sm text-ink-gray-5">Sources</dt>

          <dd>
            <ul class="flex flex-col gap-1 text-p-sm text-ink-gray-8">
              <li v-for="source in detail.sources" :key="describe(source)" class="break-all">{{ describe(source) }}</li>
            </ul>
          </dd>
        </template>
      </dl>

      <template #actions>
        <p v-if="deleteError" class="mb-3 text-p-sm text-ink-red-5">{{ deleteError }}</p>

        <div v-if="detail && confirmingDelete" class="flex items-center justify-end gap-2">
          <span class="mr-auto text-p-sm text-ink-gray-6">Move {{ detail.slug }} to .trash?</span>
          <Button variant="ghost" label="Cancel" @click="confirmingDelete = false" />
          <Button variant="solid" theme="red" label="Delete" :loading="deleting" @click="deleteRound" />
        </div>

        <div v-else-if="detail" class="flex justify-end gap-2">
          <Button
            class="mr-auto"
            theme="red"
            variant="ghost"
            icon-left="lucide-trash-2"
            label="Delete"
            @click="confirmingDelete = true"
          />

          <Button
            v-if="detail.built"
            :label="isComparing(detail) ? 'Remove from compare' : 'Add to compare'"
            @click="toggleCompare(detail)"
          />

          <Button v-if="detail.built" variant="solid" label="Open mockup" icon-right="lucide-arrow-up-right" :href="roundUrl(detail)" />
          <span v-else class="text-sm text-ink-gray-5">Run bun build.mjs {{ detail.slug }} to build it</span>
        </div>
      </template>
    </Dialog>

    <CompareView v-if="compareOpen" :rounds="comparing" @close="compareOpen = false" @remove="removeFromCompare" />
  </div>
</template>

<style>
@media (prefers-reduced-motion: no-preference) {
  .enter {
    animation: enter 220ms ease-out both;
    animation-delay: calc(min(var(--i), 8) * 30ms);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .grid-move,
  .grid-enter-active,
  .grid-leave-active {
    transition:
      transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1),
      opacity 220ms ease,
      scale 220ms ease;
  }

  .grid-enter-from,
  .grid-leave-to {
    opacity: 0;
    scale: 0.97;
  }

  .grid-leave-active {
    display: none;
  }
}

@keyframes enter {
  from {
    opacity: 0;
    translate: 0 4px;
  }
}
</style>
