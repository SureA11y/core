# Changelog

All notable changes to this project are documented here, in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## [Unreleased]

### Fixed
- `button-name-present` and `link-name-present` credited a `<button>`/`<a href>` element's rendered content as its accessible name even when an explicit `role` overrode it to a role whose content represents a VALUE, not a NAME (`combobox`, `listbox`, `textbox`, `slider`, `spinbutton`, `progressbar`, `scrollbar` — name-from-author-only per the WAI-ARIA Accessible Name and Description Computation spec; mirrors the reference engine's `controlValueRoles`, verified against its source). Both checks gated "is this a name-from-content candidate" on the native host tag alone, never checking whether `role` had overridden it. Found via the cross-engine comparisons project on Spotify's "Today's Top Hits" playlist page: `<button role="combobox">List</button>` (a "sort by" control, no `aria-label`/`aria-labelledby`) was credited with the name "List" — the combobox's currently selected *value*, not a label for what it is — and reported no issue at all, while the reference engine's `button-name` correctly failed it. Both rules now exclude these value-roles from name-from-content; a programmatic name (`aria-label`/`aria-labelledby`/`title`/native `<label>`) still works normally. `combobox-name-present`, `listbox-name-present`, `textbox-name-present`, `spinbutton-name-present`, `progressbar-name-present`, `meter-name-present`, `searchbox-name-present`, `slider-name-present`, and `dialog-name-present` were audited against the same gap and were already correctly name-from-author-only.
- `createDomHelpers()`'s element-keyed caches (`outerHtmlCache`, `selectorCache`, etc.) were persisted on `window.__a11ycoreSharedCache` and only initialized once per `window`/`document`, not once per run. A window/document reused across separate `runDomRulesInPage()`/`runa11yCoreInPage()` calls — e.g. Jest's `jsdom` environment, which creates one `window` per test file — could read back a previous run's stale cached value for an element that persists by reference across runs (like `document.body`) while its content changed via an in-place mutation (`innerHTML = ...`) in between. Rule pass/fail outcomes were always computed correctly against the live DOM; only cached diagnostic data such as `occurrences[].html` (via `bypass-blocks-present`, reported in #2) could go stale. `runCore()` (`src/core/dom-runner.js`) now resets `window.__a11ycoreSharedCache` at the start of every run, keeping the intended within-a-run sharing while preventing leakage across runs.

## [1.1.1] - 2026-07-29

### Changed
- **`engineOptions.includeHiddenElements` (default `false`)**: helper-driven rules now skip elements hidden by `display:none` (on the element or any ancestor), `visibility:hidden`/`collapse`, the `[hidden]` attribute, closed `<details>`, and other structurally-non-rendered content by default, matching the visibility-aware behavior of other established engines. Filtering happens upstream in the shared `queryAllSmart` helper, before a rule's own pass/fail logic runs, so it's a candidate-list exclusion, not a post-hoc annotation. Set `engineOptions.includeHiddenElements: true` to restore the previous behavior and evaluate hidden/collapsed subtrees anyway (e.g. to catch a markup defect, like a broken ARIA ID reference, before a `<dialog>` ever opens). 10 rule files whose own logic intentionally doesn't call the underlying eligibility check directly (static-markup-validity rules such as `aria-valid-attr`, `aria-valid-attr-value`, `aria-allowed-attr`, `aria-allowed-role`, `aria-prohibited-attr`, `table-headers-attr-valid`, `table-th-has-data-cells`, `deprecated-elements-not-used`, `iframe-title-unique`, `aria-checked-state-mismatch-manual`) still inherit this filtering through `queryAllSmart`; their doc comments were updated to say so. See `docs/ENGINE_OPTIONS.md` and `docs/LIMITATIONS.md`.

### Fixed
- `docs/LIMITATIONS.md`: the `<dialog>`/UA-stylesheet-hidden-content note was stale — it claimed static-markup-validity checks still evaluate hidden content, which this release's default change makes no longer true. Corrected to describe the current default and how to opt back in.

