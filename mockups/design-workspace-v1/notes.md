# Design workspace — visual gallery

Status: exploring. Selected direction: revised visual gallery from Product Design, October 17 2026.

Built for the Frappe Mockup workspace. Source of truth: ../../DESIGN.md.

- Real frappe-ui Button, FormControl, Tabs/TabList/TabTrigger, Dropdown and Dialog, using their stock variants and dimensions.
- Neutral controls, underline navigation, token-only colors, restrained 10px project cards. Color only on status dots and identity within the existing previews.
- Real project metadata, saved rounds, previews and notes. Search includes round names and feedback; history collapsed by default.
- Covers reuse existing built mockups with a desktop viewport, isolate the relevant existing content and scale it to fit. Historical mockup design styles are preserved inside covers rather than silently restyled.
- Responsive three/two/one-column layout, reduced motion, saved theme, Cmd/Ctrl K search, keyboard-accessible disclosures and stock dialog focus handling.
- Preview, comparison, notes, history and live-command interactions work locally. No CRM changes.

Intentional differences from the generated image: stock component sizing, truthful existing previews/content and actual project/round counts. No invented previews, fake dates or decisions. The gallery itself is excluded from its dataset to avoid recursive previews.

## Build and maintenance

- `bun build-gallery.mjs` rebuilds this Vue round, exports `gallery.html`, and refreshes the live gallery.
- `bun manage.mjs index` refreshes metadata using the compiled gallery template.
- The original gallery is preserved as `gallery-v1.html`. `workspace.mjs` and existing live server processes continue reading the same `gallery.html` path.
- Browser QA and comparison evidence: `design-qa.md`.
