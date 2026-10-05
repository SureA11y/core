# Stress test of `main` — outcomes of the priorities (2026-10)

What became of the fourteen priorities in [`2026-10-stress-test.md`](./2026-10-stress-test.md#1-priorities). That document is left as it was written; this one records, for each priority, whether it reproduced, whether it is a bug, what changed and what is left.

**Branch:** `fix/stress-test-priorities`, from `main` at `63af298`. One commit per priority (P7 and P8 share one), each with its tests, docs and `CHANGELOG.md` entry under *Unreleased*, plus three commits from the margin performance review in §5. Merged into `main` through PR #77 on 2026-10-05.

**How each item was judged.** Every item was reproduced on `main` before any change: the **[V]** items with the audit's own `verify*.js` probes, adjusted to local paths, and the others with a minimal repro. An item counts as a bug when the engine does something its docs or its own contract say it doesn't, or gives a wrong result. A missing capability nobody promised counts as a feature. The full suite (`node scripts/run-tests.js`), `lint`, `format:check` and `validate:rules` pass at the branch head.

---

## 1. Summary

| # | Finding | Bug? | Outcome | Commit |
|---|---|---|---|---|
| P1 | Text over non-ancestor paint failed with `high` confidence | Yes | Fixed: such text is `cantTell` with the new reason code `BACKGROUND_OVERLAP` | `6213f38` |
| P2 | `oklch()` / `lab()` / `color()` / `color-mix()` read as transparent | Yes | Fixed: converted to sRGB; an unreadable background is `BACKGROUND_UNPARSABLE` | `1f22c83` |
| P3 | Page-level fingerprints change with any content | Yes | Fixed: `<html>`, `<head>`, `<body>` report their start tag | `82c4ccf` |
| P4 | Reporters render a cross-frame result, an array or garbage as a clean pass | Yes | Fixed: anything but an object with a `checksResults` array throws, `null` and `{}` included | `bb72495` |
| P5 | Shadow-DOM occurrences resolve to the wrong element | Yes | Fixed: new `shadowHostSelectors`, `structuralPath: null` in a shadow tree | `d1e78cf` |
| P6 | Scoping to a shadow host skips its own shadow root | Yes | Fixed | `94cdeb1` |
| P7 | Method-shorthand custom rules dropped once stringified | Yes | Fixed | `923154f` |
| P8 | A bad `meta.deprecated` / `meta.i18n` aborts the scan | Yes | Fixed: the rule is skipped with a warning | `923154f` |
| P9 | Margin tie-break is O(n²) | Yes (unreleased regression) | Fixed | `f0124fb` |
| P10 | Results with function custom rules or rich probes can't be cloned | Yes | Fixed | `5c76000` |
| P11 | `policyContract: 'constructor'` crashes the scan | Yes | Fixed | `19a4698` |
| P12 | A typo in object-form `runOnly` runs 0 rules | Yes (silent wrong result) | Fixed: throws `INVALID_RUN_ONLY` | `5c1f8de` |
| P13 | Ancestor opacity counted twice | Yes | Fixed | `007c025` |
| P14 | No `helpUrl` / SC URLs / engine version | No: feature | `engine.version` only, merged through #78; help and Understanding URLs not done | — |

---

## 2. Per priority

### P1. Text over paint that is not an ancestor's — fixed (`6213f38`)

**Reproduced** in Chromium: all four patterns in R-1 (absolutely positioned sibling, `<img>` hero, `::before` overlay, negative margin) failed at 1.36:1, `confidence: high`.

**Change.** In a browser, `getComputabilityBlocker` (`src/core/contrast-helpers.js`) now checks what paints under the text. It indexes, once per scan, every element that paints in a 256 px grid: a background color or image, or `img`, `video`, `canvas`, `svg`, `iframe`, `object`, `embed`. It then measures the text's own line boxes with a `Range`, and looks for a painter there that is not an ancestor or a descendant of the text's element. It also checks the `::before` and `::after` of the text's positioned ancestors when they are positioned out of flow and paint a color or gradient. A hit returns the new blocker `BACKGROUND_OVERLAP`, which `contrast-computable` reports as `cantTell` with the painter's selector, property and value; `contrast-minimum` and `contrast-enhanced` then leave the text out, as for any blocker. It does not try to compute a ratio against the paint found, since it doesn't work out which box is on top.

**What was changed after scanning real sites.** Twelve public sites were scanned with the `main` bundle and the branch bundle: tailwindcss.com, gov.uk, bbc.co.uk, en.wikipedia.org, developer.mozilla.org, stripe.com, vercel.com, apple.com, w3.org/WAI, github.com, shopify.com and nytimes.com. Each new hit was inspected, with screenshots where it was unclear. The first version produced noise, and every limit below comes from a real case:

| Limit | Case that needed it |
|---|---|
| Only paint inside the text's nearest ancestor with an opaque background counts | A white card over a hero `<img>`: the image is behind the card |
| Fixed and sticky boxes, and their contents, are left out | BBC's consent `iframe` inside a `position: fixed` container |
| An inline painter is measured per line fragment, not by its bounding box | Wikipedia citation links that wrap, with an external-link icon |
| A pseudo-element is measured by its own resolved box, with scale and translation applied, and skipped when scaled to 0 | BBC's 1px nav dividers, moved with `translateY` |
| Paint must cover about a glyph of a line: half its height across, a third down | A glyph box spilling past `line-height: 0.8`, and GitHub's arrow icons nudging into text |
| Solid paint the same color as the measured background is ignored | MDN's white fade-out `::after` over white text |
| Only positioned elements' pseudo-elements are read | Performance: a pseudo style lookup per text element |

After these, the remaining hits were text on images (Apple and Shopify product tiles), on `canvas` heroes (Stripe, Vercel), on gradients, and on badge backgrounds ("New" pills on Vercel). Apple's `contrast-enhanced` fails went from 31 to 23, and Stripe's `contrast-minimum` fails from 13 to 8. The ones removed were text over a canvas or a gradient.

**`link-in-text-block`.** That rule compares the link's color with the surrounding text's, which paint behind them doesn't change. It keeps deciding under `BACKGROUND_OVERLAP`, and is undecided only when one of the two colors is translucent. Without that, Stripe lost a real link finding.

**Trade-off to know about.** A large decorative gradient glow behind a section makes the text in it `cantTell`, as an ancestor gradient already did. On stripe.com this hides four genuine 3.44:1 fails (`#7d8ba4` on near-white). That is consistent with the engine's existing policy on gradients, but it is a loss.

**Performance.** `perfStats.ruleTimings['contrast-minimum']` in Chromium, on the R-4 benchmark (40,000 paragraphs): siblings from 0.85 s to about 1.0 s, wrapped from 1.2 s to about 1.4 s, both far under `main` (2.5 s and 6.7 s). On the twelve real sites the whole-scan time didn't change measurably.

**Tests.** `tests/engine-checks/contrast-overlap-chromium.test.js`: the four R-1 patterns, plus seven controls that must keep failing (card over a hero, a float, an inline icon, a tight line-height, a fixed banner, a white fade-out, an underline scaled to 0).

**Left.**
- Paint outside the nearest opaque ancestor is never considered, so a positioned box from elsewhere that covers text inside a card is missed.
- `pointer-events` and stacking order are not looked at.
- A ratio against a solid painter that fully covers the text could be computed instead of asking. Not attempted.

### P2. Modern color syntax — fixed (`1f22c83`)

**Reproduced:** `background: oklch(0.2 0 0)` with `#ddd` text failed at 1.36:1.

**Cause.** Chromium keeps `oklch()`, `oklab()`, `lab()`, `lch()` and `color(<space> …)` as written in computed styles, and turns `color-mix()` and relative colors into one of them. `parseCssColorToRgba` read only hex and `rgb()`.

**Change.**
- The parser converts these to sRGB with the CSS Color 4 matrices: `srgb`, `srgb-linear`, `display-p3`, `a98-rgb`, `prophoto-rgb`, `rec2020`, `xyz`, `xyz-d50` and `xyz-d65`, with `none`, percentages and hue units handled. A color outside sRGB is clipped, which is what Chromium draws on an sRGB screen.
- Checked against Chromium's own canvas conversion on 2,000 random colors across every space, in and out of gamut: no channel differs by more than 1 in 255.
- A background color the parser still can't read now stops the background walk with the new reason code `BACKGROUND_UNPARSABLE`, instead of being skipped as transparent.

**Found while fixing it.** The parser's last fallback sets the value on a probe element and reads the computed color back. For a value the platform rejected, it returned the inherited color (black). It now gives up when the probe didn't take the value, and a CSS Color 4 function is never sent to that fallback.

**Real sites.** tailwindcss.com, whose palette is all `oklch`, now gets a genuine `contrast-minimum` fail: white on `#f6339a` (pink-500), 14 px bold, 3.58:1. It used to pass, because the background was skipped.

**Tests.** `tests/contrast-helpers-dom.test.js`: sixteen reference conversions recorded from Chromium, an `oklch` background end to end, and the `BACKGROUND_UNPARSABLE` blocker.

### P3. Page-level fingerprints — fixed (`82c4ccf`)

**Reproduced** with `verify2.js`: adding an unrelated `<p>` gave `newCount: 1, staleCount: 1` for `html-lang-attr-present`.

**Change.** `getOuterHtmlSnippet` gives `<html>`, `<head>` and `<body>` (the document's own) as their start tag alone. That covers every page-level rule reporting on them: `html-lang-attr-present`, `bypass-blocks-present`, `landmark-one-main`, `page-has-heading-one`. This is consistent with API_STABILITY's "the element's markup is the thing the finding is about".

**Migration.** Existing baseline entries and code-scanning alerts for these findings will show once as new plus stale, which the changelog says.

**Tests.** A cross-run cache test reported `<body>` by its content. It now changes body's attributes between two runs that both report it, which also makes it stricter, since run 1 now fills the cache. A new baseline test adds an unrelated paragraph.

**Left (O-2).** Attribute order still changes identity. Not touched.

### P4. Reporters and non-results — fixed in part (`bb72495`)

**Reproduced:** `renderJunitReport({ topFrame, frames })` gave `tests="0" failures="0"`.

**Change.**
- A new `src/scan-result.js`, shipped in `files`. `renderHtmlReport`, `renderSarifReport`, `renderJunitReport`, `buildBaselineEntries` and `matchBaseline` now throw a `TypeError` for a cross-frame result, an array, or a value that is not an object, and the message says what to pass instead.
- `renderEarlReport` now also takes a cross-frame result, each answering frame becoming a subject. It already took arrays.

**Missing results.** At first `null`, `undefined` and `{}` still rendered empty, because four tests pinned that. The maintainer decided they throw too (§3): a reporter now takes only an object with a `checksResults` array, and a result missing other fields (`url`, `engine`, `rulesResults`) still renders. The four tests now check both.

**Not done.** Flattening a cross-frame result inside JUnit, SARIF or the HTML report. That is a feature.

`getMargins` stays lenient: it's a reader, not a gate.

### P5. Shadow-DOM occurrence locations — fixed (`d1e78cf`)

**Reproduced:** two components with the same shadow content gave identical occurrences. `structuralPath: [0]` read from the document named `<head>`, and when that path was missing, `buildStructuralPath` re-read the selector against the document and returned the light-DOM element's path.

**Change.** Additive, so nothing a consumer already parses changes shape:
- An occurrence in a shadow tree carries `shadowHostSelectors`: the host selectors from the document down, each resolved in the tree that holds it.
- Its `selector` still resolves inside its own shadow root.
- Its `structuralPath` is `null`, the documented "could not be determined", rather than a wrong path.
- Margins carry `shadowHostSelectors` too.
- Types are in `index.d.ts`, and `OUTPUT_SCHEMA.md` is updated.

The audit's alternatives were a selector array (axe-core's convention) or a `structuralPath` that crosses roots. Both would change the type of an existing field, so neither was used.

**Test:** `tests/shadow-dom-contract.test.js` resolves all five occurrences (light DOM, two hosts, nested hosts) to five different elements.

### P6. Shadow host as scope — fixed (`94cdeb1`)

Reproduced with `verify4.js`. `queryAllDeep` now queues a scope root's own shadow root, since `querySelectorAll('*')` never returns the scope itself. `ENGINE_OPTIONS.md` says a selector can't reach *into* a shadow root and to scope to its host instead.

### P7 and P8. Custom-rule loading — fixed (`923154f`)

Both reproduced with `verify1.js`.
- **P7.** A source string that fails as an expression is tried as the body of an object literal, which accepts any method: shorthand, `async`, class methods.
- **P8.** `normalizeRuleMeta` is wrapped, and a rule with a bad `meta` is skipped.
- **Warnings.** Every skipped custom rule now logs a warning naming it and the reason, which partly covers C-3. `ENGINE_OPTIONS.md` now also says a string rule needs `eval`, which partly covers O-7 (strict CSP).

**Left.** C-3's `skippedCustomRules` result field, and `runOnly` naming a skipped rule. Not done.

### P9. Margin tie-break — fixed (`f0124fb`)

Done as the audit proposed. Ties are collected first, each is compared only with the next, and the earliest-first search runs only when they are out of order.

Contrast time in Chromium on this machine:

| Page | `main` | Branch |
|---|---|---|
| 40k siblings | 2.5 s | 0.85 s |
| 40k wrapped | 6.7 s | 1.2 s |

A unit test counts the siblings walked, as a stand-in for Blink's cost. Counting calls doesn't catch the regression, since both versions make n−1 calls.

### P10. Non-cloneable results — fixed (`5c76000`)

The `engineOptions` echo on every result now holds the capped `probes` the rules read, and `customRules` as `[{ id }]`. A circular or `BigInt` probe and function rules now survive `JSON.stringify` and `structuredClone`.

### P11. `policyContract` names — fixed (`19a4698`)

The lookup now reads only the contracts' own properties. An unknown name still falls back to `a11y`, and now logs a warning. S-10's doc error in `POLICY.md` is untouched.

### P12. `runOnly` validation — fixed (`5c1f8de`)

**Change.** The object form and `engineOptions.rules` / `.tags` now check names, as the bare-array form does:
- An include list in which no value names a rule or a tag throws, with `code: 'INVALID_RUN_ONLY'`. The bare-array errors now carry the same code.
- An unknown value beside known ones, or in an exclude list, logs a warning.

**Found while fixing it.** Two tests had been passing on nothing:
- `tests/sample-profile/opt-in-rules.test.js` read `c.ruleId` from rollup catalog entries, which have `id`, so it only ever asked for `"undefined"`.
- `tests/engine-checks/page-ready-chromium.test.js` scanned with `rules.include: 'html-has-lang'`, which is not a rule id.

Both are fixed in the same commit.

**Left from S-4.** `runOnly: 42`, `true`, `[]` and `''` still run every rule, and ids are still case-sensitive.

### P13. Double-counted opacity — fixed (`007c025`)

**Reproduced** in Chromium and in jsdom: 2.63:1, where the composited page gives 5.32:1.

**Change.** `computeEffectiveForeground` now checks the group-opacity override before its own cache, as `computeEffectiveBackground` already did. The same page now measures 5.32:1. A link in that paragraph is measured as `#2b2b2b` on `#808080`, which matches the compositing.

### P14. `helpUrl`, Understanding URLs, engine version — `engine.version` done (`11eebd4`)

**Not a bug.** No doc promised any of these: `OUTPUT_SCHEMA.md` documented `engine.tag` only, and SARIF's `driver.version` was `"0.0.0"` only when the caller passed no `toolVersion`.

**Done, as decided** (merged through #78):
- `scripts/build-core.js` bakes the `package.json` version into the generated engine, next to `ENGINE_TAG`, and every result carries it as `engine.version`.
- SARIF's `tool.driver.version` falls back to it.
- EARL's assertor `release` falls back to it when every result comes from one release; results from two releases claim none.
- A version bump now needs a rebuild: `tests/engine-version.test.js` enforces it, and `API_STABILITY.md`'s release note says so.

**Not done:** a `helpUrl` per rule (needs stable docs pages) and W3C Understanding URLs per SC mapping.

---

## 3. Decisions for the maintainer

Taken on 2026-10-05, after an explanation of each with examples, pros and cons.

| # | Question | Decision | State |
|---|---|---|---|
| P4 | Should `null`, `undefined` and `{}` throw too? | Yes, they throw | Done in `bb72495`; the four tests that pinned the old behavior were rewritten |
| P12 | Throw on an object-form `runOnly` list that names nothing, or only warn? | Throw | As implemented in `5c1f8de` |
| P14 | Which part of version and help links? | `engine.version` only (in results, as the SARIF `driver.version` default and as the EARL assertor release) | Done on `feat/engine-version` (`11eebd4`), after #77 merged |
| P1 | Keep `BACKGROUND_OVERLAP` as is, narrow it to images and solid colors, or leave it out of the PR? | Keep as is, after the performance figures below | As implemented in `6213f38` |

**P1 performance, the figures the decision was taken on.** Full-scan time in Chromium, before and after the P1 commit:

| Page | Before | After |
|---|---|---|
| 1,000 cards with backgrounds, images, badges and gradient links | 255–280 ms | 274–281 ms (+3%) |
| 5,000 such cards | 1.51–1.63 s | 1.63–1.73 s (+7%) |
| 1,000 heroes, every text block over an image | 173–177 ms | 199 ms (+15%) |
| 5,000 heroes | 1.22–1.26 s | 1.32–1.35 s (+8%) |
| 1,000-row table with colored cells | 317–324 ms | 344–345 ms (+8%) |
| 5,000-row table | 3.33–3.39 s | 3.36–3.38 s (about +1%) |

On the twelve real sites the difference was within run-to-run noise. Over 20,000 painting elements the check switches itself off, and under jsdom it costs nothing.

---

## 5. Margin performance review

Asked after the priorities: did the margin feature (`6fc8d33` and the five rules that report one, `8cac290`–`428941b`) slow any rule down, and what about the timing lead in §6 and R-5?

**Method.** Each margin rule was timed alone (`perfStats.ruleTimings`) at three points: before margins (`2750774`), `main` (`63af298`) and the branch. Each was run under jsdom and in Chromium, on pages built so that thousands of elements tie for the margin, the case that hurt R-4.

**What margins cost, after the branch's fixes.** Chromium, 10,000 elements:

| Rule | Before margins | `main` | Branch | Cause on `main` |
|---|---|---|---|---|
| `contrast-minimum` / `-enhanced` | 0.30 s | 0.64 s | 0.37 s | Tie-break, R-4 (fixed by P9); the rest is P1's overlap check and collecting candidates |
| `target-size-minimum` | 65 ms | 430 ms | 70 ms | Tie-break, R-4 (fixed by P9) |
| `text-spacing-content-loss` | 81 ms | 124 ms | 100 ms | Measuring each box's margin; linear |
| `link-in-text-block` | 2.4 s | 2.4 s | 0.7 s | None: the same as before margins. See below |

Under jsdom the five rules time the same at all three points. Every rule's remaining margin overhead grows linearly with the page.

**The §6 lead, `link-in-text-block` 11.8 s under jsdom.** Real, but older than margins (identical at `2750774`), and in two parts:

1. **`a62c81f`.** For each link the rule scanned every child of its parent for text beside it. With thousands of sibling links that is quadratic: 8,000 links took 34 s under jsdom, all to conclude the rule did not apply. The answer belongs to the parent and is now read once per parent: 8,000 links in 0.87 s. A test counts the rule's own reads of the siblings.
2. **`632ead4`.** In Chromium, a rule reporting thousands of siblings paid for `buildSelector`'s `:nth-of-type` and for `structuralPath`, which both counted an element's earlier siblings per occurrence. A parent's children are now indexed once per run, and indexed again if the engine inserts an element first or last in it (`text-spacing-content-loss`'s style sheet in `<head>`, the color probe at the end of `<body>`). 10,000 color-only links: 2.4 s → 0.7 s. On six public sites every occurrence's selector and path is identical before and after, and each full scan is 7–15% faster. This affects every rule, not only margin ones.

What is left is the native `el.matches(selector)` check of each selector, about 0.4 s of those 0.7 s. It stays O(siblings) per call in Blink, but it is the safety net against selector engines that count differently, so it was kept.

**R-5, `97dc7ea`.** The contrast rules stopped walking the page at their 50th failure, so later text never became a margin candidate, and the margin and `measuredCount` depended on where the 50th failure fell. A failure past the cap is now only counted and the walk goes on; occurrences stay capped at 50. On a page where every paragraph fails, the three contrast rules take 3–5% longer, since `contrast-computable` already analyses every element. Margins are unreleased, so this has no changelog entry.

**Not looked at.** `aria-valid-attr`'s 2.2 s in the same §6 probe. It has nothing to do with margins and is still an unverified lead.

---

## 5. Margin performance review

Asked after the priorities: did the margin feature (`6fc8d33` and the five rules that report one, `8cac290`–`428941b`) slow any rule down, and what about the timing lead in §6 and R-5?

**Method.** Each margin rule was timed alone (`perfStats.ruleTimings`) at three points: before margins (`2750774`), `main` (`63af298`) and the branch. Each was run under jsdom and in Chromium, on pages built so that thousands of elements tie for the margin, the case that hurt R-4.

**What margins cost, after the branch's fixes.** Chromium, 10,000 elements:

| Rule | Before margins | `main` | Branch | Cause on `main` |
|---|---|---|---|---|
| `contrast-minimum` / `-enhanced` | 0.30 s | 0.64 s | 0.37 s | Tie-break, R-4 (fixed by P9); the rest is P1's overlap check and collecting candidates |
| `target-size-minimum` | 65 ms | 430 ms | 70 ms | Tie-break, R-4 (fixed by P9) |
| `text-spacing-content-loss` | 81 ms | 124 ms | 100 ms | Measuring each box's margin; linear |
| `link-in-text-block` | 2.4 s | 2.4 s | 0.7 s | None: the same as before margins. See below |

Under jsdom the five rules time the same at all three points. Every rule's remaining margin overhead grows linearly with the page.

**The §6 lead, `link-in-text-block` 11.8 s under jsdom.** Real, but older than margins (identical at `2750774`), and in two parts:

1. **`a62c81f`.** For each link the rule scanned every child of its parent for text beside it. With thousands of sibling links that is quadratic: 8,000 links took 34 s under jsdom, all to conclude the rule did not apply. The answer belongs to the parent and is now read once per parent: 8,000 links in 0.87 s. A test counts the rule's own reads of the siblings.
2. **`632ead4`.** In Chromium, a rule reporting thousands of siblings paid for `buildSelector`'s `:nth-of-type` and for `structuralPath`, which both counted an element's earlier siblings per occurrence. A parent's children are now indexed once per run, and indexed again if the engine inserts an element first or last in it (`text-spacing-content-loss`'s style sheet in `<head>`, the color probe at the end of `<body>`). 10,000 color-only links: 2.4 s → 0.7 s. On six public sites every occurrence's selector and path is identical before and after, and each full scan is 7–15% faster. This affects every rule, not only margin ones.

