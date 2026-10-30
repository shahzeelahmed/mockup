export const descriptions = {
  'guided-setup': 'Email connection, lead import, and team setup in one guided flow.',
  'setup-preview-premium': 'Browser previews for email, leads, and team setup.',
  'workflow-inspector': 'Step settings, conditions, and execution details in a focused panel.',
  'workflow-blocks': 'Workflow steps with clear identity, connections, and execution states.',
  'command-palette': 'Search, navigation, and actions using the actual CRM command palette.',
  'lead-deal-workspace': 'Record context, recent activity, and the next action in one workspace.',
  'workflow-flowchart': 'Connected workflow steps on a canvas with pan and zoom.',
  'stepper': 'Progress and execution states for guided flows and run logs.',
  'guided-setup-impl': 'The guided setup flow using the real CRM PR components.',
  'deal-data-refinement': 'Deal fields and contextual panels with progressive disclosure.',
  'questionnaire-skip-button': 'Placement explorations for skipping the setup questionnaire.',
}
export const order = ['guided-setup', 'setup-preview-premium', 'workflow-inspector', 'workflow-blocks', 'command-palette', 'lead-deal-workspace']
export const statuses = ['exploring', 'selected', 'superseded', 'implemented']
export const statusOptions = [{ label: 'All statuses', value: '' }, ...statuses.map(value => ({ label: value[0].toUpperCase() + value.slice(1), value }))]
export const previewConfig = {
  'guided-setup': { selector: '[class~="h-[800px]"]', width: 1280, height: 800 },
  'setup-preview-premium': { selector: '.scene', width: 680, height: 640 },
  'workflow-inspector': { selector: 'section:nth-of-type(2) .panels-canvas', width: 850, height: 610 },
  'workflow-blocks': { selector: 'section:nth-of-type(6) .blocks-canvas', width: 1200, height: 660 },
  'command-palette': { selector: '[role="dialog"]', width: 680, height: 450 },
  'lead-deal-workspace': { selector: '.app-shell', width: 1280, height: 800 },
  'workflow-flowchart': { selector: 'section:nth-of-type(2) .vue-flow', width: 1280, height: 720 },
  'stepper': { selector: '.stepper', width: 1100, height: 700 },
}
export const previewUrl = round => `/mockups/${encodeURIComponent(round.slug)}/mockup.html`
export const notesUrl = round => `/mockups/${encodeURIComponent(round.slug)}/notes.md`
export const titleCase = text => text.replace(/\b\w/g, char => char.toUpperCase())

export function groupProjects(rounds) {
  const groups = new Map()
  for (const round of rounds) {
    if (round.project === 'design-workspace') continue
    if (!groups.has(round.project)) groups.set(round.project, [])
    groups.get(round.project).push(round)
  }
  return [...groups.entries()].map(([id, history]) => makeProject(id, history))
    .sort((a, b) => rank(a.id) - rank(b.id) || a.title.localeCompare(b.title))
}
function rank(id) { return order.includes(id) ? order.indexOf(id) : order.length }
function makeProject(id, history) {
  history.sort((a, b) => b.version - a.version)
  const current = history.find(round => round.status === 'selected') || history[0]
  return { id, history, current, title: titleCase(current.title), description: descriptions[id] || current.objective || 'Explore the latest design and its saved iterations.' }
}
