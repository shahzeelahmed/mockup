<template>
  <div class="design-workspace">
    <header class="workspace-header">
      <div class="workspace-heading"><h1>Design workspace</h1><Tabs v-model="collection"><TabList variant="underline" size="sm"><TabTrigger value="designs">Designs</TabTrigger><TabTrigger value="inspos">Inspos</TabTrigger></TabList></Tabs></div>
      <Tabs v-model="theme" aria-label="Color theme"><TabList variant="subtle" size="sm"><TabTrigger value="dark">Dark</TabTrigger><TabTrigger value="light">Light</TabTrigger></TabList></Tabs>
    </header>
    <main class="workspace-main">
      <div class="workspace-toolbar">
        <div class="search-control"><FormControl ref="searchInput" v-model="search" variant="outline" size="md" :placeholder="collection === 'designs' ? 'Find a project or round…' : 'Find inspiration…'" aria-label="Search workspace"><template #prefix><span class="lucide-search size-4 text-ink-gray-5" /></template></FormControl></div>
        <p class="workspace-count" role="status">{{ collection === 'designs' ? `${visibleProjects.length} ${visibleProjects.length === 1 ? 'project' : 'projects'} · ${roundCount} saved rounds` : `${visibleInspos.length} inspirations` }}</p>
        <div v-if="collection === 'designs'" class="status-control"><FormControl v-model="status" type="select" variant="outline" size="md" :options="statusOptions" aria-label="Filter status" /></div>
      </div>
      <div v-if="collection === 'designs' && visibleProjects.length" class="project-grid">
        <ProjectCard v-for="(project, index) in visibleProjects" :key="project.id" :project="project" :theme="theme" :index="index" @preview="show('preview', $event)" @compare="show('compare', $event)" @notes="show('notes', $event)" @command="show('command', $event)" />
      </div>
      <div v-else-if="collection === 'inspos' && visibleInspos.length" class="project-grid">
        <article v-for="inspo in visibleInspos" :key="inspo.slug" class="inspo-card"><a v-if="inspo.image" :href="inspoUrl(inspo)"><img :src="inspoUrl(inspo)" :alt="inspo.title" loading="lazy" /></a><div class="project-content"><h2>{{ inspo.title }}</h2><p>{{ inspo.notes }}</p><p class="inspo-tags">{{ inspo.tags?.join(' · ') }}</p><Button v-if="inspo.url" label="Open source" :href="inspo.url" variant="outline" /></div></article>
      </div>
      <section v-else class="workspace-empty"><span :class="collection === 'inspos' ? 'lucide-bookmark' : 'lucide-search'" class="size-6" /><h2>{{ collection === 'inspos' && !inspos.length ? 'A place for your inspiration' : 'No matches' }}</h2><p>{{ collection === 'inspos' && !inspos.length ? 'Share an image or link in chat and ask to save it as inspiration.' : 'Try another search or clear the filters.' }}</p><Button v-if="search || status" label="Clear filters" variant="outline" @click="search = ''; status = ''" /></section>
    </main>
    <WorkspaceDialogs ref="dialogs" :theme="theme" />
  </div>
</template>
<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Button, FormControl, Tabs, TabList, TabTrigger } from 'frappe-ui'
import ProjectCard from './ProjectCard.vue'
import WorkspaceDialogs from './WorkspaceDialogs.vue'
import { groupProjects, statusOptions } from './data'
import snapshot from './snapshot.json'
import './workspace.css'
const rounds = window.__DESIGN_ROUNDS__ || snapshot.rounds
const inspos = window.__DESIGN_INSPOS__ || snapshot.inspos
const theme = ref(localStorage.getItem('design-workspace-theme') || 'dark')
const collection = ref('designs'), search = ref(''), status = ref(''), dialogs = ref(null), searchInput = ref(null)
const projects = groupProjects(rounds)
const visibleProjects = computed(() => projects.filter(matchesProject))
const roundCount = computed(() => visibleProjects.value.reduce((count, project) => count + project.history.length, 0))
const visibleInspos = computed(() => inspos.filter(item => [item.title, item.notes, ...(item.tags || [])].join(' ').toLowerCase().includes(search.value.toLowerCase())))
function matchesProject(project) {
  const query = search.value.trim().toLowerCase()
  return project.history.some(round => (!status.value || round.status === status.value) && [project.title, project.description, round.slug, round.objective, round.feedback].join(' ').toLowerCase().includes(query))
}
function show(mode, item) { dialogs.value.show(mode, item) }
function inspoUrl(item) { return `/inspos/${encodeURIComponent(item.slug)}/${encodeURIComponent(item.image)}` }
function setTheme(value) {
  document.documentElement.setAttribute('data-theme', value)
  document.documentElement.style.colorScheme = value
  localStorage.setItem('design-workspace-theme', value)
}
function onKey(event) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault()
    document.querySelector('[aria-label="Search workspace"]')?.focus()
  }
}
watch(theme, setTheme, { immediate: true })
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>