What is left is the native `el.matches(selector)` check of each selector, about 0.4 s of those 0.7 s. It stays O(siblings) per call in Blink, but it is the safety net against selector engines that count differently, so it was kept.

**R-5, `97dc7ea`.** The contrast rules stopped walking the page at their 50th failure, so later text never became a margin candidate, and the margin and `measuredCount` depended on where the 50th failure fell. A failure past the cap is now only counted and the walk goes on; occurrences stay capped at 50. On a page where every paragraph fails, the three contrast rules take 3–5% longer, since `contrast-computable` already analyses every element. Margins are unreleased, so this has no changelog entry.

**Not looked at.** `aria-valid-attr`'s 2.2 s in the same §6 probe. It has nothing to do with margins and is still an unverified lead.

---

## 4. Not covered here

- Section 6 of the audit (ARIA, names, forms and structure leads) is still unverified.
- Items outside the priorities table are unchanged, except where a fix touched them:
  - C-3 and O-7 partly, through the custom-rule warnings and the CSP note;
  - S-4 partly, through the error code.
- The probes under `2026-10-probes/` were used as they are, with local paths. They were not edited on this branch.

---

## 6. What remains

Everything in the audit not fixed by #77 or `feat/engine-version`, grouped by how sure it is. The audit's item ids link to their full description in [`2026-10-stress-test.md`](./2026-10-stress-test.md). An item marked **[V]** there was re-checked once by the audit; the rest were reproduced only by the probe that found them, and none of them was re-checked during this work. Before fixing any of them, reproduce it on current `main`: several areas changed in #77.

