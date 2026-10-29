# Frappe design workspace

From `~/mockup`:

```sh
bun manage.mjs index
bun dev.mjs workflow-blocks-v3
```

Open http://127.0.0.1:4818/mockups/ for the gallery and http://127.0.0.1:4818/ for the live round. Vue edits hot reload. Stop the server before selecting a different round. The server listens only on loopback.

```sh
bun manage.mjs fork workflow-blocks-v3 workflow-blocks-v4
bun manage.mjs status workflow-blocks-v4 selected
bun build.mjs workflow-blocks-v4
```

The gallery groups rounds by `design.json` project, highlights a selected round, filters projects by search/status and compares built rounds side by side at different widths. Filters retain the full history of matching projects. Optional `thumbnail.png` files replace embedded preview covers. Gallery theme applies to the workspace; mockups retain their own theme controls.

Metadata is stored beside each round's source. Edit objective, feedback, selectedVariant, sources and variants there, then run `bun manage.mjs index`. Existing notes and exported HTML are preserved. Initial metadata groups only numeric `-vN` suffixes and leaves decisions as exploring; change project fields to merge related named explorations. A fork preserves its parent's status and records lineage in the new round. Mark an old round superseded explicitly when appropriate.

Rounds with a local `build.mjs` may have special fixture plugins. Keep using those builders until their configuration is ported into the shared config. Shared live preview does not automatically reuse those plugins. Existing local builders may regenerate the old gallery; run `bun manage.mjs index` afterwards.

Shared builds preserve local frappe-ui font faces. The shared config supports `aliases.json` fixture mappings and `CRM_SRC_OVERRIDE`. No CRM source files are changed.

## Inspiration collection

Share an image, link, or design reference in chat and say “save as inspo.” Add what you like and any tags; the agent saves it in the gallery's **Inspos** collection. References are inspiration, not approvals or permanent design rules.

Each reference lives in `inspos/<slug>/inspo.json`. Local images are copied into that folder so they survive moves to the original file. Every reference gets the `inspos` tag. The gallery supports search across titles, source links, notes and tags, a tag filter, full-size images and source links. No remote images are fetched automatically; a link can be saved without a local image.

Agent command:

```sh
bun manage.mjs inspo quiet-navigation /absolute/path/reference.json
```

Example input:

```json
{
  "title": "Quiet navigation",
  "url": "https://example.com/design",
  "image": "/absolute/path/reference.png",
  "tags": ["navigation", "hover", "subtle"],
  "notes": "I like the spacing and quiet hover state."
}
```

Provide any combination of URL, local image, and notes. Images support PNG, JPEG, WebP, GIF and AVIF. Use absolute local paths. The command refuses to overwrite existing references and refreshes the gallery. Edit an existing `inspo.json` directly to refine its notes or tags, then run `bun manage.mjs index`. For future design work, consult matching inspirations and carry only the relevant traits into the mockup.
