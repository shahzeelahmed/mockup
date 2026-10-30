const snapshots = import.meta.glob('./snapshot.json', { eager: true, import: 'default' })
const snapshot = snapshots['./snapshot.json'] ?? { rounds: [], inspos: [] }

export const rounds = (window.__DESIGN_ROUNDS__ ?? snapshot.rounds).filter((round) => round.slug !== 'design-workspace-v1')
export const inspos = window.__DESIGN_INSPOS__ ?? snapshot.inspos

const mockupsIndex = location.pathname.indexOf('/mockups/')
const base = mockupsIndex === -1 ? '/mockups/' : location.pathname.slice(0, mockupsIndex + '/mockups/'.length)

export const roundUrl = (round) => `${base}${round.slug}/mockup.html`
export const thumbnailUrl = (round) => `${base}${round.slug}/thumbnail.png`
export const inspoImageUrl = (inspo) => `${base}../inspos/${inspo.slug}/${inspo.image}`

export const statuses = {
  exploring: { label: 'Exploring', dot: 'bg-surface-blue-5' },
  selected: { label: 'Selected', dot: 'bg-surface-green-5' },
  superseded: { label: 'Superseded', dot: 'bg-surface-gray-5' },
  implemented: { label: 'Implemented', dot: 'bg-surface-violet-5' },
}

export const groupProjects = (list) => {
  const projects = new Map()

  for (const round of list) {
    if (!projects.has(round.project)) projects.set(round.project, [])
    projects.get(round.project).push(round)
  }

  return [...projects].map(([name, items]) => {
    const sorted = items.toSorted((a, b) => b.version - a.version)

    return {
      name,
      title: sorted[0].title,
      rounds: sorted,
      selected: sorted.find((round) => round.status === 'selected'),
      createdAt: Math.max(...items.map((round) => round.createdAt ?? 0)),
    }
  })
}