### 6.0 Progress since this list was written

PR #79 (branch `fix/small-output-and-doc-fixes`), merged 2026-10-05:

| Item | Verdict | Change |
|---|---|---|
| O-6 | Bug | Fixed in part (`614f798`). An empty `message.text` falls back to the rule's title or id. Artifact URIs are percent-encoded relative references inside the working directory and absolute `file:` URLs outside it; Windows `file:///C:/` paths are read correctly. **Left:** the long raw fingerprints, since changing them changes finding identity. |
| O-11 | Bug | Fixed (`8a886d3`). The HTML report is dated by `result.timestamp` when present, in UTC, so it is deterministic. |
| C-18 | Bug (in unreleased code) | Fixed (`9af2682`). The `runOnly` name check trims custom rule ids and tags, as the runner does. |
| S-9, S-10 | Doc bugs | Fixed (`133c4a1`). A thrown rule is `cantTell` with `error`; `allowedConfidence` falls back to the rule's default confidence and never changes the outcome. |
| O-15 (reporter list) | Doc bug | Fixed (`18d22ee`). The rest of O-15 is left. |
| C-21 | **Not a bug** | No change. A scaffold's profile is `<key>-1.0`, and core uses `section508` as neither a tag nor a mappings name, so nothing collides. |

PR #81 (branch `fix/scoped-duplicate-id-doc-and-hidden-contrast`), merged 2026-10-05:

