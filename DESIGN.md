# Design preferences (Frappe CRM / frappe-ui)

Source of truth for the user's visual taste. Learned from the workflow-builder
iterations (Oct 2026). Approved references:

- Block: `mockups/workflow-blocks-v3/` (P3) and in context `mockups/workflow-flowchart-v2/`
- Inspector side panel: `mockups/workflow-inspector-v2/` (C1)

## Taste

- Prefer less colors since usually
- Make the UI keeping UX in mind
  - Think which components to use
  - Think what we can re-use from frappe-ui
  - Think best UX practices in modern design system
  - eg: you added hover-bg to the whole clickable block in stepper, but i said just change the color
    of the text when hovered and not of the whole row

## Overall

- Modern Linear / Vercel feel, but restrained. Flat "default" UI reads as dated; loud UI is
  rejected too.
- Colours come only from frappe-ui tokens (`--surface-*`, `--outline-*`, `--ink-*`,
  `--elevation-*`), never raw hex, so light and dark both hold. `--surface-white` and
  `--surface-modal` are not defined; use `--surface-base`.
- No saturated gradients, neon glows or big coloured icon tiles.

- Keep colour off form components: inputs, sections, filter rows and tabs stay neutral gray.
  Colour is reserved for identity (a step's hue on its tab/hairline) and status dots.
- Reviewed in dark mode first; mockups always get a Dark/Light toggle.
- Flows are horizontal only for now.

## Workflow block (P3, approved)

- Card: `--surface-gray-1`, 1px `--outline-gray-2` border, 10px radius, width 252px.
- Type tab on top (22px high, 20px from the left), sharing the card's surface and border,
  flowing into the card's top edge with 10px concave corners (radial-gradient pseudo
  elements). The tab is `display: flex; width: fit-content` (inline-flex leaves a gap).
- Tab text + icon in `--ink-{hue}-7`; 2px `--ink-{hue}-6` hairline along the tab top.
- Visible side ports: 9px rings (`--surface-base` fill, 1.5px `--outline-gray-4`), centred on
  the card, not the tab.
- Body: 14px semibold label, 12px `--ink-gray-5` detail, one line each, 10px/12px padding.
- Dashed footer (`--outline-gray-2`): status dot + label left, timing right.
- Timing in Inter `tabular-nums`, not monospace.
- One shared `filter: drop-shadow(...)` on the wrapper so tab and card cast one silhouette.

### Block states

- Selected: border `--outline-{hue}-3`, soft tight hue glow
  (`drop-shadow(0 2px 5px color-mix(in oklch, <hue dot> 14%, transparent))`).
  Bigger glows were "too much".
- Hover: lift 1px, ports grow and take the hue.
- Running: dot ping, shimmer on the status text, light sweep along the footer divider, live timer.
- Needs setup: amber dashed card border, slowly breathing amber dot.
- Done green dot, failed red, skipped/queued gray.

## Inspector side panel (C1, approved)

- Panel = same language as the block: P3 tab with hue hairline on the panel's top edge,
  then a header with the step's title (15px semibold) + detail (12px gray-5) and ghost
  more/close buttons, then a dashed status strip (dot + status + timing).
- Body: plain collapsible sections, NOT cards. Each section is a full-width 40px header row
  (chevron on the left that rotates, 13px medium title, gray-4 one-line summary on the right
  when collapsed), hover `--surface-gray-2`. Sections separated by 1px solid
  `--outline-gray-2` hairlines. Content padded 16px, 12px gap; grid-rows collapse
  animation (180ms).
- Fields: frappe-ui outline FormControls, neutral. Missing required values show a gray
  "Required" note, not amber borders.
- Conditions: frappe-ui `Tabs` (`TabList variant="underline" size="sm"`) with Filters /
  Expression; Expression shows the real code editor. Filters render as neutral sentence rows
  ("Status equals New" with an x), on `--surface-gray-2` with `--outline-gray-1` border.

## Motion

- Use motions wherever necessary.
- Try to add subtle "satisfying" click animations
- Subtle, purposeful: staggered fade-up on load, 150 to 180ms transitions, dot pop on state
  change. Everything off under `prefers-reduced-motion`.

## Working style

- Show 3 to 6 labelled variants side by side with the current UI as reference, each in all
  relevant states.
- Save every round as a new `-vN` mockup; never overwrite earlier ones.
- Small details get noticed: a 1 to 2px gap or seam is called out. Check joins at 3 to 4x
  zoom and reset the zoom afterwards.
- "Implement it" during a mockup session means the mockup tool, unless the user says CRM/repo.
- Clickable list rows (e.g. Stepper steps): hover changes only the text colour (darker
  ink) plus `cursor: pointer`. No background fill on hover or active.
- Never dim or fade other items when one is hovered (rows, chart bars, pips, dots). Highlight
  only the hovered item. Dimming siblings was called "shit" (agent-home-v9).
- Reuse existing frappe-ui components as they ship (e.g. `Progress` for a segmented bar), with
  their own defaults. No re-implementations or restyling (rounding, sizes, tricks). Always say
  explicitly when anything deviates from an existing base design.

## Dashboards and charts (agent home, Oct 2026)

Approved: `mockups/agent-performance-v2/` variant 4 (Editorial · polished), in context in `mockups/agent-home-v7/`.
Also loved: variant 1 (Linear style: hairline frame, segmented switcher with number shortcuts, muted bars with one accent, SLA as pips).

- Fewer cards. Never dump every chart on the page; one rich section with several charts inside one card beats many cards.
- No card shadows; a visible 1px `--outline-gray-2` border does the work. No glows (a glowing donut was "too much").
- Charts may go beyond stock frappe-ui: custom SVG combo charts (`ComboSvg.vue`) are welcome when tasteful. Use ghost or muted bars under one clear line, quiet axes, dashed hairline grids, rolling-average lines rather than noisy daily ones.
- Add an X factor through interaction rather than decoration: hover-scrubbing the headline number, count-up on change, a dot tracking the hovered point on sparklines.
- Fill empty space only with meaningful context (e.g. daily average, busiest day, team median), never forced filler.
- Rejected: v5's ten-card grid, heavy elevation without borders, stock-looking echarts, glowing dials.
- Only show data the CRM actually has (Deals, Leads, Tasks, SLA, call logs, notes, email). No calendar, meetings or video-call features: there is no calendar or meet integration (v8's Today card was rejected for this).
