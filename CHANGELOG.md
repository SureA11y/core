# Changelog

All notable changes to this project are documented here, in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. This project has not yet cut a tagged release — everything to date is captured under `[Unreleased]`. Once the first version is tagged, entries move under a dated `## [x.y.z] - YYYY-MM-DD` heading, oldest at the bottom.

For the detailed, narrative development history (why decisions were made, what was investigated, what was found and fixed along the way) see `ROADMAP.md` — this file is the terse "what changed" summary; that one is the full story.

## [Unreleased]

### Added
- 123 rules (76 automatic/`fail`-capable, 47 manual/advisory), covering the reference engine parity plus differentiated coverage beyond it — see `docs/RULE_CATALOG.md` for the full list and `ROADMAP.md` §4 for the gap-analysis methodology.
- A cross-engine diffing tool (`scripts/cross-engine/`) that runs a11y-core and the reference engine on the same page and classifies every disagreement — verified against both a synthetic fixture corpus and a 5-page real-world corpus, with 0 unexplained divergences on the real-world corpus as of this writing. See `docs/cross-engine-diffing.design.md`.
- Full i18n support (English complete, French partial — see `docs/I18N.md`).
- A generated public rule catalog (`docs/RULE_CATALOG.md`, via `npm run docs:rule-catalog`) and WCAG facet-coverage report (`coverage/coverage-report.md`, via `npm run coverage`).
- This documentation set: `README.md`, `docs/OUTPUT_SCHEMA.md`, `docs/ENGINE_OPTIONS.md`, `docs/WCAG_CONFORMANCE.md`, `docs/POLICY.md`, `docs/I18N.md`, `docs/INTEGRATION.md`, `docs/LIMITATIONS.md`, `docs/TROUBLESHOOTING.md`, `docs/COMPARISON.md`, `LICENSE`.
- Multi-region `contextSelector` support: pass an array of selectors (or one comma-separated selector string) to scan multiple, possibly disjoint regions in a single run — the reference engine's multi-`.include()` capability now has an engine-level equivalent. Overlapping/nested regions are deduped automatically. See `docs/ENGINE_OPTIONS.md`.
- `includeShadowDom` now defaults to `true` (opt out with `includeShadowDom: false`) — see `ROADMAP.md` §7 item 8 for the perf data behind the change.
- `structuralPath` on every `fail`/`cantTell` occurrence: a sibling-index path from `documentElement` down to the flagged element, a more robust element-identity mechanism than `selector` alone (survives some DOM changes a selector wouldn't) — the reference engine's `ancestry`/xpath-addressing equivalent. See `docs/OUTPUT_SCHEMA.md`.
- `engineOptions.customRules`: register additional rules at runtime, scan-scoped (not added to the static catalog), matching the shape of an internal rule module (`{ id, meta, runInPage, applicability?, data? }`) — the reference engine's `configure({rules,checks})` equivalent. `runInPage`/`applicability` accept a real function or a function-source string, the latter needed for cross-realm callers (e.g. Playwright) whose `engineOptions` argument can't carry a live function across a serialization boundary. See `docs/ENGINE_OPTIONS.md`.
- `runa11yCoreAcrossFrames` / `a11yCoreEnableFrameResponder`: cross-frame (including genuinely cross-origin) scanning for the "plain script injection" consumption mode (no automation driver) — a cooperative `postMessage` protocol matching the reference engine's own `runPartial`/`finishRun`/`frameMessenger` mechanism, including the same real limitation (a non-cooperating child frame is unreachable). Bundler-free, like `runa11yCoreInPage`. See `docs/INTEGRATION.md`'s "Cross-frame scanning" section and `docs/OUTPUT_SCHEMA.md`'s "Cross-frame result" section.
- `runOnly.tags` filtering by WCAG version: every rule/composite now carries the version-correct `wcag2*`/`wcag21*`/`wcag22*` level tag for its Success Criterion (matching the reference engine's own tagging convention — a 2.1/2.2-introduced SC is tagged only with its true origin version, never also the pre-existing baseline tag), so a caller can select a WCAG 2.0/2.1/2.2 conformance target by combining tag sets. See `docs/ENGINE_OPTIONS.md`'s "Filtering by WCAG version" section and `src/coverage/wcag-version-map.js` for the canonical per-version SC list.
- `docs/BINDING_AUTHORS_GUIDE.md`: a reference for building a *new* framework binding (Puppeteer, Cypress, ...) on top of this engine — what's already engine-level vs. what every binding has to build itself, checked against what the `a11y-core-playwright` sibling project actually needed.

### Fixed (selected — see `ROADMAP.md` for the full list)
- A shared `buildSelector` helper bug where an ancestor element that was the *last* of several same-tag siblings got no `:nth-of-type()` disambiguation, producing selectors that matched multiple elements instead of the one they were built for.
- Several `ALLOWED_ROLES_BY_ELEMENT` entries (`<label>`, `<table>`/`<td>`/`<th>`/`<tr>`, `input[type=checkbox][role=button]`) that were missing or too restrictive, found via real-world-page testing and verified against the W3C ARIA-in-HTML spec.
- `aria-hidden-focus` false-flagging the common `tabindex="-1"`-behind-`aria-hidden` pattern (checked raw focusability instead of tabbability).
- A label-naming bug (`hasLabelAssociation` ignoring a `<label>`'s own `aria-label`), duplicated across 7 rule files, all fixed identically.
- A systemic "name from content" false-positive affecting 19 rule files (an `<img alt>` or `aria-label`-named descendant inside a link/button wasn't recognized as providing the accessible name).
- `contextSelector` resolving via `document.querySelector` (first match only) instead of `querySelectorAll` — a selector matching several elements silently scanned only the first, dropping the rest with no indication.
- Three rules (`form-control-programmatic-label-present`, `target-size-minimum`, `label-in-name`) that queried `ctx.root` directly instead of through the shared `queryAllSmart`/`queryAll` helpers, found while implementing multi-region `contextSelector` support — silently broke (found nothing) the moment `ctx.root` became an array.
- `aria-required-parent`/`aria-required-children`'s ancestor/descendant searches and `getContentNameInfo`'s "name from content" walk not following shadow-DOM `<slot>` assignment; a duplicated `resolveAriaLabelledbyText` pattern across 16 rules and `getLabelText` across 7 not checking an `aria-labelledby`/`<label>` target's `title` attribute as a final accname fallback (e.g. an `<iframe title="...">` target, whose content is always empty) — see `ROADMAP.md` §7 item 8 for the full incident history.
- `landmark-one-main` incorrectly also flagged "more than one main landmark" — out of its real scope (the reference engine's own `landmark-one-main` is presence-only; duplicates are `landmark-no-duplicate-main`'s job, already implemented correctly) and missing the accessibility-tree visibility filter its sibling rule already has.
- `getAccessibleLandmarkName`, duplicated across 7 landmark rule files, never checked an element's `title` attribute as a naming source (only `aria-label`/`aria-labelledby`) — confirmed against a real `the reference engine's run()` that `title` is a valid landmark-naming fallback. Replaced all 7 copies with one shared helper, `helpers.getLandmarkNameInfo`.

### Known limitations
See `docs/LIMITATIONS.md` — structural (keyboard-trap detection, reflow-at-zoom), environment-dependent (jsdom vs. real-browser geometry), and deliberately-not-automated (text-quality judgment calls) limitations, stated explicitly rather than left to be discovered.

---

## How to add an entry

When you ship a change worth calling out to consumers (not every commit — see `ROADMAP.md` for that level of detail):
1. Add a bullet under `[Unreleased]`, in the right subsection (`Added`, `Changed`, `Fixed`, `Deprecated`, `Removed`, `Security`) — create the subsection if it doesn't exist yet for this cycle.
2. Write it from the consumer's perspective ("what changed for someone using this package"), not the implementation's.
3. When you tag a release, rename `[Unreleased]` to `## [x.y.z] - YYYY-MM-DD` and start a fresh empty `[Unreleased]` above it.