| Item | Verdict | Change |
|---|---|---|
| S-7 | Doc bug, not a rule bug | `989ed2c`. A scoped `duplicate-id` pass is true for the scope (each element in scope is compared with the whole page); `ENGINE_OPTIONS.md` no longer says it holds for the page. Decided with the maintainer: keep `pass`, fix the doc. The `deprecated-elements-not-used` and `server-side-image-map-absent` part of S-7 is not looked at. |
| R-8 | Bug | Fixed (`d4eb828`) for `font-size: 0`, `color: transparent` (gradient text becomes cantTell), and under `styleAndGeometry` off-page and fully clipped text. **Left:** the unselected options of a closed `<select>` (unclear: the browser draws the open list) and `rgba(0,0,0,.02)` text (drawn, so not a bug). `visibilityMode` stays `styleOnly` by default. |
| R-9 | Bug | Fixed (`1c58e23`). `css-orientation-lock` walks `@layer`, `@supports`, nested `@media`, `@container`, `@import`, CSS nesting and `<style media>`; `css-focus-indicator-suppressed` follows CSS nesting. |

PR #82 (branch `fix/link-cue-and-svg-fill`, open):

| Item | Verdict | Change |
|---|---|---|
| R-6 | Bug | Fixed (`2d1e24b`). A cue on the link's content (`<a><strong>`) counts; a link alone in an inline wrapper takes the wrapper's surrounding text, unless the wrapper sets it apart (a footnote `<sup>`); transparent underlines and borders are no cue. |
| R-7 | Bug | Fixed (`240004f`). SVG text is judged by `fill` (with `fill-opacity`); outline-only or gradient-filled text is not computable. |

