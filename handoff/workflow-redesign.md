# Handoff: implement P3 blocks + C1 inspector in the CRM workflow builder

Written 2026-10-08 at the end of the design session, right before the context was cleared.
The user explicitly asked to implement this in the CRM repo. Start by loading the
`frappe-design-preferences` skill and reading `~/frappe-mockup/DESIGN.md` (the spec).

## Approved designs (read these mockup sources, they are the reference implementation)

| What | Mockup source |
|---|---|
| Block P3 (markup + all CSS, states, animations) | `~/frappe-mockup/mockups/workflow-blocks-v3/BlockFolder.vue` (variant `hairline`), `samples.js` (`toneVars`) |
| Block on a VueFlow canvas (handles, add button offsets, layout spacing) | `~/frappe-mockup/mockups/workflow-flowchart-v2/P3Node.vue`, `flow.js`, `notes.md` |
| Inspector C1 | `~/frappe-mockup/mockups/workflow-inspector-v2/PanelShell.vue` (header), `PanelCollapsible.vue` with `look="divided"`, `ConditionTabs.vue`, `panel.css` |

Built files to compare against in a browser: `mockup.html` in each folder.

## Repo rules (from memory, do not skip)

- Repo: `~/frappe-bench/apps/crm`. Frontend in `frontend/`. Base branch `develop`.
- Current branch when this was written: `perf/cached-hierarchy-flag`, with the user's own
  uncommitted changes in `crm/permissions/org_hierarchy.py` and `test_org_hierarchy.py`.
  Do NOT touch, stash or commit those. Ask the user before switching branches; suggest a new
  branch `feat-workflow-builder-redesign` off `develop`.
- Never run build/typecheck. Tests: `cd frontend && yarn test:run` (all must pass).
- Don't commit unless asked. When committing: one commit per file, subject-only
  `feat:`/`fix:`/`style:` (no scope, no body, no co-author), run pre-commit first.
- No em dashes in code, comments or UI strings. Terse one-line comments only.
- Match surrounding code style; keep functions short.
- Verify in the browser (built-in browser pane): dev site `analytics.localhost`, Vite dev
  server on port 8080, builder at Settings > Automations. Last time the page loaded blank
  (likely not logged in); ask the user to log in rather than entering credentials.

## Target files

- `frontend/src/components/Settings/WorkflowAutomations/WorkflowFlow.vue`: node markup in the
  `#node-automation` slot + the `<style>` block
- `workflowIcons.js`: `ICON_TONES` (add `hue`), new `hueVars(hue)` helper
- `workflowSteps.js`: `COLUMN_WIDTH` 300 -> 320, `BRANCH_OFFSET` 108 -> 132 (block is ~111px tall vs 87)
- `WorkflowTrialRun.vue` `stepNode()`: pass `durationMs: outcome?.duration_ms` for the footer timing
- `WorkflowAutomationInspector.vue`: C1 panel (header + collapsible sections)
- `WorkflowStepEditor.vue`: split into C1 sections
- `WorkflowConditionEditor.vue`: replace `TabButtons` with `Tabs`/`TabList`/`TabTrigger`/`TabPanel`
  (underline, sm); keep its existing `CodeEditor language="python"` usage (the app resolves the
  local `apps/crm/frappe-ui` checkout, whose CodeEditor API differs from node_modules)
- `WorkflowAutomationBuilder.vue`: inspector container (`w-[340px]` card, `inspectorOpen`)

## Blocks: what an earlier attempt already worked out (it was reverted, redo it)

- `ICON_TONES` entries become `{ tone: 'text-ink-blue-5', hue: 'blue' }`. Everything spreads
  ICON_TONES (workflowTriggers.js, workflowIcons.js, TRIGGER_STYLE), so `data.hue` reaches nodes.
- `hueVars(hue = 'gray')` returns `--hue-bg: var(--surface-{hue}-1)`, `--hue-line: var(--outline-{hue}-3)`,
  `--hue-ink: var(--ink-{hue}-7)`, `--hue-dot: var(--ink-{hue}-6)`. Bind on the block wrapper.
- Wrapper `div.workflow-block relative w-[252px]` holds both Handles + the Combobox; classes from
  `blockClasses(id, data)`: `is-<status>`, `is-selected` (isOn), `is-empty`, `nodrag` (picksTrigger),
  `opacity-40` (dimmed / isFaded). Combobox `#trigger` slot = tab + card.
- Footer status from `nodeStatus(data)`: run status wins (`running`, `Success` Done, `Skipped`,
  `Failed`, `Waiting`), else empty -> Not set, error -> Has errors, incomplete -> Needs setup
  (wrap in Tooltip with the incomplete message), else Ready. Footer right: Forced badge if
  `data.forced`, else `formatDuration(data.durationMs)` (`120 ms` / `2.4 s`).
- Remove now-unused imports (ErrorIcon, IncompleteIcon, run icons, Spinner, RUN_ICONS/RUN_COLORS,
  nodeClasses/nodeSurface).
- Handles: `.workflow-port` becomes the 9px ring; `top: calc(50% + 10.5px)` to skip the tab;
  grow to 11px and take `--hue-dot` on hover/selected (animate width/height, not transform:
  vue-flow uses transform on handles).
- Add control after the last block: add `translate-y-[10.5px]`; arm buttons container:
  `top-[calc(50%+10.5px)]`.
- Keep dark-mode shadow stronger (existing `[data-theme='dark']` rule pattern).
- Check `frontend/tests/unit/workflowSteps|workflowGraph|workflowBlocks.test.js` still pass
  (they assert relative positions only).

## Inspector C1 mapping to real data

- Header: P3 tab on the panel top using the selected node's presentation
  (`stepPresentation(step)` in workflowGraph.js gives icon/kicker/label/detail + hue;
  trigger view uses `triggerDefinition(doc)` + TRIGGER_STYLE, kicker "Trigger").
  Close button collapses the inspector (builder's `inspectorOpen`); the more button can open a
  menu with Remove step (existing `request-remove` flow). Status strip shows the same status as
  the block (Ready / Needs setup with the incomplete text, etc.).
- Step view sections: Step (type + action, summary "Action · Send email"), the action's
  params (ParamEditor; title = action label), Only run when (ConditionEditor), Advanced
  (existing advanced fields). Collapsed summary = short text of what is set.
- Trigger view sections: Trigger (DocType + Event picker), Details (TriggerDetails, if any
  fields), Only start when (WorkflowFilters + ConditionEditor), Run as (run_as + automation user).
- Event picker sub-view (`choosingTrigger`) keeps working as today.
- Body neutral: no amber borders; missing required values show a gray "Required".
- Make a small `WorkflowInspectorSection.vue` (props: title, summary, defaultOpen) for the
  collapsible row rather than repeating markup.

## Done when

- Blocks and inspector match the mockups in dark and light mode on the real builder.
- Trial run states (running, done, failed, skipped, waiting, forced) render on blocks.
- `yarn test:run` passes; no console errors; user has seen it in the browser.
- Update `~/frappe-mockup/mockups/workflow-inspector-v2/notes.md` and
  `workflow-blocks-v3/notes.md` with what shipped.
