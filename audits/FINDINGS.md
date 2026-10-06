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

Sorted by severity, then by how many pages it touches. Next to fix: NM-1.

| # | Finding | Verdict | Severity | Found in |
|---|---|---|---|---|
| [NM-1](#nm-1) | A role with a fallback (`role="foo button"`) is read as no role | Bug | **High** | Round 2 |
| [NM-2](#nm-2) | ID references inside a shadow root aren't resolved; one from a shadow root to the page is | Bug | **High** | Round 2 (and round 1 §6) |
| [NM-3](#nm-3) | label-in-name reads `<b>Down</b>load` as "Down load" | Bug | **High** | Round 2 |
| [NM-4](#nm-4) | label-in-name counts visually hidden text as visible | Bug | **High** | Round 2 |
| [VS-1](#vs-1) | An element's own `opacity` is counted twice | Bug | **High** | Round 2 |
| [VS-2](#vs-2) | SVG shapes behind SVG text are ignored | Bug | **High** | Round 2 |
| [RP-1](#rp-1) | SARIF output fails the SARIF schema | Bug | **High** | Round 2 |
| [R-8](#r-8) | Off-screen text is still contrast-checked by default; closed `<select>` options too | Debatable | Medium | Round 1 |
| [R-1](#r-1) | Paint that isn't an ancestor's: stacking, fixed and sticky paint ignored | Bug | Medium | Round 1 (limits of the fix) |
| [R-13](#r-13) | The viewport `content` parser: spaces, odd values, several metas | Bug | Medium | Round 1, round 2 (VS-5) |
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
| [NM-8](#nm-8) | Upper-case roles skipped by most name rules | Inconsistency | Medium | Round 2 |
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

<a id="nm-1"></a>**NM-1. A role with a fallback is read as no role** — Bug, High · [details](./2026-10-stress-test-2.md#nm-1)
- *In plain words:* `role="switch checkbox"` means "switch, or checkbox where switch is unknown". The engine reads only the first word, so well-formed fallbacks are reported as errors, and the real role is never checked.
- Examples: `<div role="searchfield searchbox" aria-label="Search">` fails aria-prohibited-attr; `<img role="none presentation">` fails img-alt-present; `<ul><li role="foo">` fails list-children-valid; `<div role="foo button" tabindex="0">` with no name is never checked.
- Basis: WAI-ARIA: "User agents MUST use the first token … that matches the name of any non-abstract WAI-ARIA role." ACT 674b10 needs only "at least one token which is a valid value".
- Where: `getExplicitRole` (`aria-helpers.js:931-938`) returns the first token; several rules compare the whole attribute string.

<a id="nm-2"></a>**NM-2. ID references and shadow roots** — Bug, High · [details](./2026-10-stress-test-2.md#nm-2) · also first round §6 ("name computation across a shadow boundary", planned for 1.11.0)
- *In plain words:* inside a web component, `<label for>`, `aria-labelledby` and `headers` that point to elements in the same component are not found, so correctly labelled controls fail. The opposite direction is also wrong: a reference from inside a component to the main page still gives a name, which browsers don't.
- Examples: shadow root `<label for="z">Zip</label><input id="z">` fails form-control-programmatic-label-present; a shadow `<input aria-labelledby="lbl">` with `id="lbl"` only in the page passes.
- Basis: IDs are scoped to their tree; HTML's labeled control is "an element **in the tree** whose ID is equal to the value of the for attribute".
- Where: `__getLabelElementsForId` (`dom-helpers.js:1750`), `resolveIdRefs` (`:2905ff`), `table-headers-attr-valid.js:120`: resolve in `el.getRootNode()`.

<a id="nm-3"></a>**NM-3. label-in-name reads `<b>Down</b>load` as "Down load"** — Bug, High · [details](./2026-10-stress-test-2.md#nm-3)
- *In plain words:* styling part of a word adds a space, so the visible label stops matching the name and a correct link fails.
- Example: `<a href="/d" aria-label="Download the report"><b>Down</b>load</a>`: `fail`; should pass.
- Basis: ACT 2ee8b8 uses the element's visible inner text, where inline elements add no space.
- Where: `collectVisibleTextUnder` (`label-in-name.js:269-285`); also `getContentNameInfo`.

<a id="nm-4"></a>**NM-4. label-in-name counts visually hidden text as visible** — Bug, High · [details](./2026-10-stress-test-2.md#nm-4)
- *In plain words:* screen-reader-only text inside a button is treated as part of what sighted users see.
- Example: `<button aria-label="Close dialog"><span class="sr-only">Dismiss</span>Close</button>`: `fail`; visible label "Close" is in the name, so pass.
- Basis: WCAG 2.5.3 is about the visible label; ACT 2ee8b8 uses visible text only.
- Where: `isDomVisibleEligible` in label-in-name has no clip, `clip-path`, 1px or opacity check; `isClipHidden` (`dom-helpers.js:4426`) exists.

<a id="vs-1"></a>**VS-1. An element's own `opacity` is counted twice** — Bug, High · [details](./2026-10-stress-test-2.md#vs-1)
- *In plain words:* a semi-transparent badge is measured as if faded twice, so a readable one fails.
- Example: `<span style="opacity:.6; background:#000; color:#fff">New</span>`: `fail` 3.22:1; the screen shows 5.83:1.
- Basis: WCAG 1.4.3 measures the rendered colours.
- Where: `computeEffectiveBackground` (`contrast-helpers.js:~1595`) and `computeEffectiveForeground` (`~1481`) both apply it; group compositing only runs for ancestors. Same family as R-3, fixed in 1.10.0.

<a id="vs-2"></a>**VS-2. SVG shapes behind SVG text are ignored** — Bug, High · [details](./2026-10-stress-test-2.md#vs-2)
- *In plain words:* light text on a dark SVG `<rect>` (badges, charts) is measured against the white page behind the SVG.
- Example: `<svg><rect fill="#000" …/><text fill="#ddd">Badge</text></svg>`: `fail` 1.36:1; the screen shows 15.46:1. The reverse (dark text on a dark rect) passes.
- Where: `__paintCandidate` (`contrast-helpers.js:~2075`) doesn't count SVG `fill` as paint.

<a id="rp-1"></a>**RP-1. SARIF output fails the SARIF schema** — Bug, High · [details](./2026-10-stress-test-2.md#rp-1)
- *In plain words:* almost every SARIF file from a browser scan is invalid, so a tool that validates SARIF rejects it.
- Example: any page with text, scanned in Chromium: the schema rejects `invocations[0].toolExecutionNotices`.
- Basis: SARIF 2.1.0 names the property `toolExecutionNotifications`.
- Where: `src/sarif.js:290`, `docs/SARIF.md:19,25`, `tests/sarif.test.js:627`.

### Medium

<a id="r-8"></a>**R-8. Off-screen text is still contrast-checked by default; closed `<select>` options too** — Debatable, Medium · [details](./2026-10-stress-test.md) (R-8)
- *In plain words:* text moved off-screen (`left:-9999px`, a classic screen-reader-only technique) or squeezed to `height:0` still fails contrast, because by default the engine looks only at styles, not at where things are drawn. The unselected options of a closed `<select>` fail too, though nobody sees them until it opens.
- Fixed part: `font-size:0` and `color:transparent` (1.10.0, see §3).
- Re-checked: `left:-9999px` and `height:0; overflow:hidden` fail at 1.36 under the default `visibilityMode: 'styleOnly'`; cleared under `styleAndGeometry`. A closed select's unselected options fail at 1.18–1.61. Under `styleAndGeometry`, its *selected* option is dropped too, so the visible text goes unchecked.
- Decision needed: make `styleAndGeometry` the default where layout exists (`contrast-helpers.js:466-470`), and check only a closed select's selected option.

<a id="r-1"></a>**R-1. Paint that isn't an ancestor's: what the 1.10.0 fix left** — Bug, Medium · [details](./2026-10-stress-test-outcomes.md) (P1)
- *In plain words:* 1.10.0 stopped failing text over images and overlays, by asking instead. Some layouts still slip through, and in one case a real failure is now hidden.
- Re-checked:
  - A positioned black box over a white card's text: `fail` 1.36, confidence `high`; the real background is black.
  - A `position:fixed` or `sticky` black block under `#ddd` text: `fail` 1.36.
  - Black at z-index 1, white at 2, text at 3: `cantTell` naming the black box; the white layer is skipped as "same colour as the background", so a real 1.36 fail is lost.
  - `#ddd` text over solid black covering it fully: `cantTell` where about 15:1 could be computed.
  - A faint radial glow behind text hides real fails (`#7d8ba4`, about 3.4:1, becomes `cantTell`).
- Where: the overlap index and `getComputabilityBlocker` (`contrast-helpers.js`).

<a id="r-13"></a>**R-13. The viewport `content` parser** — Bug, Medium · [details](./2026-10-stress-test-2.md#vs-5) · also VS-5
- *In plain words:* the two viewport rules read `<meta name="viewport">` differently from browsers and from each other.
- Re-checked:
  - Spaces as separators: `width=device-width user-scalable=no` is `notApplicable` (should fail); `user-scalable=yes maximum-scale=5` fails (should pass).
  - `maximum-scale=abc` and `user-scalable=0.5`: zoom-enabled fails, the 500% rule passes; `maximum-scale=-1`: the opposite.
  - Two viewport metas: every one is judged, though browsers apply the last.
- Basis: CSS Viewport's parsing algorithm ends a value at whitespace.
- Where: `split(/[,;]/)` in `meta-viewport-zoom-enabled.js:72` and `meta-viewport-large-manual.js:66`; `zoom-enabled.js:92,110-133` against `large-manual.js:96-106`.

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

<a id="nm-8"></a>**NM-8. Upper-case roles skipped by most name rules** — Inconsistency, Medium · [details](./2026-10-stress-test-2.md#nm-8)
- *In plain words:* browsers treat `role="BUTTON"` as a button, but 18 rules look only for `role="button"`, so a nameless one is never checked.
- Where: case-sensitive `[role="…"]` selectors (`button-name-present.js:113`, `link-name-present.js:89`, …). The engine already reads roles in any case elsewhere.

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

### Fixed after the second audit (not yet merged into `main`)

Fixes on branch `fix/audit-2026-10-findings` (from `main` at `cfefc02`), awaiting a pull request.

<a id="rb-1"></a><a id="rb-2"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| RB-1 | A form field named `parentNode` or `parentElement` made the scan hang | Fix fully, together with RB-2: the engine and every rule read the DOM through accessors that look properties up on the prototypes of a form, a document or a window (`src/core/safe-dom.js`), rewritten by a committed script and enforced by a lint rule; a step limit on every ancestor walk as a safety net. A scan checks once whether any element is named after something the engine reads, and uses plain reads when none is, so ordinary pages are unaffected. | `04b9003`, docs `3cf988a` | [#90](https://github.com/SureA11y/core/issues/90) | 2026-10-06 |
| RB-2 | Named images and forms overrode `document` and form properties the engine reads | Same change as RB-1. | `04b9003` | [#90](https://github.com/SureA11y/core/issues/90) | 2026-10-06 |

How it was checked: a harness that wraps each of the 130 fixture pages in a form with a field named after every property of every HTML and SVG element type, and adds images named after every `document` property, gives the same results as the same page with harmless names (0 changes, 0 hangs, 0 errors; 3,691 changes and 49 errors before), with forms only, `document` only and both. The new Chromium test fails on `main` and passes on the branch; the full suite passes (the one failure needs Playwright's default browser build, and fails on `main` too). Cost: about the same on a large page, about 2 ms a scan on small pages for the page check.

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