## [1.1.0] - 2026-07-28

### Added
- `engineOptions.rules[ruleId].excludeSelectors`: rule-scoped exclusions, narrowing candidates for exactly one rule on top of (never instead of) the existing global `excludeSelectors`. Resolves the class of false positive where one rule misfires on a component (e.g. Angular Material's `mat-select` tripping `aria-required-children`) while every other rule still needs to see it. Filtering happens upstream of each rule's own outcome decision, so no rule files changed. See `docs/ENGINE_OPTIONS.md`'s "Rule-scoped `excludeSelectors`" section.
- Completed French (`fr`) localization: translated the 313 remaining `src/i18n/fr.js` keys, bringing French to full parity with English (600/600 keys, up from 287/600). Verified against a live scan (`locale: 'fr'`) and confirmed no key/placeholder mismatches against `src/i18n/en.js`. Landmark terminology uses "point de repère" per MDN's French ARIA documentation.

### Fixed
- `docs/RULE_TAXONOMY.md`: automatic rules' allowed outcomes was missing `cantTell` (4 rules use it as a defensive fallback); the "current intents"/"current families" lists were stale and read as exhaustive when the ruleset actually spans 54 suffixes/68 prefixes — reframed as illustrative with a pointer to the generated `RULE_CATALOG.md`; `data.visibilityFilter.targetSet` was missing the `'dom'` value (only `'acc'` was listed).
- `docs/OUTPUT_SCHEMA.md`: the `visibilityFilter` type was missing its always-present `eligible` field; the worked example's `structuralPath` values for the button/img pair were swapped; removed a citation to a note in `RULE_AUTHORING.md` that doesn't exist there.
- `docs/I18N.md`: stale key counts (`en` listed as 590, actual 600; `fr` coverage listed as ~49%, actual ~48% at the time) — now updated to reflect full parity.

## [1.0.1] - 2026-07-28

### Changed
- Trimmed the published npm package: rule-authoring scaffolding (`docs/RULE_TEMPLATE.*`, `docs/RULE_TEST_TEMPLATE.md`, `docs/RULE_TEST_AUTHORING.md`, `docs/TEST_OUTCOME_STABILITY.md`) and the not-yet-documented `src/explain` module no longer ship in the tarball — both stay in the git repo for contributors.
- README rewritten for clarity: corrected the install command and `require()` examples to the actual package name (`@surea11y/core`), and updated the rule count to 125.
- `docs/ENGINE_OPTIONS.md`: documented the previously-undocumented `visibilityMode` option (`'styleOnly'`/`'styleAndGeometry'`, scoped to the three contrast rules), and added a "Recipes" section with composed, runnable examples for common scenarios (CI gating, auditor-mode contrast passes, scoped re-scans, reproducible snapshots, custom rules).

### Fixed
- `aria-allowed-attr`'s `SUPPORTED_ATTRS_BY_ROLE` table reconciled against the published WAI-ARIA 1.2 Recommendation (via `aria-query`, not the reference engine's table — the reference engine's own source comments confirm many of its `aria-expanded` allowances are deliberate ARIA 1.1 legacy carryovers, not current-spec facts). Added `aria-expanded` to 10 roles (checkbox, columnheader, gridcell, listbox, menuitemcheckbox, menuitemradio, row, rowheader, switch, tab) and `aria-activedescendant` to 8 composite-widget roles (combobox, grid, listbox, radiogroup, row, spinbutton, tablist, treegrid), plus smaller posinset/setsize/readonly/required/level gaps; removed `tree`'s unverified `aria-readonly`. `listitem` was already correct and is unchanged.
- README: a "Real browser execution" code sample passed four positional arguments to `page.evaluate()` and claimed it worked with "any" automation framework — Playwright's `page.evaluate()` only accepts one argument alongside the function and throws on this exact pattern. Now shown as Puppeteer-specific, with a pointer to `INTEGRATION.md`'s wrapper for Playwright.
- README: the JSON output example referenced a nonexistent rule id (`link-name-quality`); corrected to the real id, `link-name-quality-manual`.
- README: Quick Start code samples labeled the runner's four positional arguments as `url, ruleFilter, options, policy`; corrected to the actual names (`pageUrl, contextSelector, engineOptions, runOnly`) used consistently elsewhere in the docs.

## [1.0.0] - 2026-07-26

### Added
- 125 rules (77 automatic/`fail`-capable, 48 manual/advisory) — see `docs/RULE_CATALOG.md` for the full list.
- Full i18n support (English complete, French partial — see `docs/I18N.md`).
- A generated public rule catalog (`docs/RULE_CATALOG.md`, via `npm run docs:rule-catalog`) and WCAG facet-coverage report (`coverage/coverage-report.md`, via `npm run coverage`).
- This documentation set: `README.md`, `docs/OUTPUT_SCHEMA.md`, `docs/ENGINE_OPTIONS.md`, `docs/WCAG_CONFORMANCE.md`, `docs/POLICY.md`, `docs/I18N.md`, `docs/INTEGRATION.md`, `docs/LIMITATIONS.md`, `docs/TROUBLESHOOTING.md`, `LICENSE`.
- Multi-region `contextSelector` support: pass an array of selectors (or one comma-separated selector string) to scan multiple, possibly disjoint regions in a single run — equivalent to the multi-region include capability found in other engines. Overlapping/nested regions are deduped automatically. See `docs/ENGINE_OPTIONS.md`.
- `includeShadowDom` now defaults to `true` (opt out with `includeShadowDom: false`).
- `structuralPath` on every `fail`/`cantTell` occurrence: a sibling-index path from `documentElement` down to the flagged element, a more robust element-identity mechanism than `selector` alone (survives some DOM changes a selector wouldn't) — equivalent to the ancestry/xpath-addressing feature found in other engines. See `docs/OUTPUT_SCHEMA.md`.
- `engineOptions.customRules`: register additional rules at runtime, scan-scoped (not added to the static catalog), matching the shape of an internal rule module (`{ id, meta, runInPage, applicability?, data? }`) — equivalent to the rule/check registration pattern used by other engines. `runInPage`/`applicability` accept a real function or a function-source string, the latter needed for cross-realm callers (e.g. Playwright) whose `engineOptions` argument can't carry a live function across a serialization boundary. See `docs/ENGINE_OPTIONS.md`.
- `runa11yCoreAcrossFrames` / `a11yCoreEnableFrameResponder`: cross-frame (including genuinely cross-origin) scanning for the "plain script injection" consumption mode (no automation driver) — a cooperative `postMessage` protocol similar in spirit to the cross-frame messaging mechanisms used by other engines, including the same real limitation (a non-cooperating child frame is unreachable). Bundler-free, like `runa11yCoreInPage`. See `docs/INTEGRATION.md`'s "Cross-frame scanning" section and `docs/OUTPUT_SCHEMA.md`'s "Cross-frame result" section.
- `runOnly.tags` filtering by WCAG version: every rule/composite now carries the version-correct `wcag2*`/`wcag21*`/`wcag22*` level tag for its Success Criterion (matching the tagging convention used by other engines — a 2.1/2.2-introduced SC is tagged only with its true origin version, never also the pre-existing baseline tag), so a caller can select a WCAG 2.0/2.1/2.2 conformance target by combining tag sets. See `docs/ENGINE_OPTIONS.md`'s "Filtering by WCAG version" section and `src/coverage/wcag-version-map.js` for the canonical per-version SC list.
- `docs/BINDING_AUTHORS_GUIDE.md`: a reference for building a *new* framework binding (Puppeteer, Cypress, ...) on top of this engine — what's already engine-level vs. what every binding has to build itself, checked against what the `surea11y-playwright` sibling project actually needed.

### Fixed (selected)
- A shared `buildSelector` helper bug where an ancestor element that was the *last* of several same-tag siblings got no `:nth-of-type()` disambiguation, producing selectors that matched multiple elements instead of the one they were built for.
- Several `ALLOWED_ROLES_BY_ELEMENT` entries (`<label>`, `<table>`/`<td>`/`<th>`/`<tr>`, `input[type=checkbox][role=button]`) that were missing or too restrictive, found via real-world-page testing and verified against the W3C ARIA-in-HTML spec.
- `aria-hidden-focus` false-flagging the common `tabindex="-1"`-behind-`aria-hidden` pattern (checked raw focusability instead of tabbability).
- A label-naming bug (`hasLabelAssociation` ignoring a `<label>`'s own `aria-label`), duplicated across 7 rule files, all fixed identically.
- A systemic "name from content" false-positive affecting 19 rule files (an `<img alt>` or `aria-label`-named descendant inside a link/button wasn't recognized as providing the accessible name).
- `contextSelector` resolving via `document.querySelector` (first match only) instead of `querySelectorAll` — a selector matching several elements silently scanned only the first, dropping the rest with no indication.
- Three rules (`form-control-programmatic-label-present`, `target-size-minimum`, `label-in-name`) that queried `ctx.root` directly instead of through the shared `queryAllSmart`/`queryAll` helpers, found while implementing multi-region `contextSelector` support — silently broke (found nothing) the moment `ctx.root` became an array.
- `aria-required-parent`/`aria-required-children`'s ancestor/descendant searches and `getContentNameInfo`'s "name from content" walk not following shadow-DOM `<slot>` assignment; a duplicated `resolveAriaLabelledbyText` pattern across 16 rules and `getLabelText` across 7 not checking an `aria-labelledby`/`<label>` target's `title` attribute as a final accname fallback (e.g. an `<iframe title="...">` target, whose content is always empty).
- `landmark-one-main` incorrectly also flagged "more than one main landmark" — out of its real scope (the equivalent check in other engines is presence-only; duplicates are `landmark-no-duplicate-main`'s job, already implemented correctly) and missing the accessibility-tree visibility filter its sibling rule already has.
- `aria-required-children`, `aria-prohibited-children`, `aria-required-parent`, and `aria-required-attr` flagged containers/elements that were not currently exposed to the accessibility tree at all (`hidden`, a closed `<dialog>`, etc.) — e.g. a closed flyout `role="menu"` populated on open, or a custom `role="checkbox"` whose `aria-checked` is set on hydration. All four now skip elements that fail `isAccTreeEligible`; `aria-required-children`/`aria-required-attr` also honor `aria-busy="true"` as an explicit author signal of transient incompleteness (WAI-ARIA's own escape hatch for required owned elements, extended by analogy to required attributes).
- `getAccessibleLandmarkName`, duplicated across 7 landmark rule files, never checked an element's `title` attribute as a naming source (only `aria-label`/`aria-labelledby`) — confirmed against another engine's real scan that `title` is a valid landmark-naming fallback. Replaced all 7 copies with one shared helper, `helpers.getLandmarkNameInfo`.

### Known limitations
See `docs/LIMITATIONS.md` — structural (keyboard-trap detection, reflow-at-zoom), environment-dependent (jsdom vs. real-browser geometry), and deliberately-not-automated (text-quality judgment calls) limitations, stated explicitly rather than left to be discovered.

---

# How to add an entry

When you ship a change worth calling out to consumers (not every commit):
1. Add a bullet under `[Unreleased]`, in the right subsection (`Added`, `Changed`, `Fixed`, `Deprecated`, `Removed`, `Security`) — create the subsection if it doesn't exist yet for this cycle.
2. Write it from the consumer's perspective ("what changed for someone using this package"), not the implementation's.
3. When you tag a release, rename `[Unreleased]` to `## [x.y.z] - YYYY-MM-DD` and start a fresh empty `[Unreleased]` above it.