Section 6 leads checked against ACT de46e4:

| Lead | Verdict |
|---|---|
| `link-name-present`, `button-name-present`: `role="none"`/`"presentation"` on a focusable link or button | **Bug, fixed in PR #79** (`9db2869`, moved there from #80 so the small fixes share one PR). WAI-ARIA 1.2's conflict resolution keeps a focusable element's implicit role, so the name comes from its content. An empty one still fails. |
| `valid-lang`, `lang="en-"` passes | **Not a bug.** The rule judges only the primary subtag, as ACT de46e4 does: its "known primary language tag" accepts a tag that breaks RFC 5646 grammar (its example is `de-hello`). `"en-"` names English. |
| `valid-lang`, `lang="qaa"` fails | **Kept as it is** (maintainer undecided, 2026-10-05): no change, since failing is the documented behaviour. Revisit if a user reports private-use tags being flagged. ACT accepts a primary subtag that "exists in the language subtag registry with a Type field whose field-body value is `language`". `qaa..qtz` is one registry entry with `Type: language`, `Scope: private-use`, and ACT is silent on ranges and private use. A literal reading passes it. The rule's documented reading fails it: a private-use code identifies no language assistive technology can know, like `eng` and `i-lux` in ACT's failed examples. |

### 6.1 Never verified: section 6 of the audit (ARIA, names, forms, structure)

