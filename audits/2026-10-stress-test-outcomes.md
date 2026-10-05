# Stress test of `main` — outcomes of the priorities (2026-10)

What became of the fourteen priorities in [`2026-10-stress-test.md`](./2026-10-stress-test.md#1-priorities). That document is left as it was written; this one records, for each priority, whether it reproduced, whether it is a bug, what changed and what is left.

**Branch:** `fix/stress-test-priorities`, from `main` at `63af298`. One commit per priority (P7 and P8 share one), each with its tests, docs and `CHANGELOG.md` entry under *Unreleased*. No pull request has been opened yet.

**How each item was judged.** Every item was reproduced on `main` before any change: the **[V]** items with the audit's own `verify*.js` probes, adjusted to local paths, and the others with a minimal repro. An item counts as a bug when the engine does something its docs or its own contract say it doesn't, or gives a wrong result. A missing capability nobody promised counts as a feature. The full suite (`node scripts/run-tests.js`), `lint`, `format:check` and `validate:rules` pass at the branch head.

---

## 1. Summary

| # | Finding | Bug? | Outcome | Commit |
|---|---|---|---|---|
| P1 | Text over non-ancestor paint failed with `high` confidence | Yes | Fixed: such text is `cantTell` with the new reason code `BACKGROUND_OVERLAP` | `6b4915a` |
| P2 | `oklch()` / `lab()` / `color()` / `color-mix()` read as transparent | Yes | Fixed: converted to sRGB; an unreadable background is `BACKGROUND_UNPARSABLE` | `0de6a8e` |
| P3 | Page-level fingerprints change with any content | Yes | Fixed: `<html>`, `<head>`, `<body>` report their start tag | `82c4ccf` |
| P4 | Reporters render a cross-frame result, an array or garbage as a clean pass | Yes | Fixed for wrong shapes; `null` and `{}` still render empty (see §3) | `e15a438` |
| P5 | Shadow-DOM occurrences resolve to the wrong element | Yes | Fixed: new `shadowHostSelectors`, `structuralPath: null` in a shadow tree | `c2d9485` |
| P6 | Scoping to a shadow host skips its own shadow root | Yes | Fixed | `94cdeb1` |
| P7 | Method-shorthand custom rules dropped once stringified | Yes | Fixed | `923154f` |
| P8 | A bad `meta.deprecated` / `meta.i18n` aborts the scan | Yes | Fixed: the rule is skipped with a warning | `923154f` |
| P9 | Margin tie-break is O(n²) | Yes (unreleased regression) | Fixed | `f0124fb` |
| P10 | Results with function custom rules or rich probes can't be cloned | Yes | Fixed | `4173d80` |
| P11 | `policyContract: 'constructor'` crashes the scan | Yes | Fixed | `19a4698` |
| P12 | A typo in object-form `runOnly` runs 0 rules | Yes (silent wrong result) | Fixed: throws `INVALID_RUN_ONLY` | `5c1f8de` |
| P13 | Ancestor opacity counted twice | Yes | Fixed | `c4427c0` |
| P14 | No `helpUrl` / SC URLs / engine version | No: feature | Not done (see §3) | — |

---

## 2. Per priority

### P1. Text over paint that is not an ancestor's — fixed (`6b4915a`)

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

### P2. Modern color syntax — fixed (`0de6a8e`)

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

### P4. Reporters and non-results — fixed in part (`e15a438`)

**Reproduced:** `renderJunitReport({ topFrame, frames })` gave `tests="0" failures="0"`.

**Change.**
- A new `src/scan-result.js`, shipped in `files`. `renderHtmlReport`, `renderSarifReport`, `renderJunitReport`, `buildBaselineEntries` and `matchBaseline` now throw a `TypeError` for a cross-frame result, an array, or a value that is not an object, and the message says what to pass instead.
- `renderEarlReport` now also takes a cross-frame result, each answering frame becoming a subject. It already took arrays.

**Deliberately not changed.** `null`, `undefined`, `{}` and partial results still render empty, because four existing tests pin that as intended behavior ("tolerates a missing or partial result"). Whether `null` should throw too is a decision for the maintainer (§3).

**Not done.** Flattening a cross-frame result inside JUnit, SARIF or the HTML report. That is a feature.

`getMargins` stays lenient: it's a reader, not a gate.

### P5. Shadow-DOM occurrence locations — fixed (`c2d9485`)

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

### P10. Non-cloneable results — fixed (`4173d80`)

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

### P13. Double-counted opacity — fixed (`c4427c0`)

**Reproduced** in Chromium and in jsdom: 2.63:1, where the composited page gives 5.32:1.

**Change.** `computeEffectiveForeground` now checks the group-opacity override before its own cache, as `computeEffectiveBackground` already did. The same page now measures 5.32:1. A link in that paragraph is measured as `#2b2b2b` on `#808080`, which matches the compositing.

### P14. `helpUrl`, Understanding URLs, engine version — not done

**Not a bug.** No doc promises any of these:
- `OUTPUT_SCHEMA.md` documents `engine.tag` only.
- SARIF's `driver.version` is `"0.0.0"` only when the caller passes no `toolVersion`.

It's a worthwhile feature. The cheapest useful part would be `engine.version` from `package.json`, also used as the SARIF default and the EARL assertor release, then generated Understanding URLs per SC mapping. Left for a decision on scope.

---

## 3. Decisions for the maintainer

1. **P4: should `null`, `undefined` and `{}` throw too?** They are as dangerous as the shapes that now throw: a failed scan handed to `renderJunitReport` still passes a gate. But four tests pin the empty rendering as intended, so the branch keeps it.
2. **P12 throws on object-form typos.** This is consistent with the bare-array behavior already in *Unreleased*. A caller that passed a list from a newer engine version with ids this version lacks now gets an error, unless at least one id in the list is known.
3. **P1's trade-offs.**
   - A gradient glow behind a section now hides genuine fails, as ancestor gradients already did.
   - Fixed, sticky and outside-the-opaque-ancestor paint is not considered.
   - Either way, these cases now give `cantTell` rather than a confident `fail`.
4. **P14 scope.** As above.

---

## 4. Not covered here

- Section 6 of the audit (ARIA, names, forms and structure leads) is still unverified.
- Items outside the priorities table are unchanged, except where a fix touched them:
  - C-3 and O-7 partly, through the custom-rule warnings and the CSP note;
  - S-4 partly, through the error code.
- The probes under `2026-10-probes/` were used as they are, with local paths. They were not edited on this branch.
