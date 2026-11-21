# Stress test of the round 8 fixes, ninth round: findings (2026-11-21)

The ninth stress test ran at `805f33ff`, the head of the round 8 branch (#416) before it was merged: `main` at `254b644f` plus round 8's fixes. Unlike round 8, it was a general stress test, not a look at what changed: wrong verdicts, misses, slowness and side effects on the page, across the API, the visual rules, names and ARIA, and robustness.

As in rounds 6 to 8, there is no `FINDINGS.md` per area; each area wrote a short list of its findings, graded each and marked it *evident* (the fix follows from the spec or the engine's docs) or *decision* (a defensible reading supports the current behaviour). Each area's probes are under [`2026-11-probes-9/`](./2026-11-probes-9/):

| Area | Folder | Prefix | Runtime | Findings |
|---|---|---|---|---|
| The integrator's API: exports, types, locales, packs, reporters | [`api/`](./2026-11-probes-9/api/) | A9 | Node (CommonJS and ESM), TypeScript, jsdom, Chromium | 17 |
| Contrast, focus and other visual rules | [`visual/`](./2026-11-probes-9/visual/) | V9 | Chromium | 14 |
| Accessible names, ARIA and landmarks | [`names-aria/`](./2026-11-probes-9/names-aria/) | N9 | jsdom, Chromium | 20 |
| Robustness: side effects, speed, hostile pages | [`robust/`](./2026-11-probes-9/robust/) | R9 | Chromium, jsdom | 10 |

That makes 61 findings: 3 High, 24 Medium, 6 Low to Medium and 28 Low. **48 were evident and are fixed** in [#417](https://github.com/SureA11y/core/pull/417), merged 2026-11-21 as `ad47fe3e` (one commit on `main`; unreleased, for 1.18.0). The other 13, and the second part of five fixed ones (V9-7, N9-3, N9-5, R9-2, R9-10), needed a decision: 18 in all; the owner took them on 2026-11-21, and they are being made on the branch `round-9-decisions`, not merged yet (§2). One more lead, not numbered, is left open (§3).

**Basis**
- The round 8 branch at `805f33ff`; `main` at `254b644f` and v1.17.0 (`b893e1b7`) for the classification below.
- Chromium 153 (`/opt/pw-browsers/chromium`), jsdom from the repo, TypeScript from the repo.
- WCAG 2.2 and its Understanding documents are the source of truth; HTML, WAI-ARIA 1.2, ARIA in HTML, accname, SVG-AAM and the CSS specs decide the details; Chromium is supporting evidence.

**How findings were verified.** Each finding was reproduced by its probe, and again while it was fixed, with a regression test that fails without its fix (#417).

**Regressions? None.** Every round 9 finding was checked against v1.17.0, `254b644f` and `805f33ff`. All are *always there*: the same on all three builds; none is a regression of rounds 7 or 8. How far that was measured:
- the API, visual and names findings, and the unnumbered `xml:lang` lead, were run on all three builds, with byte-identical outputs but for timings (V9-12's message for `scale(.001)` changed in round 8's LY-13, its verdict didn't);
- R9-7 was measured on v1.17.0, where `contrast-computable` is already quadratic (3.6 s at 1,000 text nodes, 14.8 s at 2,000);
- R9-1 to R9-6 and R9-8 to R9-10 were inferred from the code history, not run on all three builds: the robustness area found R9-1 to R9-7 the same on `254b644f`, and nothing they depend on changed since 1.17.0. R9-10's incomplete list of probed built-ins is round 8's (PK-6, RO-5), but the gap it leaves was there before that list.

---

## 1. Findings

Ordered by area, most damaging first. *Fixed* means #417; *decided* is in §2.

### The integrator's API

| # | Finding | Sev. | Outcome |
|---|---|---|---|
| A9-1 | 18 of the main entry's 44 exports can't be imported by name from ESM (`module.exports = {...core}`), though the types say they can (`p02-exports.js`, `p04-esm-named.mjs`). | Medium | Fixed: exports listed by name |
| A9-2 | A compact scan's result is typed as a full result, and the reporters and baseline types reject `CompactScanResult` (`tscheck/compact.ts`). | Medium | Fixed |
| A9-3 | A `messages` key differing in case from the locale is ignored; locale `'DE'` loses the whole language (`p09-messages.js`). | Medium | Fixed |
| A9-4 | An override for a regional locale (`de-AT`) leaves everything else English, not German (`p10-subtag-override.js`). | Medium | Decided |
| A9-5 | In the browser bundle, `messages` for a locale replace its loaded side file instead of layering over it (`p27-browser-locale.js`). | Medium | Fixed |
| A9-9 | `checkPack` and `definePack` take packs the scan can't prepare (a variant's `from`, profile rules, severity, exclude, rollup `checksIds`); the scan then skips the pack and runs every core rule (`p36-variant-from.js`, `p37-checkpack-prepare.js`). | Medium | Fixed: refused |
| A9-10 | With `output.includeHtml: false`, baseline keys are rule and reason code only, so new violations count as known (`p12-baseline-nohtml.js`). | Medium | Decided |
| A9-7 | The rollups' catalog entries ignore the locale, and have no top-level title. | Low–Med. | Fixed |
| A9-8 | `StrictEngineOptions` doesn't catch a misspelt option in the documented call form (`tscheck/strict.ts`). | Low–Med. | Fixed |
| A9-6 | The HTML report's Understanding link names the criterion in English in a translated report (`p11-report-i18n.js`). | Low | Fixed |
| A9-11 | `null` options crash the SARIF, JUnit and EARL reporters; misspelt reporter keys are ignored silently (`p17-reporter-opts.js`). | Low | Fixed |
| A9-12 | `listProcedures` with a misspelt tool or automation filter returns nothing silently; a numeric version `2.1` gives the 2.2 list (`p15-*.js`, `p16-*.js`). | Low | Fixed |
| A9-13 | The types reject values the docs accept for booleans (`strictOptions: ''`, `'true'`, `1`) (`tscheck/docs.ts`). | Low | Decided |
| A9-14 | `engineOptions` rule and tag filters are dropped silently when `runOnly` has a filter (documented as "pick one"). | Low | Decided |
| A9-15 | `runa11yCoreOnHtml` ignores engine options given at the top level (`locale`, `profile`). | Low | Decided |
| A9-16 | `checkStandardData` passes data `definePack` refuses (`wcagSc: '9.9.9'`, an unknown rule, invalid dates) (`p21-stddata.js`, `p22-std-wcagsc.js`). | Low | Fixed |
| A9-17 | Baseline keys split class names on NBSP and U+3000, and don't normalise a cut start tag (`p13-baseline-norm.js`). | Low | Fixed: ASCII whitespace |

### Contrast, focus and other visual rules

| # | Finding | Sev. | Outcome |
|---|---|---|---|
| V9-1 | **Animations in shadow roots are never settled or reported** (`document.getAnimations()` misses them): contrast depends on timing, and `moving-content-pausable` is `notApplicable`. | High | Fixed |
| V9-2 | A modal dialog's `::backdrop` is ignored as background by the contrast rules. | Medium | Fixed |
| V9-3 | Text in a fixed box with no background of its own is judged against whatever is scrolled under it: pass at scroll 0, fail at 800. | Medium | Decided |
| V9-4 | focus-not-obscured takes `position: fixed` inside a transformed or filtered ancestor for viewport-fixed. | Medium | Fixed |
| V9-5 | focus-not-obscured misses fixed boxes painted by `::before` or an inset `box-shadow`. | Medium | Fixed |
| V9-6 | `css-focus-indicator-suppressed` takes replacements that draw nothing: `outline-color`/`-width` after `outline: none`, a border colour with no border, an underline already shown, a transparent or zero shadow, `var(--ring)` = none. Round 8's LY-3 covered other cases. | Medium | Fixed |
| V9-7 | `link-in-text-block` counts invisible cues (a transparent outline, a decoration or border in the background's colour, `::before " "`, a 0×0 svg, a near-invisible background). | Medium | Fixed (cues that draw nothing); decided (colour-only cues) |
| V9-8 | A failing `::first-letter` or `::first-line` colour is asked about, not failed; the `::first-letter` message about line breaks is untrue. | Medium | Decided |
| V9-10 | `css-orientation-lock` misses a rotation written with `var()`. | Medium | Fixed |
| V9-9 | The `PSEUDO_ELEMENT_COLOR` message names no selector. | Low | Fixed |
| V9-11 | `text-spacing-content-loss` miscounts lines under `-webkit-line-clamp`, and its `clipCss` names a height no rule set. | Low | Fixed |
| V9-12 | Text in a 1px sr-only box without `clip`, under `clip-path: polygon()` of no area, or at `scale(0.001)` fails contrast. | Low | Fixed: not measured |
| V9-13 | `css-hidden-focus` leans fail on a `::slotted(a:focus)` reveal, and misses an element's own `scale(0)`. | Low | Fixed |
| V9-14 | `moving-content-pausable` asks about motion nothing shows; SMIL isn't mentioned. | Low | Decided |

### Accessible names, ARIA and landmarks

| # | Finding | Sev. | Outcome |
|---|---|---|---|
| N9-1 | **`label-in-name` fails a CJK label that is part of a longer name**: text without spaces was split as words (`p_lin_cjk.js`). | High | Fixed: compared by characters |
| N9-3 | **`aria-hidden` on `<html>` or `<body>` skips the whole page**; Chromium ignores it there, and `aria-hidden-body` doesn't cover `<html>`. | High | Fixed (`<html>` reported); decided (the page stays hidden) |
| N9-2 | `label-in-name` counts ruby `<rt>` as label text, glued to its base. | Medium | Fixed |
| N9-4 | `svg-image-text-alternative-present` fails an `<image>` inside presentational children or a named `<svg>`. | Medium | Fixed |
| N9-5 | `listitem-parent-valid` accepts an `<li>` under any `role=none` parent, against `list-children-valid` for `ul > div[role=none] > li` and `display: contents`. | Medium | Fixed (a: only inside a list); decided (b) |
| N9-11 | `autocomplete-valid` fails hidden honeypot fields (aria-hidden, off-screen, `tabindex=-1`). | Medium | Fixed |
| N9-6 | The list rules ignore roles from `ElementInternals`. | Low–Med. | Fixed |
| N9-12 | `html-lang-attr-present` fails an XHTML page with `xml:lang` (`p_xhtml*.js`). | Low–Med. | Fixed |
| N9-7 | `identical-iframes-same-purpose` compares names case-sensitively; the link rule folds case. | Low | Fixed |
| N9-8 | `page-zones-landmark` misses a banner or contentinfo from shadow DOM or `ElementInternals` (`p_zones.js`, `p_shadowfoot.js`). | Low | Fixed |
| N9-9 | `page-zones-landmark` asks a `role=menu` widget to become navigation. | Low | Fixed |
| N9-10 | `region` asks, leaning fail, about decorative images Chromium ignores (`p_region_lean.js`). | Low | Fixed |
| N9-13 | `skip-link` reports `#top` as a missing target (`p_top.js`). | Low | Fixed |
| N9-14 | `form-control-label-quality` calls punctuation-only labels duplicates. | Low | Fixed |
| N9-15 | `aria-prohibited-attr` says `<p>`, `<code>`, `<strong>`, `<time>`, `<del>`, `<sup>` have no role (`p_prohib.js`). | Low | Fixed |
| N9-16 | `aria-allowed-attr` rejects `aria-colindextext`/`aria-rowindextext` on a cell. | Low | Fixed |
| N9-17 | `aria-owns-valid` misses ownership cycles. | Low | Fixed |
| N9-18 | `<svg role=graphics-document>`: `svg-text-alternative-present` fails, `img-alt-decorative` says it has no role. | Low | Decided |
| N9-19 | `aria-required-children` doesn't look into a child's shadow root; `aria-required-parent` does (`p_slot*.js`). | Low | Decided |
| N9-20 | `link-name-present` passes an `aria-labelledby` pointing at `<script>` or `<style>`. | Low | Fixed |

### Robustness

| # | Finding | Sev. | Outcome |
|---|---|---|---|
| R9-1 | `aria-hidden-focus` replaces the page's selection and moves the caret (`selection-*.js`). | Medium | Fixed: ranges restored |
| R9-2 | `aria-hidden-focus` loses focus that was inside a same-origin iframe or a closed shadow root (`focus-restore*.js`). | Medium | Fixed (iframe); decided (closed shadow root) |
| R9-3 | `text-spacing-content-loss` (and `evidence-state.js`) restore the scroll with a plain `scrollTo`, animated under `scroll-behavior: smooth` (`smooth-scroll*.js`). | Medium | Fixed |
| R9-5 | With `<base href>`, `skip-link` and `bypass-blocks-present` accept a `#main` link that leaves the page (`base-skip*.js`). | Medium | Fixed |
| R9-7 | Under jsdom, `contrast-computable` is quadratic in the text nodes inside one `<label>` (`jsdom-perf.js`, `perf-scale.js`). | Medium | Fixed: once per label |
| R9-4 | A no-op `window.scrollTo` silently turns focus-not-obscured's `cantTell` into `pass` (`scroll-noop.js`). | Low–Med. | Fixed: asked, `notScrolled: true` |
| R9-6 | `text-spacing-content-loss` is quadratic with many broken or `src`-less images in Chromium: Chromium's style recalculation (`broken-img-*.js`). | Low–Med. | Decided |
| R9-8 | A fixed target's target-size verdict depends on the scroll position (`fixed-target-scroll.js`, `scroll-target-size.js`). | Low | Decided |
| R9-9 | Page code (load listeners, MutationObservers) runs inside the scan through the contrast probe frames (`page-observers*.js`, `probe-frame-load.js`). | Low | Decided |
| R9-10 | Replaced built-ins not probed by `PAGE_BUILTINS_BROKEN` change verdicts silently; a no-op `Array.prototype.shift` hangs the scan (`builtin-fuzz.js`, `hang-where.js`). | Low | Fixed (the built-ins found); decided (scope) |

---

## 2. Decisions taken

All taken by the owner on 2026-11-21. They are being made on the branch `round-9-decisions`, **not merged yet**; the register records them as decided, pending.

- **A9-4:** a regional locale falls back `de-AT` → `de` → `en`.
- **A9-10:** with no HTML, the baseline key falls back to the selector.
- **A9-13:** the types stay strict; the docs say the string and number forms are runtime-only.
- **A9-14:** a warning (under `strictOptions`, an error) when `runOnly` drops `engineOptions` rule filters.
- **A9-15:** `runa11yCoreOnHtml` warns about engine options at the top level.
- **V9-3:** text in a fixed box with no background of its own is asked about, at any scroll.
- **V9-7:** a link set apart by colour alone needs 3:1 against the text around it.
- **V9-8:** a failing `::first-letter` or `::first-line` colour fails.
- **V9-14:** motion that isn't visible is skipped; SMIL is documented.
- **N9-3:** `aria-hidden` on `<html>` or `<body>` keeps the page hidden: no change (`<html>` is now reported by `aria-hidden-body`, fixed).
- **N9-5 (b):** a `role=none` or `display: contents` wrapper inside a list passes both list rules.
- **N9-18:** `<svg role=graphics-document>` is treated as a plain `<svg>`.
- **N9-19:** `aria-required-children` looks into a child's open shadow root.
- **R9-2:** the focus probe is skipped when focus is in a closed shadow root.
- **R9-6:** documented only.
- **R9-8:** fixed and sticky targets are judged apart from the page's targets; where they may overlap, asked about.
- **R9-9:** one helper frame reused per scan, and documented.
- **R9-10:** the check stops at the language's built-ins (a replaced `getComputedStyle` is not checked), documented.

## 3. What is left

- **`html-xml-lang-mismatch` with an unknown `xml:lang` tag** fails, as a mismatch (names area, unnumbered, Low, *decision*; always there). No decision was asked for; it stays open in the register.
- The decisions of §2, until `round-9-decisions` is merged.