The audit stopped before checking these. They are leads, not findings.

- **Harness first.** The Chromium column of `rules-a/report.txt` shows dozens of unrelated "expected pass, got `notApplicable`", which `r2.txt` and `r3.txt` do not. Re-run `corpus.js` before reading anything from it.
- **Leads where jsdom and Chromium agree.** Each is to be decided against accname 1.2, HTML-AAM, ARIA 1.2 and the ACT rules:

  | Rule | Case | Got | Likely |
  |---|---|---|---|
  | `label-in-name` | `aria-labelledby` referencing the link itself | fail | false positive |
  | `link-name-present`, `button-name-present` | `role="none"` / `"presentation"` on a focusable element | fail | fixed, see 6.0 |
  | `form-control-programmatic-label-present` | two inputs sharing an `id`, one `<label for>` | pass | false negative |
  | `aria-valid-attr-value` | `aria-hidden="TRUE"` | fail | check case-insensitivity first |
  | `listitem-parent-valid`, `list-children-valid` | `<li>` slotted into a shadow `<ul>` | fail | false positive |
  | `nested-interactive-controls-absent` | nesting across a shadow boundary | pass | false negative |
  | `aria-valid-attr-value` | IDREF from a shadow root to the light DOM | pass | false negative |
  | `valid-lang` | `lang="qaa"` (private use) | fail | kept: see 6.0 |
  | `valid-lang` | `lang="en-"` | pass | not a bug: see 6.0 |
  | `video-poster-text-alternative-present` | `<video poster>` in a `<figure>` with a caption | fail | to decide |
  | `img-alt-decorative` | icon `<img>` in an already named link | cantTell | possible noise |

