# Design QA — design workspace

final result: passed

## Evidence

- Source visual truth: visual-reference.png (1487 × 1058), the selected neutral refinement of option 1. DESIGN.md takes precedence where the generated image departs from the component library.
- Implementation: http://127.0.0.1:4818/mockups/.
- Browser: Codex in-app browser; dark default, closed history, no search/filter, real 11 projects / 33 saved rounds.
- CSS desktop viewport: 1440 × 1024. Browser zoom was 90% (reported devicePixelRatio 0.9); browser capture returns a 1600 × 1138 canvas. DOM measurements confirm content coordinates in CSS pixels. Trimmed the unused outer canvas to the 1440 × 1024 CSS viewport, without scaling implementation content. Source normalized to that viewport.
- Final implementation: desktop-dark.jpg and desktop-dark-normalized.png. Light: desktop-light.jpg and desktop-light-normalized.png.
- Full-view combined evidence: comparison.png. Source and implementation opened together after the final capture.
- Focused typography/toolbar/cover evidence: detail-comparison.png. Includes first-card and toolbar areas at readable scale.
- Responsive evidence: mobile-dark.jpg and mobile-light.jpg at CSS 390 × 844; DOM layout checked at 900px (two columns). No horizontal document overflow in either case.

## Findings and comparison history

1. [P2, fixed] The stock select's fill-width behavior squeezed search and expanded status across the toolbar. Added a 155px layout wrapper around the unmodified FormControl. Post-fix evidence: desktop-dark-normalized.png, desktop-light-normalized.png.
2. [P2, fixed] Covers clipped tall source content. Use contain scaling and centered placement within the cover. Corrected Workflow Blocks selector to the actual P3 section; centered its existing horizontal blocks. Post-fix evidence: comparison.png.
3. [P2, fixed] Extracting nodes from embedded source documents disrupted source observers. Keep the source DOM intact, hide unrelated siblings using visibility, and position the relevant original region. Subsequent navigation, theme changes and interaction checks added no new console errors. Earlier observer errors remain in the browser's historical log; their last timestamp precedes the corrected gallery navigation.
4. [P2, fixed] An already-running server retained the original gallery reader and could regenerate the old page after a notes update. Preserve the legacy template as gallery-v1.html and export to the original gallery.html path, so both existing and restarted processes use the new gallery.
5. No remaining actionable P0/P1/P2 findings in the built gallery.

## Required fidelity surfaces

- Fonts/typography: uses the builder's exact local Frappe Inter fonts. 23px heading, 16px project titles, 13px summaries, 12px metadata. Stock control typography retained; no substituted CDN font. Hierarchy and wrapping remain clear.
- Spacing/layout: three-column gallery, compact header and toolbar, 20px gutters, aligned action rows, 10px project cards. Two columns at tablet and one at mobile. Six projects fit the desktop view. Stock component dimensions intentionally replace generated control dimensions.
- Colors/tokens: all new CSS colors reference Frappe surface/outline/ink tokens. Controls and navigation neutral; only status dots carry color. Existing historical mockups retain their own visual styles inside covers. Base and card contrast differs from the raster reference because actual theme tokens take precedence.
- Image quality/assets: covers render the real existing mockups in isolated same-origin iframes; no invented marketing screens, fabricated UI screenshots, approximate command palette or handcrafted image assets. Covers deliberately show recognizable whole content at reduced scale; full-size interactive content opens in a dialog. The generated image's illustrative contact list and fabricated decisions were replaced by actual saved content.
- Copy/content: truthful project titles and round counts, useful project summaries, actual round notes. Historical metadata not rewritten to imply approval. Single-round comparison correctly disabled.

## Interaction checks

- Search by round slug returns its parent project; unmatched search shows a clear empty state and working Clear filters.
- Status selection applies filtering; Selected currently returns no projects because existing metadata has no selected rounds.
- History toggles, round preview actions and round notes work; notes fetch real Markdown and display it safely as text.
- Open preview loads the actual interactive round.
- Compare shows two built rounds; changing the second selector from Round 5 to Round 4 changes its iframe URL correctly.
- Overflow menu shows notes, history and live command; live command matches the project slug.
- Inspirations tab shows a truthful empty state with the existing collection empty.
- Both themes work, including covers, and persist locally.
- Cmd K focuses search. Stock dialogs manage focus and restore it on close.
- Build passes. Data checks pass for project/round counts, gallery recursion exclusion, and selected-round priority.
- Console checked before and after corrected navigation and interaction checks; no new errors after the source-DOM preservation fix.

## Follow-up polish / limitations

- Covers preserve historical mockup styling; those old designs may contain colors or patterns no longer preferred. They are not restyled by the gallery.
- Covers, notes and full previews require the local workspace server. The gallery does not modify CRM or publish externally.
- Copy-command failure has user feedback; system clipboard permission was not independently exercised.
- Motion uses 150–180ms transitions/stagger and disables custom motion under prefers-reduced-motion. OS-level reduced-motion emulation was not available in the browser surface.

## Implementation checklist

- [x] Real stock frappe-ui controls and token-only gallery styling.
- [x] Actual saved-round data and working main actions.
- [x] Browser checks across both themes and responsive breakpoints.
- [x] Full-view and focused comparison reviewed.
- [x] Installed gallery regenerates through workspace.mjs using gallery.html (original backed up in gallery-v1.html).
