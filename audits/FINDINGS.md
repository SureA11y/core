# Findings register

**The one list to work from.** It gathers every finding from every audit on this branch, after checking each one on `main`:
- what is **still open** and needs fixing (§1–§2);
- what has been **fixed**, with where and when (§3);
- what was **closed without a fix**, with the reason (§4).

| | |
|---|---|
| **Verified against** | `main` at `cfefc02` (1.10.0 plus six commits), 2026-10-06 |
| **Audits included** | [First round](./2026-10-stress-test.md) (findings at `63af298`, with its [outcomes log](./2026-10-stress-test-outcomes.md)) and [second round](./2026-10-stress-test-2.md) (at `cfefc02`) |
| **How it is kept** | See [`README.md`](./README.md): before each audit, merge `main`; after it, re-run every open item, move fixed ones to §3, and add new ones |

**How it was built.** Every first-round item was re-run on `cfefc02`, including those the outcomes log marks as fixed, by the re-check probes in [`2026-10-probes-2/recheck-round-1/`](./2026-10-probes-2/recheck-round-1/). Every second-round item was re-run independently while writing that round's report, except those marked *(not re-run)*. Where two audits found the same problem, the entry keeps the **oldest id** and lists the others.

**Reading an entry.** The id says where it came from: `C-`, `S-`, `O-` and `R-` are first-round ids (custom rules, options, outputs, rules); `NM-`, `VS-`, `ST-`, `OP-`, `RP-` and `RB-` are second-round ids (names, visual, structure, options, reporters, robustness). Ids never change and are never reused. Verdicts and severities are defined in the [README](./README.md#running-an-audit). The **Details** link leads to the full evidence: repro, spec quotes, other engines' results, cause.

---

## 1. Open — to fix

Sorted by severity, then by how many pages it touches. Next to fix: R-14.

| # | Finding | Verdict | Severity | Found in |
|---|---|---|---|---|
| [R-14](#r-14) | Input values and placeholders are never contrast-checked | Gap | Medium | Round 1 |
| [R-11](#r-11) | target-size-minimum measures the bounding box | Bug | Medium | Round 1 |
| [VS-8](#vs-8) | target-size-minimum exempts any inline link in a `li`, `td` or `p` | Gap | Medium | Round 2 |
| [VS-4](#vs-4) | link-in-text-block misses an `::after` underline and other cues | Bug | Medium | Round 2 |
| [VS-3](#vs-3) | avoid-inline-spacing fails values exactly at the minimum | Bug | Medium | Round 2 |
| [VS-6](#vs-6) | css-orientation-lock fails rules that match nothing, and tiny icons | Bug | Medium | Round 2 (and round 1, suspected) |
| [VS-7](#vs-7) | text-spacing-content-loss: clipping ignores containing blocks | Bug | Medium | Round 2 |
| [VS-9](#vs-9) | `-webkit-text-fill-color` ignored | Bug | Medium | Round 2 |
| [NM-5](#nm-5) | form-control-single-label counts labels HTML doesn't associate | Bug | Medium | Round 2 |
| [NM-6](#nm-6) | label-in-name adds a `<select>`'s options to its label | Bug | Medium | Round 2 |
| [NM-7](#nm-7) | An SVG `<title>` counts only as the first child | Bug | Medium | Round 2 |
| [ST-1](#st-1) | Definition lists don't read the flat tree | Inconsistency | Medium | Round 2 |
| [ST-2](#st-2) | td-has-header misreads `rowspan="0"` | Bug | Medium | Round 2 |
| [ST-3](#st-3) | iframe-focusable-content counts elements that can't take focus | Bug | Medium | Round 2 |
| [RB-3](#rb-3) | image-redundant-alt is quadratic | Bug (perf) | Medium | Round 2 |
| [R-18](#r-18) | jsdom scans of CSS-heavy pages are very slow | Bug (perf) | Medium | Round 1 (§5.4 of the outcomes log) |
| [S-6](#s-6) | Wrong option types, including a non-string `contextSelector`, are accepted silently | Bug | Medium | Round 1, round 2 (OP-4) |
| [OP-1](#op-1) | A comma inside `:not(…)` splits an `excludeSelectors` string | Bug | Medium | Round 2 |
| [OP-2](#op-2) | Contrast rules ignore `excludeSelectors` on a shadow host | Bug | Medium | Round 2 |
| [OP-3](#op-3) | `region` ignores `excludeSelectors` | Bug | Medium | Round 2 |
| [OP-5](#op-5) | Cross-frame scans enter iframes in excluded subtrees | Bug | Medium | Round 2 |
| [C-9](#c-9) | A `fail` with no occurrences: accepted by the engine, then shown as a pass by JUnit, SARIF and baselines | Bug | Medium | Round 1, round 2 (RP-2) |
| [RP-3](#rp-3) | A rule that threw is invisible in SARIF, JUnit and the HTML report | Bug | Medium | Round 2 |
| [RP-4](#rp-4) | JUnit takes a criterion's outcome from its first composite only | Bug | Medium | Round 2 |
| [RP-5](#rp-5) | The HTML report fails contrast itself | Bug | Medium | Round 2 |
| [RP-6](#rp-6) | EARL: input order can erase a failure | Bug | Medium | Round 2 |
| [C-14](#c-14) | Under a profile, an untagged custom rule never runs, and an untagged override removes a built-in | Bug (doc) | Medium | Round 1 |
| [O-8](#o-8) | The `/browser` subpath is empty for bundlers, though documented for them | Bug (doc) | Medium | Round 1 |
| [O-13](#o-13) | Cross-frame entries don't identify their iframe | Bug | Medium | Round 1 |
| [NM-9](#nm-9) | label-in-name: invisible characters and curly apostrophes | Bug | Low | Round 2 |
| [NM-10](#nm-10) | aria-hidden-focus skips `aria-hidden="TRUE"` | Inconsistency | Low | Round 2 |
| [NM-11](#nm-11) | label-in-name skips `<input type="submit" value>` | Gap | Low | Round 2 |
| [NM-12](#nm-12) | Smaller name-computation slips | Bug | Low | Round 2 |
| [VS-10](#vs-10) | `-webkit-text-stroke` isn't a computability blocker | Bug | Low | Round 2 |
| [VS-11](#vs-11) | `::first-line` / `::first-letter` colours ignored | Bug | Low | Round 2 |
| [VS-13](#vs-13) | link-in-text-block treats `\|` between links as text | Debatable | Low | Round 2 |
| [R-10](#r-10) | text-spacing-content-loss: partly clipped text, and its margin | Bug | Low | Round 1 |
| [R-12](#r-12) | auditorAssist ignores `color-scheme: dark` | Bug | Low | Round 1 |
| [R-14b](#r-14b) | Large-text size ignores `zoom` and SVG scaling | Bug | Low | Round 1, round 2 (VS-12) |
| [R-14c](#r-14c) | Alt-quality wording for star ratings; two alt-quality rules have no cap | Bug | Low | Round 1 |
| [R-15](#r-15) | jsdom and Chromium differ in the last digits of some ratios | Bug | Low | Round 1 (suspected) |
| [R-16](#r-16) | text-spacing overlap check grows faster than linear in one band | Bug (perf) | Low | Round 1 (suspected) |
| [R-17](#r-17) | `perfStats.ruleTimings` charges style-cache warm-up to the wrong rule | Bug | Low | Re-check of round 1 |
| [ST-4](#st-4) | listitem-parent-valid rejects `role="directory"` | Bug | Low | Round 2 |
| [ST-5](#st-5) | Meta refresh `content` parsing differs from HTML | Bug | Low | Round 2 |
| [ST-6](#st-6) | html-xml-lang-mismatch with an invalid `lang` | Bug / Debatable | Low | Round 2 |
| [ST-7](#st-7) | Smaller HTML parsing slips (`usemap` case, `section-`, `scope`, text in `ul`) | Bug | Low | Round 2 |
| [ST-8](#st-8) | valid-lang reads light-DOM children *(not re-run)* | Inconsistency | Low | Round 2 |
| [ST-9](#st-9) | valid-lang calls `qaa` "not syntactically valid" | Bug (wording) | Low | Re-check of round 1 |
| [RB-4](#rb-4) | Selector checks are quadratic on wide sibling lists | Bug (perf) | Low | Round 2 (reopens a cost round 1 accepted) |
| [RB-5](#rb-5) | A throwing `shadowRoot` getter breaks about 77 rules | Bug | Low | Round 2 |
| [RB-6](#rb-6) | An SVG document fails page-title-present | Bug | Low | Round 2 |
| [RB-7](#rb-7) | A depth-limit downgrade is reported through `error` | Bug (doc) | Low | Round 2 |
| [RB-8](#rb-8) | aria-hidden-focus changes pages that react to focus | Debatable | Low | Round 2 |
| [S-4](#s-4) | Selection forms that still run every rule, or none | Bug | Low | Round 1, round 2 (OP-6) |
| [C-3](#c-3) | Custom rules that still vanish without a trace | Bug | Low | Round 1, round 2 (OP-7) |
| [C-8](#c-8) | A rule's return is copied onto the result unchecked | Bug | Low | Round 1, round 2 (OP-8) |
| [C-17](#c-17) | EARL drops `isPartOf` without `conformanceLevel` | Bug | Low | Round 1 |
| [C-19](#c-19) | `index.d.ts` behind the docs | Bug | Low | Round 1, round 2 (OP-10) |
| [C-22](#c-22) | Scaffolding a profile named `acme-std` fails core's boundary test | Bug | Low | Round 1 (wrongly closed) |
| [C-23](#c-23) | An invalid `applicability` makes a custom rule apply everywhere | Bug | Low | Round 1 (suspected) |
| [C-24](#c-24) | An invalid `uncertainty.code` is dropped silently | Bug | Low | Round 1 (suspected) |
| [C-25](#c-25) | A rule returning `type: 'manual'` is still reported as automatic | Bug | Low | Re-check of round 1 |
| [OP-9](#op-9) | Cross-frame scans miss iframes in shadow roots, or the scoped iframe | Bug | Low | Round 2 |
| [O-6](#o-6) | SARIF fingerprints are long and raw; non-`file:` URIs unencoded | Bug | Low | Round 1 |
| [O-7](#o-7) | Under a strict CSP a string custom rule is skipped without saying why | Bug | Low | Round 1 |
| [O-9](#o-9) | `./i18n/*` unusable from Node and missing from API_STABILITY.md | Bug (doc) | Low | Round 1 |
| [O-14](#o-14) | `src/explain/` isn't shipped and is incomplete | Debt | Low | Round 1 |
| [O-16](#o-16) | An occurrence's `html` can end in half a character | Bug | Low | Round 1 (suspected) |
| [RP-7](#rp-7) | Smaller reporter slips (dead schema URL, locale chip, `%`, catalog level, EARL.md) | Bug | Low | Round 2 |
| [S-13](#s-13) | I18N.md's key counts are stale again | Bug (doc) | Low | Round 1 |

### High

### Medium

<a id="r-14"></a>**R-14. Input values and placeholders are never contrast-checked** — Gap, Medium · [details](./2026-10-stress-test.md) (R-14)
- *In plain words:* text typed in a field, and placeholder text, are not checked at all.
- Example: `<input value="Typed value" style="color:#ccc">`: `notApplicable`. A `<textarea>` is checked.
- Where: only submit, button and reset inputs are collected (`contrast-helpers.js:645-646`).

<a id="r-11"></a>**R-11. target-size-minimum measures the bounding box** — Bug, Medium · [details](./2026-10-stress-test.md) (R-11)
- *In plain words:* the rule measures the box around a target, not the part a user can actually hit.
- Re-checked: a target clipped to 10×10 is measured 40 (passes); one two-thirds covered is measured 30; a rotated 20×20 square is measured larger; a `display:contents` link isn't a target; 23.97 px reads "Target is 24×30 … under 24×24".
- Where: `getBcr` (`target-size-minimum.js:269-276`, used at `:479`); message rounding (`:777,799`).

<a id="vs-8"></a>**VS-8. target-size-minimum exempts any inline link inside a `li`, `td` or `p`** — Gap, Medium · [details](./2026-10-stress-test-2.md#vs-8)
- *In plain words:* tiny pagination links "1 2 3", each in its own list item, pass as if they were in a sentence. (Engines A and B both fail them.)
- Basis: WCAG 2.5.8's inline exception needs the target to be "in a sentence".
- Where: `isInlineTextExceptionTarget` (`target-size-minimum.js:240`).

<a id="vs-4"></a>**VS-4. link-in-text-block misses common non-colour cues** — Bug, Medium · [details](./2026-10-stress-test-2.md#vs-4)
- *In plain words:* links underlined with an `::after` line, or shown as a code chip, are said to rely on colour alone.
- Examples: `a::after { content:""; height:1px; background:#333; … }`: `fail`; `<a><code style="background:#ddd">fetch()</code></a>`: `fail`.
- Where: `EMPTY_CONTENT` (`link-in-text-block.js:396`); `cueOnContent` (`:557`) ignores backgrounds.

<a id="vs-3"></a>**VS-3. avoid-inline-spacing fails values exactly at the minimum** — Bug, Medium · [details](./2026-10-stress-test-2.md#vs-3)
- *In plain words:* `line-height: 1.5` is exactly what WCAG asks, but rounding makes it 1.4999966 at some font sizes, and the rule fails it.
- Example: `<p style="font-size:11pt; line-height:1.5 !important">`: `fail`. Also wrong `cantTell`s in text-spacing-content-loss.
- Where: strict comparisons in `avoid-inline-spacing.js:271,319` and `text-spacing-content-loss.js:153`.

<a id="vs-6"></a>**VS-6. css-orientation-lock fails rules that match nothing, and tiny icons** — Bug, Medium · [details](./2026-10-stress-test-2.md#vs-6) · also first-round suspected item
- *In plain words:* an orientation rule for a class the page doesn't use is reported as "locking the page".
- Example: `@media (orientation: portrait) { .does-not-exist { transform: rotate(90deg) } }`: `fail`; should be `notApplicable` (ACT b33eff applies to visible elements).
- Also: a 10×10 decorative icon rotated 90° fails. ACT applies to any visible element, so that part is a decision rather than a bug.
- Where: `css-orientation-lock.js:246,262-264`.

<a id="vs-7"></a>**VS-7. text-spacing-content-loss: clipping ignores containing blocks** — Bug, Medium · [details](./2026-10-stress-test-2.md#vs-7)
- *In plain words:* a dropdown positioned outside an `overflow:hidden` box is reported as cut off, though it's fully visible.
- Where: `clippersOf` (`text-spacing-content-loss.js:336`) treats every `overflow:hidden` ancestor as a clipper.

<a id="vs-9"></a>**VS-9. `-webkit-text-fill-color` ignored** — Bug, Medium · [details](./2026-10-stress-test-2.md#vs-9)
- *In plain words:* the engine measures `color`, but this property sets the colour actually painted.
- Example: `color:#eee; -webkit-text-fill-color:#000` (black on white): `fail` 1.16:1.
- Where: `computeEffectiveForeground` (`contrast-helpers.js:~1463`), `isUndrawn` (`~460`).

<a id="nm-5"></a>**NM-5. form-control-single-label counts labels HTML doesn't associate** — Bug, Medium · [details](./2026-10-stress-test-2.md#nm-5)
- *In plain words:* the rule says a field has two labels when HTML gives it one.
- Example: `<label>From <input> to <input id="to"></label><label for="to">End</label>`: `#to` "has 2 labels"; a wrapping label only labels its first field.
- Where: `form-control-single-label.js:97-125`; use `getAssociatedLabelElements` (`dom-helpers.js:1796`).

<a id="nm-6"></a>**NM-6. label-in-name adds a `<select>`'s options to its label** — Bug, Medium · [details](./2026-10-stress-test-2.md#nm-6)
- Example: `<label>Quantity <select aria-label="Quantity"><option>1</option>…</select></label>`: `fail` ("Quantity 1 2"); should be `notApplicable`, since a select doesn't take its name from content.

<a id="nm-7"></a>**NM-7. An SVG `<title>` counts only as the first child** — Bug, Medium · [details](./2026-10-stress-test-2.md#nm-7)
- Example: `<svg role="img"><circle …/><title>Star</title></svg>`: `fail`.
- Basis: SVG-AAM names an element from "at least one direct child title element", in any position.
- Where: `nonEmptyFirstChildTitleText` (`svg-text-alternative-present.js:113-126`).

<a id="st-1"></a>**ST-1. Definition lists don't read the flat tree** — Inconsistency, Medium · [details](./2026-10-stress-test-2.md#st-1)
- Example: `<x-dl><dt>a</dt><dd>b</dd></x-dl>` rendering `<dl><slot>`: both dl rules fail. `ul`/`li` were fixed for the same pattern in 1.10.0.

<a id="st-2"></a>**ST-2. td-has-header misreads `rowspan="0"`** — Bug, Medium · [details](./2026-10-stress-test-2.md#st-2)
- *In plain words:* `rowspan="0"` means "to the end of the group"; read as no span, every column shifts and correct cells fail.
- Where: `td-has-header.js:135`.

<a id="st-3"></a>**ST-3. iframe-focusable-content counts elements that can't take focus** — Bug, Medium · [details](./2026-10-stress-test-2.md#st-3)
- Examples inside `<iframe tabindex="-1">`: a button in `<fieldset disabled>`, `<div tabindex="abc">`, an `<area>` of an unused map: each `fail`.
- Where: the selector at `iframe-focusable-content.js:238`.

<a id="rb-3"></a>**RB-3. image-redundant-alt is quadratic** — Bug (perf), Medium · [details](./2026-10-stress-test-2.md#rb-3)
- Example: N images side by side in Chromium: 1,000 → 0.53 s, 2,000 → 1.76 s, 4,000 → 7.19 s.
- Where: `image-redundant-alt-manual.js:63-90` re-reads every sibling's text for each image.

<a id="r-18"></a>**R-18. jsdom scans of CSS-heavy pages are very slow** — Bug (perf), Medium · [details](./2026-10-stress-test-outcomes.md) (§5.4)
- *In plain words:* under jsdom (the CLI's default), a page with many CSS rules takes tens of seconds. Real sites: about 110 s for the Daily Mail and 140 s for CNN in the first round.
- Re-checked on a synthetic page: 1,000 elements with 1,000 CSS rules, 11 s; with 4,000 rules, 35 s; 2,000 elements with 4,000 rules, 62 s. The cost grows with elements × rules, in jsdom's style computation, filled by whichever rule asks first.

<a id="s-6"></a>**S-6. Wrong option types are accepted silently** — Bug, Medium · [details](./2026-10-stress-test-2.md#op-4) · also OP-4
- *In plain words:* options of the wrong type are ignored or misread without a word, so a scan quietly does something else than asked.
- Re-checked:
  - `contextSelector` as an element, a NodeList, `{ include, exclude }`, a number or `[5]`: **the whole page is scanned**, with `contextSelector: null` (OP-4, the most serious part).
  - `wcagVersion: 2.1` (a number) gives 2.2; `profile: 5`; `timestamp: new Date()` gives `null`; `pageUrl: {}` is copied into `result.url`.
  - The `optInRules` warning ends "one of: )." because the list of opt-in tags is empty.
- Where: `resolveContextRoots` (`dom-helpers.js:70-84`), `dom-runner.js:688,691-695,1008,1041`.

<a id="op-1"></a>**OP-1. A comma inside `:not(…)` splits an `excludeSelectors` string** — Bug, Medium · [details](./2026-10-stress-test-2.md#op-1)
- Example: `excludeSelectors: 'img:not(.a, .b)'` becomes `img:not(.a` and `.b)`.
- Where: `normalizeSelectorList` (`dom-helpers.js:44-50`).

<a id="op-2"></a>**OP-2. Contrast rules ignore `excludeSelectors` on a shadow host** — Bug, Medium · [details](./2026-10-stress-test-2.md#op-2)
- Where: `isExcluded` (`dom-helpers.js:1134`) never steps from a shadow root to its host.

<a id="op-3"></a>**OP-3. `region` ignores `excludeSelectors`** — Bug, Medium · [details](./2026-10-stress-test-2.md#op-3)
- *In plain words:* the docs' own example, excluding a cookie banner, doesn't work for this rule.
- Where: `region-manual.js` from line 113.

<a id="op-5"></a>**OP-5. Cross-frame scans enter iframes in excluded subtrees** — Bug, Medium *(not re-run)* · [details](./2026-10-stress-test-2.md#op-5)
- Where: `frame-scan.js:112-115`.

<a id="c-9"></a>**C-9. A `fail` with no occurrences** — Bug, Medium · [details](./2026-10-stress-test-2.md#rp-2) · also RP-2
- *In plain words:* a rule can say `fail` without naming an element; the reporters then show it as a pass, so a CI gate lets it through.
- Re-checked, engine side: `fail` with `[]` stays `fail`; `pass` and `notApplicable` keep occurrences; non-array occurrences become `[]`; `1`, `'s'` or `null` occurrences become `{}`; a non-element `__node` gets `selector: "html"` (`build-core.js:1548-1560`).
- Reporter side (RP-2): JUnit `failures="0"`, SARIF 0 results, baseline 0 entries; the HTML report says "1 failure" with no card (`junit.js:144`, `sarif.js`, `baseline.js`).

<a id="rp-3"></a>**RP-3. A rule that threw is invisible in SARIF, JUnit and the HTML report** — Bug, Medium · [details](./2026-10-stress-test-2.md#rp-3)
- Where: `junit.js:320,332` (`errors="0"` hard-coded); `sarif.js` reads occurrences only.

<a id="rp-4"></a>**RP-4. JUnit takes a criterion's outcome from its first composite only** — Bug, Medium · [details](./2026-10-stress-test-2.md#rp-4)
- Example: WCAG 4.1.2's suite is labelled `pass` while containing a failure.
- Where: `junit.js:236`.

<a id="rp-5"></a>**RP-5. The HTML report fails contrast itself** — Bug, Medium · [details](./2026-10-stress-test-2.md#rp-5)
- Example: status chips at 4.11:1 and 3.03:1; dark-mode headings at 2.38:1.
- Where: `report.js:19-24,680-695`.

<a id="rp-6"></a>**RP-6. EARL: input order can erase a failure** — Bug, Medium · [details](./2026-10-stress-test-2.md#rp-6)
- Example: `[failing, passing]` scans of one URL give `earl:passed`; the docs promise the same output in any order.
- Where: `earl.js:158`.

<a id="c-14"></a>**C-14. Under a profile, an untagged custom rule never runs** — Bug (doc), Medium · [details](./2026-10-stress-test.md) (C-14)
- *In plain words:* with a profile set, a custom rule without WCAG tags is silently not run, and is not listed as skipped. An override of a built-in without its tags removes the built-in, so the criterion drops to `cantTell`.
- Re-checked under `profile: 'wcag22-aa'`; ENGINE_OPTIONS.md still says nothing. Fix: document it, or warn and list the rule in `skippedCustomRules`.

<a id="o-8"></a>**O-8. The `/browser` subpath is empty for bundlers** — Bug (doc), Medium · [details](./2026-10-stress-test.md) (O-8)
- Re-checked: `import b from '@surea11y/core/browser'` through esbuild gives an empty object; only `window.a11ycore` is set. API_STABILITY.md:30 still says it is for bundlers.
- Where: the wrapper in `scripts/build-browser.js:152,192`.

<a id="o-13"></a>**O-13. Cross-frame entries don't identify their iframe** — Bug, Medium · [details](./2026-10-stress-test.md) (O-13)
- *In plain words:* a frame that failed to load is reported as `about:blank`, and nothing says which `<iframe>` it was.
- Where: `frame-scan.js:68-77,116-150`.

### Low

<a id="nm-9"></a>**NM-9.** label-in-name: a soft hyphen or zero-width space splits a word, and "Don’t" ≠ "Dont" fails · [details](./2026-10-stress-test-2.md#nm-9). Where: `tokenize` (`label-in-name.js:134`).

<a id="nm-10"></a>**NM-10.** aria-hidden-focus skips `aria-hidden="TRUE"` (`aria-hidden-focus.js:721`) · [details](./2026-10-stress-test-2.md#nm-10).

<a id="nm-11"></a>**NM-11.** label-in-name skips `<input type="submit" value="Go" aria-label="Search site">` · [details](./2026-10-stress-test-2.md#nm-11).

<a id="nm-12"></a>**NM-12.** Smaller name-computation slips *(not re-run)*: embedded controls in `aria-labelledby` give all options or nothing, "Name Name" doubling, `for=" x"` trimmed, `tabindex="-1x"` not parsed as −1, SVG `<a xlink:href>` not focusable · [details](./2026-10-stress-test-2.md#nm-12).

<a id="vs-10"></a>**VS-10.** `-webkit-text-stroke` isn't a computability blocker: outlined text is measured by its fill (`contrast-helpers.js:~1819`) · [details](./2026-10-stress-test-2.md#vs-10).

<a id="vs-11"></a>**VS-11.** `::first-line` and `::first-letter` colours are ignored · [details](./2026-10-stress-test-2.md#vs-11).

<a id="vs-13"></a>**VS-13.** link-in-text-block treats `|` between footer links as surrounding text (Debatable) · [details](./2026-10-stress-test-2.md#vs-13).

<a id="r-10"></a>**R-10.** text-spacing-content-loss: text already partly clipped (a fixed-height excerpt, `line-clamp`) is `notApplicable`; text 2 px outside its box is a passing margin with 6.5 px headroom, while 3 px is a finding (`text-spacing-content-loss.js:435-447,556,563,593`) · [details](./2026-10-stress-test.md) (R-10).

<a id="r-12"></a>**R-12.** auditorAssist assumes a white canvas under `color-scheme: dark`: `#bbb` text fails at 1.92 against `#fff` (`contrast-helpers.js:553-557,1496-1499`). Re-checked · [details](./2026-10-stress-test.md) (R-12).

<a id="r-14b"></a>**R-14b.** Large-text size ignores `zoom` (`<p style="font-size:12px; zoom:2">` is judged as 12 px) and SVG `viewBox` scaling (`contrast-helpers.js:773`) · also VS-12 · [details](./2026-10-stress-test-2.md#vs-12).

<a id="r-14c"></a>**R-14c.** Alt-quality: "★★★★☆" is called "a placeholder or a generic word" (`dom-helpers.js:3805-3810`); area-alt-quality and input-image-alt-quality have no 50-occurrence cap (`area-alt-quality-manual.js:358`, `input-image-alt-quality-manual.js:276`) · [details](./2026-10-stress-test.md) (R-14).

<a id="r-15"></a>**R-15.** Translucent text on a translucent background gives 3.344081618017952 in Chromium and …951 in jsdom: a different compositing path. Round the ratios or use one order.

<a id="r-16"></a>**R-16.** text-spacing-content-loss's overlap check in one band: 500/1,000/2,000/3,000 spans take 50/126/332/740 ms; bounded at 3,000 nodes (`text-spacing-content-loss.js:126,647-692`).

<a id="r-17"></a>**R-17.** `perfStats.ruleTimings` charges the computed-style cache warm-up to the first rule that walks visibility: `aria-valid-attr` in a full scan, a rule that reads no styles. Anyone tuning from per-rule timings looks at the wrong rule.

<a id="st-4"></a>**ST-4.** listitem-parent-valid fails `<ol role="directory"><li>`; ARIA lists `directory` as a required parent of `listitem` · [details](./2026-10-stress-test-2.md#st-4).

<a id="st-5"></a>**ST-5.** Meta refresh parsing: `.5`, `5.5.5` and a leading no-break space are read differently from HTML's algorithm, and a meta the browser ignores is judged (`meta-refresh-timing-absent.js:100`, `meta-refresh-no-exceptions.js:106`) · [details](./2026-10-stress-test-2.md#st-5).

<a id="st-6"></a>**ST-6.** html-xml-lang-mismatch fails `lang="xx" xml:lang="yy"`, where ACT doesn't apply (Bug); and `xml:lang="x-foo"` (Debatable) · [details](./2026-10-stress-test-2.md#st-6).

<a id="st-7"></a>**ST-7.** Smaller HTML slips: `usemap` matched case-insensitively and never by `id`; `section-` alone rejected; NBSP splits autocomplete tokens; `scope` checked on any element and trimmed; text directly in `<ul>` not reported · [details](./2026-10-stress-test-2.md#st-7).

<a id="st-8"></a>**ST-8.** valid-lang reads light-DOM children, not the flat tree (`valid-lang.js:143`) *(not re-run)* · [details](./2026-10-stress-test-2.md#st-8).

<a id="st-9"></a>**ST-9.** valid-lang says `lang="qaa"` is "not a syntactically valid" tag. Failing it is the decided behaviour (§4), but `qaa` is syntactically valid: the message should say it names no known language.

<a id="rb-4"></a>**RB-4.** Selector checks with `el.matches(…:nth-of-type(k))` are O(siblings) in Blink: 1.6 s for 16,000 flat `<img>` findings, and far worse in jsdom (97.9 s for `heading-quality` at 8,000). The first round accepted this as linear; it isn't on flat lists (`dom-helpers.js:4932`) · [details](./2026-10-stress-test-2.md#rb-4).

<a id="rb-5"></a>**RB-5.** One custom element whose `shadowRoot` getter throws puts about 77 rules into `cantTell` (`dom-helpers.js:1259,1288`) · [details](./2026-10-stress-test-2.md#rb-5).

<a id="rb-6"></a>**RB-6.** An SVG document opened on its own fails page-title-present, at a `head > title` that doesn't exist · [details](./2026-10-stress-test-2.md#rb-6).

<a id="rb-7"></a>**RB-7.** The ancestor depth-limit downgrade is reported in `error`, which OUTPUT_SCHEMA.md reserves for thrown rules *(not re-run)* · [details](./2026-10-stress-test-2.md#rb-7).

<a id="rb-8"></a>**RB-8.** aria-hidden-focus moves focus, and a page that reacts to it gives different findings per scan; LIMITATIONS.md says findings are unaffected (Debatable) *(not re-run)* · [details](./2026-10-stress-test-2.md#rb-8).

<a id="s-4"></a>**S-4.** Selection forms that still run every rule, or none, silently · also OP-6 · [details](./2026-10-stress-test-2.md#op-6)
- `{ type: 'tag', values: 'wcag2aaaa' }` (a string) runs all 134 rules; `excludeTags` beside `{ type, values }` is dropped; `engineOptions.tags`, `engineOptions.rules: [...]`, a `Set`, an unknown key beside a known one: all run everything.
- The legacy `a11ycore-` prefix on a composite id removes the composite but not its rules.
- `includeTestIds` / `tests.include` typos run 0 rules.
- Rule ids are case-sensitive (`['IMG-ALT-PRESENT']` throws) while tags aren't (`['WCAG2A']` runs 89).

<a id="c-3"></a>**C-3.** Custom rules that still vanish without a trace · also OP-7 · [details](./2026-10-stress-test-2.md#op-7)
- `customRules` given as one object (not an array): ignored, no warning, `skippedCustomRules: []`. The first round's fix covered other cases, not this one.
- Id `__proto__`: not run, not listed; `runOnly: ['__proto__']` runs 0 rules.
- `runOnly` naming only rules that were skipped runs 0 rules with no error.
- `meta.tags: 'mytag'` (a string) is dropped.

<a id="c-8"></a>**C-8.** A rule's return is copied onto the result unchecked · also OP-8
- A returned `wcagVersionScope`, `engineOptions` or any key reaches the result; a returned `engineOptions.output` can switch off the rule's own selectors; occurrence-level `severity` and `confidence` aren't checked (`build-core.js:1467,1487,1552`).
- A returned `error` replaces the engine's own note about a coercion (`build-core.js:1662`).

<a id="c-17"></a>**C-17.** EARL leaves out `isPartOf` unless a WCAG mapping carries `conformanceLevel`, `title` and `standard`; SARIF treats a mapping without `standard` as WCAG, EARL doesn't (`earl.js:66`, `sarif.js:81`).

<a id="c-19"></a>**C-19.** `index.d.ts` behind the docs · also OP-10: `CustomRule.meta` required though optional; no `RuleContext`/`RuleHelpers`; `LegacyTagRunOnly` allows only `type: 'tag'`; an `[option: string]: unknown` index signature lets typos in option names compile (`index.d.ts:35,88,95-102`).

<a id="c-22"></a>**C-22.** `npm run profile:new acme-std` produces a profile that fails core's own boundary test, because `tests/profile-new.test.js:53-102` hard-codes `acme-std`. The outcomes log closed this as "not a bug"; the re-check reproduces it. profiles/README.md:40 says the scaffold passes the check. Reserve the key, or use one nobody would choose.

<a id="c-23"></a>**C-23.** A custom rule whose `applicability` can't be revived (a syntax error, `'42'`, `5`, `{}`) is treated as always applicable: it runs everywhere, with no warning (`dom-runner.js:891`).

<a id="c-24"></a>**C-24.** An invalid `uncertainty.code` from a rule (`'NOT_A_CODE'`, `42`, `'NOT_COMPUTABLE'`) is removed with no note in `error` (`build-core.js:1620-1624`, `uncertainty.js:22-24`).

<a id="c-25"></a>**C-25.** A rule returning `type: 'manual'` gets the manual-`fail` coercion, but its result still says `type: 'automatic'` (`build-core.js:1497`).

<a id="op-9"></a>**OP-9.** Cross-frame scans don't find iframes in open shadow roots, find nothing when the scope is the iframe itself, and fail every child frame with a `DataCloneError` for function-valued custom rules *(not re-run)* (`frame-scan.js:33-50`) · [details](./2026-10-stress-test-2.md#op-9).

<a id="o-6"></a>**O-6.** SARIF fingerprints hold raw `\u0000` separators and up to about 2,050 characters of HTML; a non-`file:` URL is passed through unencoded (`"https://ex.com/a b"`) (`sarif.js:58`). Hashing fingerprints changes finding identity, so batch it with any other identity change.

<a id="o-7"></a>**O-7.** Under a strict CSP a string custom rule is listed as skipped, but the reason ("could not be turned back into a function") doesn't mention CSP, and there is no fallback.

<a id="o-9"></a>**O-9.** `require('@surea11y/core/i18n/de')` throws in Node ("load surea11y.browser.js first"), and `./i18n/*` is missing from the API_STABILITY.md table though BINDING_AUTHORS_GUIDE.md uses it.

<a id="o-14"></a>**O-14.** `src/explain/` isn't shipped or exported, cites a design doc that doesn't exist, groups `notApplicable` contrast results, and `coarseStructuralSignature` cuts `a[href="#top"]` to `a[href="`. Ship it or remove it.

<a id="o-16"></a>**O-16.** An occurrence's `html` is cut at 2,000 UTF-16 units, which can leave half an emoji (a lone surrogate) at the end (`dom-helpers.js:2081`). Cut at a code-point boundary.

<a id="rp-7"></a>**RP-7.** Smaller reporter slips: SARIF `$schema` URL returns 404; the HTML report shows a fallback chip for `locale: 'DE'`; percentages aren't localised; RULE_CATALOG.md shows only a rule's highest level; two EARL.md slips · [details](./2026-10-stress-test-2.md#rp-7).

<a id="s-13"></a>**S-13.** I18N.md says 863 keys; there are 865. Nothing checks the figure, so it goes stale with each new key.

---

## 2. Open — features (not bugs)

Missing capabilities nobody promised. Listed so they aren't reported again as bugs.

| # | Feature | From |
|---|---|---|
| C-13 | Custom rules joining WCAG composites by mapping; custom composites | Round 1 |
| C-15 | Catalog APIs (`getChecksCatalog`, `getCheckDefById`, `getChecksForRunOnly`) that see `customRules`; today a scan with `runOnly: ['z']` runs a custom `z` that `getChecksForRunOnly` doesn't know | Round 1 |
| C-16 | A custom rule's `helpUrl` and custom tags in the outputs | Round 1 |
| C-20 | Profiles without forking core (`profile-kit` export or a runtime option); profiles/README.md:67 also contradicts the scaffold's test imports | Round 1 |
| O-5 / P14 | `helpUrl` per rule (empty for 133 of 134) and Understanding URLs per criterion (6 of 120 mappings have one); SARIF `helpUri` | Round 1 |
| O-10 | Type declarations for the subpaths (`/sarif`, `/junit`, `/report`, `/earl`, `/baseline`, `/wcag`, `/en301549`) | Round 1 |
| O-12 | A compact output mode (an empty page's result is 200 KB) | Round 1 |
| P4 | JUnit, SARIF and the HTML report reading a cross-frame result (they throw; only EARL flattens; `flattenCrossFrameResult` isn't exported) | Round 1 |
| §7-9 | A `strictOptions` mode that throws on unknown or mistyped options | Round 1 |

---

## 3. Fixed — history

### Fixed, not yet in `main`

Fixes on branch `fix/audit-2026-10-findings-3` (from `main` at `e9da4f6`), pushed, no pull request yet.

<a id="r-1"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| R-1 | Paint that isn't an ancestor's: fixed and sticky paint ignored, stacked layers and solid covers not measured | Option B: work out the paint order. The text, its ancestors' backgrounds and the boxes overlapping it are ordered by the CSS painting order (stacking contexts, `z-index`, positioned boxes, floats, document order) and composited from the top; solid colors covering all of the text are measured against, anything else is `BACKGROUND_OVERLAP`. Found while fixing it and included: an ancestor's background counts only where its box is under the text and it is painted before it (text overflowing its box, text with a negative `z-index`), and a box is tested against every line of the text (it was tested only against the first line whose index cell held it). Fixed and sticky boxes count behind the text and stay left out over it. Left: a gradient under the text stays `cantTell`, as with Engine A and Engine B. | `aff80e6`, changelog `ea705c5` | [#101](https://github.com/SureA11y/core/issues/101) | 2026-10-07 |

How R-1 was checked: 100 generated layouts (positioned boxes with every kind of `z-index`, floats, negative-margin overlaps, inline-blocks, nested stacking contexts) were scanned and compared with the rendered pixels (the color under each text line with the text made transparent, and whether the text shows at all). Confident background colors that disagree with the screen: 373 on `main`, 0 on the branch, with no result that was right or `cantTell` on `main` becoming wrong; 82 wrong results became right, 290 became `cantTell`, and 41 right ones became `cantTell` (mostly text partly outside a box, which the pixel check samples at mid-line only). A first attempt at the comparison used the browser's hit-test order (`elementsFromPoint`) and was dropped: it lists a later block's background over earlier text, which the pixels show is painted under it. On the texts whose result changed, Engine A (which models the painting order) agrees: it is unsure of 200 of the 224 texts that became `cantTell` with real paint over or partly under them; Engine B gives a confident pass or fail on almost all of them, so it isn't a reference here (it also fails the fixed, sticky and positioned-box examples). On the finding's examples the branch matches Engine A on all six. The full suite passes (the same one environmental failure); two cases of the 1.10.0 overlap test, light text on solid black, are now measured and pass, as rendered. Cost: fixtures 1.025×, a large page 1.04×, after caching each box's paint role and box per scan.

<a id="r-13"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| R-13 (also VS-5) | The viewport `content` parser: spaces, odd values, several metas | Option A′: read the `content` attribute as browsers do, in both rules, and keep judging every viewport `<meta>`. Whitespace separates settings as `,` and `;` do; a setting with no value, or a value that isn't a number, counts as 0 (so it blocks zoom); `yes` is 1, `device-width` and `device-height` are 10; a number is read up to its first non-numeric character (`1.5x` is 1.5); a later setting replaces an earlier one with the same name; case is ignored; a negative `maximum-scale` is dropped. The parser is shared (`helpers.readViewportContent`), so the two rules no longer disagree. Left by choice: a page with two viewport metas, of which only the last applies in browsers, still fails when an earlier one blocks zoom. | `5f1186b`, changelog `13eb228` | [#102](https://github.com/SureA11y/core/issues/102) | 2026-10-07 |

How R-13 was checked: each case was loaded in Chromium with a mobile viewport and zoomed in with a pinch gesture (CDP `Input.synthesizePinchGesture`) to find the largest zoom the browser allows; 17 cases, among them the finding's. After the fix both rules agree with the browser on every one but the two-meta case (`user-scalable=no` then `width=device-width`, which Chromium lets the user zoom), which fails on purpose. On the finding's eight cases Engine B gives the same result as the branch on all eight, so it agrees with the browser on seven and also fails the two-meta case; Engine A agrees with the browser on four: it misses `user-scalable=no` after a space, `maximum-scale=abc` and `maximum-scale=no`, which all block zoom, and passes the two-meta case. The full suite passes (the same one environmental failure).

### Fixed after the second audit, second batch (in `main`)

Merged into `main` with pull request [#100](https://github.com/SureA11y/core/pull/100), 2026-10-06, which closed their issues. Commits are as they are in `main`.

<a id="vs-1"></a><a id="vs-2"></a><a id="rp-1"></a><a id="r-8"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| VS-1 | An element's own `opacity` was counted twice when it had its own background | Option A: an element whose own opacity is below 1 and which paints a background is measured as one group, through the routine already used for an ancestor's opacity; when an image, gradient, blend mode or filter stops that, `contrast-computable` reports `cantTell` with the new reason code `ELEMENT_OPACITY`. A page with no opaque background is left to the existing root-canvas handling. Without a background of its own, an element's opacity keeps the opacity product, which was already right. Left as it was: in `auditorAssist` mode, which assumes a canvas color for such a page, the badge still gets the old estimate. | `9721403`, docs `b32b4e7` | [#95](https://github.com/SureA11y/core/issues/95) | 2026-10-06 |
| VS-2 | SVG shapes behind SVG text were ignored | Option B: SVG shapes count as paint for the overlap check, so any shape under or over SVG text gives `cantTell` (`BACKGROUND_OVERLAP`); the simple case is measured: a `<rect>` with a solid fill, painted before the text, unrotated, covering all of it clear of rounded corners and stroke, with no grouping effect in between, is the text's background, with its `fill-opacity` and `opacity`. Needs a layout: under jsdom results are unchanged. | `6195c74`, changelog `92af3ff` | [#96](https://github.com/SureA11y/core/issues/96) | 2026-10-06 |
| RP-1 | SARIF output failed the SARIF schema (`toolExecutionNotices`) | Option B: the notes are written as `toolExecutionNotifications`, the schema's name, in the code, `SARIF.md` and the test; a new test validates the SARIF of a scan of every fixture page and of edge cases against the official SARIF 2.1.0 schema (kept in `tests/schemas/` with its source and OASIS notice; `ajv` becomes a direct dev dependency). A consumer that read the old name has to read the new one. | `b1e7b7d`, changelog `fa1f335` | [#97](https://github.com/SureA11y/core/issues/97) | 2026-10-06 |
| R-8 | Off-screen and clipped-away text was contrast-checked by default in a browser; layout mode dropped a `<select>`'s text | Option A: unset, `visibilityMode` is `'styleAndGeometry'` where the page has a layout (any browser scan) and `'styleOnly'` under jsdom; an explicit setting is honored. Layout mode judges a `<select>`'s options by the select's place on the page, so the selected value and the options of the open list are checked, as before. The debatable part, decided: the unselected options stay checked, since the list a select opens draws them with the author's colors (Chromium on Windows and Linux). | `b41cfe2`, changelog `e9da4f6` | [#99](https://github.com/SureA11y/core/issues/99) | 2026-10-06 |

How R-8 was checked: a Chromium test covers off-page text, text clipped by `height:0; overflow:hidden`, text below the fold, a select's faint selected value and faint unselected option, a select off the page, and both explicit settings (4 cases failed before). On the five audit cases the engine now matches Engine B exactly: off-page and clipped text not checked, the two select cases and below-the-fold text failed; Engine A agrees except that it passes the faint unselected option. Layout mode costs 1–3% of a large page's scan, measured in one build; the clipping ancestors are measured once per scan. The full suite passes (the same one environmental failure).

How RP-1 was checked: the SARIF of a Chromium scan of each of the 137 fixture pages, validated against the official schema, was invalid for 132 of them, all for this one property, and is now valid for all 137; nothing else in the output fails the schema. The new test fails on the old renderer. Engines A and B don't write SARIF, so there is nothing to compare. The full suite passes (the same one environmental failure). RP-7's dead `$schema` URL is a separate, still-open slip.

How VS-2 was checked: a Chromium test covers each case (11 assertions, all failing before): the black badge passes (15.46:1), dark text on a `#333` rect fails at 1.66:1, white text on a black rect is measured (it was dropped as the same color as the page), a rect at `fill-opacity:.5` gives the composited 3.95:1, rounded corners clear of the text are measured, and a circle, a gradient fill, a rotated rect, a rect covering part of the text and a rect painted over it are `cantTell`. HTML text beside an inline SVG icon is unaffected. Checked on the SVG text itself, Engine A reports every one of these cases as needing review (background overlap), and Engine B doesn't evaluate SVG text; the second audit's "A: pass, B: pass" counted other text on the probe page (corrected in the report). The full suite passes (the same one environmental failure); an SVG-heavy page (1,000 icons and a 300-bar labelled chart) costs about the same (1.04×, within noise).

How VS-1 was checked: the ratios were worked out by hand from how browsers composite a group, and the engine now matches them: `opacity:.6` white on black over white, 5.74:1 (was 3.22:1); `opacity:.3`, 2.09:1 (was 1.28:1); a 50% black background at `opacity:.6`, 2.09:1 (was 1.60:1). Cases already right are unchanged: own opacity without a background (3.95:1) and inside an opacity ancestor (3.69:1). Engine A gives the same ratios on all five; Engine B gets every pass and fail right. Two fixture cases were added (a badge, and one over a gradient for `ELEMENT_OPACITY`), and tests pin the ratios (9 failed before). The full suite passes (the same one environmental failure); no measurable cost (jsdom 0.96×).

### Fixed after the second audit (in `main`)

Merged into `main` with pull request [#94](https://github.com/SureA11y/core/pull/94), 2026-10-06, which closed their issues. Commits are as they are in `main`.

<a id="rb-1"></a><a id="rb-2"></a><a id="nm-1"></a><a id="nm-8"></a><a id="nm-2"></a><a id="nm-3"></a><a id="nm-4"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| RB-1 | A form field named `parentNode` or `parentElement` made the scan hang | Fix fully, together with RB-2: the engine and every rule read the DOM through accessors that look properties up on the prototypes of a form, a document or a window (`src/core/safe-dom.js`), rewritten by a committed script and enforced by a lint rule; a step limit on every ancestor walk as a safety net. A scan checks once whether any element is named after something the engine reads, and uses plain reads when none is, so ordinary pages are unaffected. | `97b969d`, docs `40dac3b` | [#90](https://github.com/SureA11y/core/issues/90) | 2026-10-06 |
| RB-2 | Named images and forms overrode `document` and form properties the engine reads | Same change as RB-1. | `97b969d` | [#90](https://github.com/SureA11y/core/issues/90) | 2026-10-06 |
| NM-1 | A role with a fallback (`role="foo button"`, `"none presentation"`) was read as no role, or as an invalid one | Fix fully, with NM-8: one resolver for an element's role (the first token naming a known role, in any case; none means no role, so the element keeps its implicit role), used by every rule for reading and selecting roles, and a lint rule against parsing `role` by hand. As a consequence `aria-allowed-attr` judges an element whose role names no known role by its implicit role. | `df297e7`, docs `821f38f` | [#91](https://github.com/SureA11y/core/issues/91) | 2026-10-06 |
| NM-8 | Upper-case roles (`role="BUTTON"`) were skipped by most name rules | Same change as NM-1. | `df297e7` | [#91](https://github.com/SureA11y/core/issues/91) | 2026-10-06 |
| NM-2 | `<label for>`, `aria-labelledby` and `headers` inside a shadow root weren't resolved; a reference from a shadow root to the page was | Fix in both directions, as the specs say and Chromium does: every ID reference resolves in the referring element's own tree (its shadow root, or the document), with a helper for rules (`getElementByIdInTree`) and the referring element passed to the IDREF helpers; a lint rule against looking an ID up in the document. Covers `for`, the ARIA ID references (names, descriptions, `aria-owns`), `headers`, `usemap` and the contrast exception for a disabled control's label. Fragment links keep resolving in the document, as HTML has them. Includes the first round's deferred "name computation across a shadow boundary". | `aae487c`, docs `90f76ae` | [#92](https://github.com/SureA11y/core/issues/92) | 2026-10-06 |
| NM-3 | label-in-name read `<b>Down</b>load` as "Down load" | Fix fully, with NM-4, in the shared name too: text joins as browsers lay it out. The name from content follows Chromium (no space between pieces in inline elements; a space around an element that isn't inline and around a piece that is a name of its own); label-in-name's visible label follows the visible inner text (a block-level box or `<br>` starts a new word, an inline-block doesn't). One shared `display` check (`getTextBoundaryKind`) decides both, blockifying positioned boxes, floats and flex or grid items as browsers do. | `16d4b32`, docs `ceb26d1` | [#93](https://github.com/SureA11y/core/issues/93) | 2026-10-06 |
| NM-4 | label-in-name counted visually hidden text as visible | Same change as NM-3: text in a box that is clipped away, at most 1×1 px with its overflow hidden, or fully transparent is not part of the visible label (`isVisuallyHidden`). | `16d4b32` | [#93](https://github.com/SureA11y/core/issues/93) | 2026-10-06 |

How it was checked: a harness that wraps each of the 130 fixture pages in a form with a field named after every property of every HTML and SVG element type, and adds images named after every `document` property, gives the same results as the same page with harmless names (0 changes, 0 hangs, 0 errors; 3,691 changes and 49 errors before), with forms only, `document` only and both. The new Chromium test fails on `main` and passes on the branch; the full suite passes (the one failure needs Playwright's default browser build, and fails on `main` too). Cost: about the same on a large page, about 2 ms a scan on small pages for the page check.

How NM-3 and NM-4 were checked: Chromium's accessibility tree and `innerText` were read for each case (inline, inline-block, block, flex item, `<br>`, image, `aria-label` on a span, hidden and clipped spans), and the engine's name and visible label now match them; tests pin each case for the shared name and for label-in-name, and three fixture cases were added (12 of the new tests failed before). Engines A and B on label-in-name, final code: all three agree on inline splits, real spaces, `<br>`, inline-block and the screen-reader-only, opacity and clip patterns, except that B fails text hidden with `clip-path: inset(50%)`, which we and A pass; on `<div>Down</div>load` against "Download…" A passes, B and we fail; on flex items (`<span style="display:flex"><span>Down</span><span>load</span></span>`) A and B pass, and we fail, since flex items are laid out as blocks and Chromium's visible text is "Down⏎load", as ACT's visible inner text reads it. The full suite passes (the same one environmental failure); no measurable cost (Chromium: fixtures 1.01×, large page 0.95×; jsdom 1.00×).

How NM-2 was checked: a new test runs each changed rule with the reference inside a shadow root and across its boundary, both ways (18 cases, `tests/engine-checks/tree-scoped-id-references.test.js`; 15 failed before). Chromium's accessibility tree gives the same names: a label or `aria-labelledby` inside the shadow root names the control, and one across the boundary gives no name. Engines A and B agree on every label and name case. Where they differ: A passes `headers` pointing out of the shadow root (this engine fails an ID that resolves to nothing, as it does without a shadow root) and checks an `<area>` whose `<map>` no image in its tree uses; B fails `aria-owns` inside a shadow root. The full suite passes (the same one environmental failure); no measurable cost (fixtures 0.98×, jsdom 0.91×, large page 1.06× but within its noise: measured while another browser job ran, with runs from 2.97 to 4.11 s).

How NM-1 and NM-8 were checked: every fixture with a role attribute is scanned as written, with every `role="x"` as `role="zzunknown x"`, and with every role in upper case; no rule's result changes in either (`tests/role-tokens.test.js`; results in 51 rules changed before). Each changed rule's own tests pin a fallback list and an upper-case role. The full suite passes (the same one environmental failure); no measurable cost.

### Fixed by the first audit's follow-up (in 1.10.0)

Each fix was re-checked on `cfefc02` by re-running the original repro. Commits are on `main`; PR numbers are as recorded in the outcomes log. All shipped in **1.10.0** (`6b057bb`, released 2026-10-06).

| # | Finding | Commit on `main` | PR | Fixed |
|---|---|---|---|---|
| R-1 | Text over paint that isn't an ancestor's failed with high confidence (now `cantTell`, `BACKGROUND_OVERLAP`; what is left is in §1) | `a787ec1` | #77 | 2026-10-05 |
| R-2 | `oklch()`, `lab()`, `color()`, `color-mix()` backgrounds read as transparent | `da5f0df` | #77 | 2026-10-05 |
| O-1 | Page-level fingerprints changed with any content | `1060275` | #77 | 2026-10-05 |
| O-3 | Reporters rendered a cross-frame result, an array or garbage as a clean pass | `ec70090` | #77 | 2026-10-05 |
| O-4 | Shadow-DOM occurrences couldn't be located (`shadowHostSelectors`) | `da8c290` | #77 | 2026-10-05 |
| S-1 | Scoping to a shadow host skipped its shadow root | `04f29b3` | #77 | 2026-10-05 |
| C-1, C-2 | A bad `meta` aborted the scan; method-shorthand rules were dropped | `165d7b2` | #77 | 2026-10-05 |
| R-4 | The margin tie-break was O(n²) | `f6e7558` | #77 | 2026-10-05 |
| S-2 | Non-JSON option values made results unserialisable | `2cde0eb` | #77 | 2026-10-05 |
| S-3 | `policyContract: 'constructor'` crashed the scan | `c8b6849` | #77 | 2026-10-05 |
| S-4 (part) | An object-form `runOnly` naming nothing ran 0 rules | `190fc67` | #77 | 2026-10-05 |
| R-3 | Ancestor opacity counted twice | `36de323` | #77 | 2026-10-05 |
| R-5 | Margins lost after 50 failures | `2a00f12` | #77 | 2026-10-05 |
| — | Margin performance review: sibling index, link text per parent | `15cc3ff`, `23d3afc` | #77 | 2026-10-05 |
| O-5 (part) | `engine.version` on every result, in SARIF and EARL | `5e18bd7` | #78 | 2026-10-05 |
| O-6 (part) | SARIF invalid for findings without a summary and for odd file paths | `b92c20c` | #79 | 2026-10-05 |
| O-11 | The HTML report wasn't deterministic | `711c85e` | #79 | 2026-10-05 |
| C-18 | A padded custom rule id or tag wasn't found by `runOnly` | `dba1208` | #79 | 2026-10-05 |
| S-9, S-10 | Docs wrong on thrown rules and `allowedConfidence` | `507f37f` | #79 | 2026-10-05 |
| O-15 (part) | `/junit` missing from API_STABILITY.md | `885ef36` | #79 | 2026-10-05 |
| §6 lead | A focusable link or button with `role="none"` lost its name | `75be1ad` | #79 | 2026-10-05 |
| S-7 (doc) | What a scoped duplicate-id pass means | `60ae9d3` | #81 | 2026-10-05 |
| R-8 (part) | `font-size: 0` and `color: transparent` text contrast-checked | `0e9afba` | #81 | 2026-10-05 |
| R-9 | Orientation locks and focus suppression in nested CSS missed | `a1c2205` | #81 | 2026-10-05 |
| R-6 | link-in-text-block missed cues on the link's content | `325a598` | #82 | 2026-10-05 |
| R-7 | SVG text judged by `color` instead of `fill` | `eae2ce8` | #82 | 2026-10-05 |
| O-2 | Attribute and class order changed finding identity | `793dfac` | #82 | 2026-10-05 |
| C-3 (part), C-4, C-5, C-6, C-10, C-11 | Custom rules returning nothing usable, async, unknown outcomes, duplicate and composite ids: now reported (`skippedCustomRules`) | `e0dda1d` | #82 | 2026-10-05 |
| S-12 (part) | label-in-name tiers in `occurrenceOutcome`; policy options typed | `01f53d1` | #83 | 2026-10-05 |
| S-5 | An invalid `excludeSelectors` entry was silently ignored | `72ed495` | #83 | 2026-10-05 |
| O-15 | URL-less EARL subjects merged; bad `waitForPageReady` timeout silent | `ac7d507` | #83 | 2026-10-05 |
| C-12, C-19 (docs), S-8, S-11, S-13 (part) | Doc gaps and slips | `a6bbde9` | #83 | 2026-10-05 |
| S-4 (part) | The `{ type: 'rule', values }` form of `runOnly`, and `runOnly` typos | `1e39cfa` | #83 | 2026-10-05 |
| C-7 | Rule meta severity, confidence and type not validated | `5e83acc` | #83 | 2026-10-05 |
| — | Performance: page animations read once; overlap index | `fabbb13`, `7c2a2b3` | #84 | 2026-10-05 |
| §6 lead | label-in-name followed a referenced element's own `aria-labelledby` | `63b606c` | #84 | 2026-10-05 |
| §6 lead | A `for` label named every element sharing the id | `feb7e31` | #84 | 2026-10-05 |
| §6 lead | ARIA `TRUE` / `False` values not read | `6a968b1` | #84 | 2026-10-05 |
| §6 lead | Lists and nested controls not read in the flat tree | `e0a1925` | #84 | 2026-10-05 |
| §6 lead | ID references resolved in the document, not the element's tree (for aria-valid-attr-value; name computation is NM-2) | `393f015` | #84 | 2026-10-05 |
| §6 lead | A video poster in a captioned figure failed (now `cantTell`, decided) | `0d23436` | #84 | 2026-10-05 |

---

## 4. Closed without a fix

Checked and decided. Don't reopen without new evidence.

| # | Finding | Decision | Reason |
|---|---|---|---|
| C-21 | `profile:new` accepts the key `section508` | Not a bug | A scaffold's profile is `section508-1.0`; the built-in profile is unaffected. Re-checked. (Using `section508` both as a profile name and a `mappings` name can confuse; a note in the scaffold docs would help.) |
| S-7 (rest) | `deprecated-elements-not-used` and `server-side-image-map-absent` pass on an empty scope | Not a bug | They pass on a whole page with nothing relevant too; a scoped pass is consistent. |
| — | `getChecksCatalog({ profile: 'bogus' })` returns the full catalog | Not a bug | A profile changes mappings, not which rules are listed. (It doesn't warn about the unknown name, as a scan does: minor.) |
| — | `runOnly: []`, `''`, `{}` run every rule | Kept by decision | Pinned by a test, as documented. |
| — | `valid-lang` on `lang="en-"` passes | Not a bug | ACT de46e4 judges the primary subtag only. |
| — | `valid-lang` on `lang="qaa"` (private use) fails | Kept by decision (maintainer, 2026-10-05) | Documented behaviour; revisit if users report it. Its wording is ST-9. |
| — | label-in-name: "Download (PDF, 2 MB)" against visible "Download PDF" fails | Not a bug | ACT 2ee8b8 removes text in parentheses. |
| — | img-alt-decorative asks about an icon in an already named link | Not a bug | Intended review (ACT e88epe). |
| — | `aria-valid-attr` slow on 5,000 siblings | Not a bug | Linear; the time is the style cache (R-17). |
| R-8 (part) | `rgba(0,0,0,.02)` text fails | Not a bug | The text is drawn. |
| — | White text at 50% alpha on white fails at 1.00:1 | Not a bug | Same: the text is drawn. |
| P5 (limit) | `selector` and `structuralPath` don't cross shadow roots | By design | `shadowHostSelectors` carries the path. |
| — | About 40 KB kept per repeated browser scan | Not a bug | Re-checked: it levels off at about 1.3 MB after 45 scans; a bounded cache, not a leak. |
| — | A native `<marquee>` gives text-spacing-content-loss different answers | Not reproduced | 30 of 30 independent scans gave `pass`. Reopen with a repro. |
| — | §3 note: contrast on an unstyled page differed between jsdom and Chromium | Fixed by other changes | Both now give the same result. |