- **Timing.** `aria-valid-attr` took 2.2 s on a 5,000-sibling page under jsdom. Not re-measured. (The `link-in-text-block` lead from the same probe is fixed, §5.)
- **Not started:** the `fuzz.js` invariants (no rule `error`, outcomes in the allowed set, `fail` ⇒ occurrences, resolvable selectors, no throws on malformed DOMs), and checking manual rules for `cantTell` noise on pages with no relevant content.

### 6.2 Reproduced by the audit, not fixed

**Outputs.**
- [O-2] Attribute and class order change a finding's identity (baseline, SARIF).
- [O-6] Left: fingerprints carry raw separators and up to 2 KB of HTML. Empty messages and unencoded URIs are fixed (6.0).
- [O-7] A string custom rule is skipped under a strict CSP. Now documented and warned about (#77); no fallback.
- [O-8] The `/browser` subpath is empty for bundlers.
- [O-9] `./i18n/*` can't be used from Node and isn't documented.
- [O-10] The subpaths have no types.
- [O-12] Payload size: 204 KB for an empty page; a compact output mode was suggested.
- [O-13] Cross-frame entries don't identify their `<iframe>`.
- [O-14] `src/explain/` isn't shipped and is incomplete.
- [O-15] Left: `waitForPageReady` accepts bad timeouts silently, and EARL merges results without a URL into one subject.

**Contrast, layout and visual rules.**
- [R-8] Left: unselected options of a closed select. The rest is fixed (6.0).
- [R-10] `text-spacing-content-loss` skips partly clipped text, and its margin is measured against half the line height while findings start at 2 px.
- [R-11] `target-size-minimum` uses the bounding box: clipped or covered targets pass, a rotated one is measured too large, `display: contents` links are not applicable, and a rounding slip appears in the message.
- [R-12] `contrast.mode: 'auditorAssist'` ignores `color-scheme: dark`.
- [R-13] `meta-viewport-zoom-enabled` and `meta-viewport-large` disagree on odd values.
- [R-14] Input values and placeholders are never contrast-checked, `zoom` isn't treated as large text, some alt-quality wording is off, and two alt rules have no occurrence cap.

**Custom rules and profiles.**
- [C-3] There's no `skippedCustomRules` field; warnings were added in #77.
- [C-4, C-5, C-6] A rule returning nothing usable disappears; async rules and unknown outcomes become `cantTell` with an empty `error`.
- [C-7, C-8, C-9] Severity, confidence and type aren't validated; a rule can overwrite engine-owned fields; the result-shape contract isn't enforced.
- [C-10, C-11] Duplicate custom ids, and a custom id equal to a composite id, aren't detected.
- [C-12] The docs' custom-rule example ignores exclusions and hidden content.
- [C-13, C-14] Custom rules can't join WCAG composites by mapping; under a profile a custom rule without WCAG tags never runs, and an override that drops a built-in's tags removes it.
- [C-15] The catalog APIs ignore `customRules`.
- [C-16, C-17] A custom rule's `helpUrl` and custom tags are lost in outputs; EARL leaves out `isPartOf` without `conformanceLevel`.
- [C-19] `index.d.ts` gives rule authors nothing, and `RULE_HELPERS.md` misses three helpers.
- [C-20] A profile can only be added by forking core: `profile-kit` isn't exported.
- [C-22] The key `acme-std` trips the boundary test. (C-21 turned out not to be a bug, 6.0.)

**Options.**
- [S-4] Remaining part: `runOnly: 42`, `true`, `[]` and `''` still run every rule, and ids are case-sensitive.
- [S-5] An invalid `excludeSelectors` is ignored silently.
- [S-6] Wrong option types fall back without a warning.
- [S-7] [V] Doc part fixed in PR #81 (6.0). Left: `deprecated-elements-not-used` and `server-side-image-map-absent` `pass` on an empty scope. Earlier analysis (2026-10-05): not a rule bug. A duplicate is a relation between two elements, so the rule compares every element in the scope against the whole document, and reports any in the scope whose id appears anywhere. A scoped `pass` therefore truthfully means no element in the scope shares its id; a pair entirely outside the scope is not reported, as with every rule. The bug is `ENGINE_OPTIONS.md` claiming that this `pass` "holds for the page". Proposed fix (not done yet): correct that sentence for `duplicate-id` and `duplicate-id-aria`. Unlike the landmark rules, these judge each element on its own, so `notApplicable` is not needed.
- [S-8] The contrast rules attach a page-level occurrence to `pass`, against `OUTPUT_SCHEMA.md`.
- [S-11] `includeHiddenElements: true` changes nothing for common rules.
- [S-12] `index.d.ts` gaps (`policyContract`, `policy`, `output`, error codes) and a stray `occurrence.outcome`.
- [S-13] Smaller doc slips.

**Suspected by the audit** (in each section's "Suspected" list): invalid `applicability` strings and `uncertainty.code` values passing silently, surrogate pairs split at 2,000 characters, Windows `file:///` SARIF paths, `getChecksCatalog({ profile: 'bogus' })`, an orientation lock on a rotated icon, float digits differing between jsdom and Chromium, and text-spacing overlap growth within one band.

### 6.3 Limits of what was fixed

- **P1:**
  - Paint outside the nearest opaque ancestor, fixed and sticky paint, and stacking order are not considered.
  - No ratio is computed against a solid painter that fully covers the text.
  - A large gradient glow hides genuine fails behind it.
- **P4:** Flattening a cross-frame result inside JUnit, SARIF and the HTML report (they throw instead).
- **P5:** `selector` and `structuralPath` themselves are not cross-root (by design; `shadowHostSelectors` is the addition).
- **§5:** Selector verification (`el.matches`) stays O(siblings) per occurrence in Blink: about 0.4 s for 10,000 reported siblings.
- **P14:** Help and Understanding URLs.

### 6.4 Suggested order

1. Section 6 leads (6.1), since nobody knows yet whether they are bugs. Start with the harness and the `role="none"` and `valid-lang` leads, which are quick to decide.
2. The ones that break CI or dashboards: O-6 (invalid SARIF), O-2 (fingerprints changing with attribute order), S-7 (a `pass` on an empty scope).
3. Rule false results with wide reach: R-8 (invisible text reported), R-9 (modern CSS not scanned), R-6, R-7.
4. Integrator features as a set: C-3, C-15, C-19, C-20, O-10, O-12.

