# Stress test of `main`, second round — findings (2026-10)

Second stress test, run on `main` at `cfefc02` (1.10.0 plus the collapsed-content fixes), the day 1.10.0 was released. The first round is in [`2026-10-stress-test.md`](./2026-10-stress-test.md), and what became of it is in [`2026-10-stress-test-outcomes.md`](./2026-10-stress-test-outcomes.md). This round looks for new problems only: where a finding repeats something already listed there, it says so and links to it.

> **Status: findings only.** No source file was changed. Nothing here has been fixed. Each item carries an evaluation meant to be checked by the maintainer before any fix is planned.
>
> **To work from, use [`FINDINGS.md`](./FINDINGS.md)**: it merges this round with what is still open from the first round, re-checked on the same commit. This report is the evidence behind it.

---

## 0. How it was run and how it was judged

**How it was run.** Six probes ran in parallel, one per area:

| Area | Section | Environment |
|---|---|---|
| Accessible names and ARIA rules | [2](#2-accessible-names-and-aria) | jsdom |
| Contrast, layout and visual rules | [3](#3-contrast-layout-and-visual-rules) | Chromium (Playwright), with screenshots and pixel sampling |
| Structure and document rules | [4](#4-structure-and-document-rules) | jsdom |
| Options, selection and scoping | [5](#5-options-selection-and-scoping) | jsdom and Chromium |
| Reporters and translations | [6](#6-reporters-and-translations) | jsdom results fed to every reporter; SARIF validated against the official 2.1.0 schema; HTML rendered in Chromium |
| Robustness and scale | [7](#7-robustness-and-scale) | jsdom and Chromium |

Every item listed as a finding was then **re-run independently** while writing this document, with the exception of those marked *(not re-run)*, which were reproduced only by the probe that found them.

**How each item was judged.** In this order:

1. **The specification decides.** WCAG 2.2 and its Understanding documents, WAI-ARIA (the current editor's draft), accname, HTML-AAM, SVG-AAM, ARIA in HTML, the HTML Living Standard, CSS Viewport, the ACT rules, SARIF 2.1.0. The text was read from each spec's own source repository; the quotes below are from it.
2. **The engine's own documentation and earlier decisions** come next: what `docs/` promises, and what the first round decided (for example, that roles and ARIA values are read in any case, and that list rules read the flat tree).
3. **Browser behaviour is supporting evidence only.** Where Chromium and a spec disagree, the item says so, and the spec wins.
4. **What others do** is shown for comparison, never as a reason on its own. Two other widely used open-source engines, called **Engine A** and **Engine B** here, were run on the same example in the same Chromium page. Their result for the matching rule is given as `fail`, `pass`, `cantTell` (needs review) or `n/a` (rule not applicable, or no matching rule).

**Verdicts.**

| Verdict | Meaning |
|---|---|
| **Bug** | The engine contradicts a spec it follows, or its own docs. |
| **Inconsistency** | The spec leaves room, but the engine contradicts a decision it already made elsewhere. |
| **Gap** | A clear violation is missed; nothing wrong is reported. |
| **Debatable** | A defensible reading supports the current behaviour. A decision is needed. |
| **Not a bug** | Checked and found right. |

**Severity.** *High*: a wrong `fail` on common, correct markup (the engine reserves `fail` for certain violations, so this is the worst kind). *Medium*: a wrong `fail` on less common markup, a common miss, or a broken contract for integrators. *Low*: rare markup, cosmetic, or docs.

**Reading the examples.** Each item has a short **"In plain words"** line saying what the problem is for someone using the engine, then a minimal example. "Engine says" is what `main` reports today; "should say" is what the spec supports.

---

## 1. Summary

Sorted by severity within each area. "A" and "B" are the two other engines on the same example (see §0).

| # | Finding | Verdict | Severity | A | B |
|---|---|---|---|---|---|
| **Names and ARIA** |
| [NM-1](#nm-1) | A role with a fallback (`role="foo button"`, `"none presentation"`) is read as no role, or as an invalid one | Bug | High | mixed | mostly right |
| [NM-2](#nm-2) | `<label for>`, `aria-labelledby` and `headers` inside a shadow root are never resolved | Bug | High | right | right |
| [NM-3](#nm-3) | label-in-name reads `<b>Down</b>load` as "Down load" | Bug | High | right | right |
| [NM-4](#nm-4) | label-in-name counts visually hidden (`sr-only`) text as visible | Bug | High | right | right |
| [NM-5](#nm-5) | form-control-single-label counts labels HTML does not associate | Bug | Medium | right | n/a |
| [NM-6](#nm-6) | label-in-name adds a `<select>`'s options to its label | Bug | Medium | right | right |
| [NM-7](#nm-7) | An SVG `<title>` names the image only if it is the first child | Bug | Medium | right | right |
| [NM-8](#nm-8) | Upper-case roles (`role="BUTTON"`) are skipped by most name rules | Inconsistency | Medium | same miss | right |
| [NM-9](#nm-9) | label-in-name: soft hyphen, zero-width space and curly apostrophe split or change words | Bug | Low | same (2 of 3) | right |
| [NM-10](#nm-10) | aria-hidden-focus skips `aria-hidden="TRUE"` | Inconsistency | Low | same miss | same miss |
| [NM-11](#nm-11) | label-in-name skips `<input type="submit" value="…">` | Gap | Low | same miss | same miss |
| [NM-12](#nm-12) | Smaller name-computation slips *(not re-run)* | Bug | Low | — | — |
| **Contrast, layout, visual** |
| [VS-1](#vs-1) | An element's own `opacity` is counted twice when it has its own background | Bug | High | right | right |
| [VS-2](#vs-2) | SVG shapes behind SVG text are ignored | Bug | High | right | right |
| [VS-3](#vs-3) | avoid-inline-spacing fails values exactly at the WCAG minimum (rounding) | Bug | Medium | right | same (1 of 2) |
| [VS-4](#vs-4) | link-in-text-block misses an underline drawn by `::after`, and other cues | Bug | Medium | `cantTell` | mixed |
| [VS-5](#vs-5) | Viewport `content` split only on `,` and `;`, not on spaces | Bug | Medium | same miss | right |
| [VS-6](#vs-6) | css-orientation-lock fails rules that match no element | Bug | Medium | same | right |
| [VS-7](#vs-7) | text-spacing-content-loss: clipping ignores containing blocks | Bug | Medium | n/a | n/a |
| [VS-8](#vs-8) | target-size-minimum exempts any inline link in a `li`/`td`/`p` | Gap | Medium | right | right |
| [VS-9](#vs-9) | `-webkit-text-fill-color` ignored | Bug | Medium | right | same |
| [VS-10](#vs-10) | `-webkit-text-stroke` not treated as a computability blocker | Bug | Low | right | same |
| [VS-11](#vs-11) | `::first-line` / `::first-letter` colours ignored | Bug | Low | right | same |
| [VS-12](#vs-12) | Large-text size ignores CSS `zoom` and SVG `viewBox` scaling | Bug (known) | Low | right | same |
| [VS-13](#vs-13) | link-in-text-block treats `|` between links as surrounding text | Debatable | Low | right | same |
| **Structure and document** |
| [ST-1](#st-1) | definition lists don't read the flat tree (slots) | Inconsistency | Medium | right | n/a |
| [ST-2](#st-2) | td-has-header misreads `rowspan="0"` | Bug | Medium | n/a | same |
| [ST-3](#st-3) | iframe-focusable-content counts elements that can't take focus | Bug | Medium | n/a | same |
| [ST-4](#st-4) | listitem-parent-valid rejects `role="directory"` | Bug | Low | same | right |
| [ST-5](#st-5) | Meta refresh `content` parsing differs from the HTML algorithm | Bug | Low | — | — |
| [ST-6](#st-6) | html-xml-lang-mismatch with an invalid `lang` or `xml:lang` | Debatable / Bug | Low | n/a | n/a |
| [ST-7](#st-7) | Smaller HTML parsing slips (`usemap` case, `section-`, `scope`, NBSP) | Bug | Low | mixed | mixed |
| [ST-8](#st-8) | valid-lang reads light-DOM children, not the flat tree *(not re-run)* | Inconsistency | Low | — | — |
| **Options, selection, scoping** |
| [OP-1](#op-1) | A comma inside `:not(…)` / `:is(…)` splits an `excludeSelectors` string | Bug | Medium | — | — |
| [OP-2](#op-2) | Contrast rules ignore `excludeSelectors` for text in an excluded shadow host | Bug | Medium | — | — |
| [OP-3](#op-3) | `region` ignores `excludeSelectors` | Bug | Medium | — | — |
| [OP-4](#op-4) | A non-string `contextSelector` (an element, an `{ include, exclude }` object) scans the whole page | Bug | Medium | — | — |
| [OP-5](#op-5) | Cross-frame scans enter iframes inside excluded subtrees *(not re-run)* | Bug | Medium | — | — |
| [OP-6](#op-6) | Selection forms that still run every rule, or none, without a word | Bug | Low | — | — |
| [OP-7](#op-7) | Custom rule `customRules` given as one object, or with id `__proto__`, vanishes | Bug (missed by C-3's fix) | Low | — | — |
| [OP-8](#op-8) | A rule's own `error` text overwrites the engine's note | Bug | Low | — | — |
| [OP-9](#op-9) | Cross-frame scans miss iframes in shadow roots, or the scoped iframe itself *(not re-run)* | Bug | Low | — | — |
| [OP-10](#op-10) | `index.d.ts` behind the docs | Bug | Low | — | — |
| **Reporters and translations** |
| [RP-1](#rp-1) | SARIF uses `toolExecutionNotices`; the schema's name is `toolExecutionNotifications` | Bug | High | — | — |
| [RP-2](#rp-2) | A `fail` with no occurrences is a pass in JUnit, SARIF and baselines | Bug | Medium | — | — |
| [RP-3](#rp-3) | A rule that threw is invisible in SARIF, JUnit and the HTML report | Bug | Medium | — | — |
| [RP-4](#rp-4) | JUnit takes a criterion's outcome from its first composite only | Bug | Medium | — | — |
| [RP-5](#rp-5) | The HTML report fails contrast (WCAG 1.4.3) itself | Bug | Medium | — | — |
| [RP-6](#rp-6) | EARL: the last result wins, so input order can erase a failure | Bug (doc contradiction) | Medium | — | — |
| [RP-7](#rp-7) | Smaller reporter slips (dead schema URL, locale chip, `%`, catalog level) | Bug | Low | — | — |
| **Robustness and scale** |
| [RB-1](#rb-1) | A form field named `parentNode` / `parentElement` makes the scan hang | Bug | High | right | right |
| [RB-2](#rb-2) | Named images and forms override `document` and form properties the engine reads | Bug | Medium | same (worse) | right |
| [RB-3](#rb-3) | image-redundant-alt is quadratic (7 s at 4,000 images) | Bug (perf) | Medium | — | — |
| [RB-4](#rb-4) | Selector checks are quadratic on wide sibling lists *(not re-run)* | Bug (perf) | Low | — | — |
| [RB-5](#rb-5) | A throwing `shadowRoot` getter breaks about 77 rules | Bug | Low | — | — |
| [RB-6](#rb-6) | An SVG document fails page-title-present | Bug | Low | — | — |
| [RB-7](#rb-7) | Depth-limit downgrade reported through `error` *(not re-run)* | Doc | Low | — | — |
| [RB-8](#rb-8) | aria-hidden-focus changes pages that react to focus *(not re-run)* | Debatable | Low | — | — |

---

## 2. Accessible names and ARIA

<a id="nm-1"></a>**NM-1. A role with a fallback is read as no role, or as an invalid one** — Bug, **High**

*In plain words:* ARIA lets an author write several roles, and the browser uses the first one it knows. This is how authors use a new role safely: `role="switch checkbox"` means "switch, or checkbox where switch isn't supported". Many rules here read only the first word, so a well-formed fallback is reported as wrong, and the element's real role is never checked.

- Examples and what happens:

  | Markup | Rule | Engine says | Should say |
  |---|---|---|---|
  | `<div role="searchfield searchbox" contenteditable aria-label="Search">` | aria-prohibited-attr | `fail` ("this div has no role") | pass: the role is `searchbox` |
  | `<div role="selectlist listbox" aria-label="Fruit"><div role="option">Apple</div></div>` | aria-required-parent | `fail` on the option | pass: the parent is a `listbox` |
  | `<img src="a.png" role="none presentation">` | img-alt-present (and the object, embed, svg-image, video-poster rules) | `fail` | `notApplicable`, as for `role="none"` alone |
  | `<ul><li role="foo">a</li></ul>` | list-children-valid | `fail` | pass: `foo` is ignored, the `li` stays a listitem |
  | `<ul role="foo list"><li>a</li></ul>` | listitem-parent-valid | `fail` | pass |
  | `<table>` whose first header is `<th role="foo columnheader">` | td-has-header | `fail` on the `th` and its column | pass |
  | `<div role="foo button" tabindex="0"></div>` (no name) | button-name-present | `notApplicable` (missed) | `fail` |

- **Spec.** WAI-ARIA, *role attribute*: "User agents MUST use the first token in the sequence of tokens in the role attribute value that matches the name of any non-abstract WAI-ARIA role", and "If the role attribute contains no tokens matching the name of a non-abstract WAI-ARIA role, the user agent MUST treat the element as if no role had been provided." The host-language section requires the attribute to accept a token list, and the spec's own examples use fallbacks (`role="text img"`). ACT rule 674b10 (*role attribute has valid value*) expects only that "each test target has at least one token which is a valid value". **So more than one value is allowed, and the first valid one is the role; invalid tokens are skipped, not fatal.**
- **Others.** A: passes the first example, fails the second and third like this engine, and misses the last. B: right on every example except one: like this engine, it flags `role="searchfield searchbox"` under its own *role valid* rule (a warning about the unknown token, which is fair as a separate advisory).
- **Inconsistency inside the engine.** `aria-roles-valid` and `presentational-children-focusable-absent` already resolve the first valid token, and `aria-roles-valid`'s own comment uses `role="searchfield searchbox"` as its example. `table-headers-attr-valid` has a correct resolver too.
- **Cause.** `ariaHelpers.getExplicitRole` (`src/core/aria-helpers.js:931-938`) returns `tokens[0]`. Callers then treat an unknown first token as "no role". Several rules also compare the whole attribute string: `img-alt-present.js:144`, `object-text-alternative-present.js:179`, `embed-text-alternative-present.js:168`, `svg-image-text-alternative-present.js:175`, `video-poster-text-alternative-present.js:198`; and `canvas-text-alternative-present.js:112`, `list-children-valid.js:159`, `listitem-parent-valid.js:132`, `td-has-header.js:100` take the raw first token.
- **Evaluation.** Clear bug, one root cause. Fixing `getExplicitRole` to return the first *valid* token (and routing the string comparisons through it) covers every example. How common: fallbacks are rarer than single roles, but they are exactly what careful authors write, and the false `fail` lands on them.

<a id="nm-2"></a>**NM-2. `<label for>`, `aria-labelledby` and `headers` inside a shadow root are never resolved** — Bug, **High**

*In plain words:* a web component that labels its own inputs the normal way, all inside its shadow root, is reported as having unlabelled inputs and nameless buttons. The labels are right there; the engine only looks for them in the main document.

- Examples, run with `includeShadowDom: true` (the default):

  | Shadow root content | Rule | Engine says | Should say |
  |---|---|---|---|
  | `<label for="z">Zip</label><input id="z">` | form-control-programmatic-label-present | `fail` | pass |
  | `<span id="l">Zip</span><input aria-labelledby="l">` | form-control-programmatic-label-present | `fail` | pass |
  | `<span id="l">Go</span><button aria-labelledby="l"></button>` | button-name-present | `fail` | pass |
  | `<table><tr><th id="h1">Name</th>…<td headers="h1">Al</td>…` | table-headers-attr-valid | `fail` (every reference "missing") | pass |

- **Spec.** IDs are scoped to their tree (DOM). HTML, *labeled control*: "If the attribute is specified and there is an element **in the tree** whose ID is equal to the value of the for attribute, and the first such element in tree order is a labelable element, then that element is the label element's labeled control." `aria-labelledby` and `headers` are ID references resolved the same way.
- **Others.** A and B: pass on all four (B has no applicable `headers` rule in this case).
- **Relation to the first round.** Commit `393f015` fixed this for `aria-valid-attr-value` only, and the outcomes doc left "name computation across a shadow boundary" for 1.11.0. That deferred item is a reference *crossing* the boundary. This one is the opposite: a reference that stays *inside* the shadow root, which is ordinary component markup.
- **Cause.** `__getLabelElementsForId` (`src/core/dom-helpers.js:1750`) indexes only `document.querySelectorAll('label[for]')`. `resolveIdRefs` (`dom-helpers.js:2905ff`) looks IDs up in the document only. `table-headers-attr-valid.js:120` calls `document.getElementById`. Each should resolve in `el.getRootNode()`.
- **Evaluation.** Clear bug; high because design-system components are built this way.

<a id="nm-3"></a>**NM-3. label-in-name reads `<b>Down</b>load` as "Down load"** — Bug, **High**

*In plain words:* when part of a word is styled differently (bold first letter, a coloured syllable), the engine inserts a space at the tag boundary. The visible label then no longer matches the accessible name, and the link or button fails though nothing is wrong.

- Examples:
  - `<a href="/d" aria-label="Download the report"><b>Down</b>load</a>`: engine `fail` (visible label read as "Down load"); should be pass.
  - `<button aria-label="Submit form"><span>S</span>ubmit</button>`: same.
- **Spec.** ACT 2ee8b8 compares the name with the element's *visible inner text*, which follows how the text is rendered: inline elements add no space, so the visible label is "Download". (accname itself leaves this open: its editors' note says joining strings "with and without spaces, depending on the CSS display value" is under discussion in AccName #225.)
- **Others.** A: pass. B: pass.
- **Cause.** `collectVisibleTextUnder` (`label-in-name.js:269,280,285`) trims each text node and joins them with a space. The shared `getContentNameInfo` has the same flaw (`<button><b>Down</b>load</button>` is named "Down load").
- **Evaluation.** Clear bug.

<a id="nm-4"></a>**NM-4. label-in-name counts visually hidden text as visible** — Bug, **High**

*In plain words:* the common "screen-reader-only" pattern hides text visually but keeps it for screen readers. The engine treats that hidden text as part of what sighted users see, so a button whose visible word *is* in its name still fails.

- Example: `.sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0) }` and `<button aria-label="Close dialog"><span class="sr">Dismiss</span>Close</button>`. The visible label is "Close", which is in the name. Engine `fail`; should be pass.
- The same happens with `opacity: 0` text.
- **Spec.** WCAG 2.5.3 is about the *visible* label. ACT 2ee8b8 applies to "visible text content", where text clipped to nothing is not visible.
- **Others.** A: pass. B: pass.
- **Cause.** `isDomVisibleEligible` (label-in-name) has no clip, `clip-path`, 1px or opacity check. `isClipHidden` exists (`dom-helpers.js:4426`) but isn't used here. Not a jsdom artefact: the same result in Chromium.
- **Evaluation.** Clear bug. The sr-only pattern inside icon buttons is everywhere.

<a id="nm-5"></a>**NM-5. form-control-single-label counts labels HTML does not associate** — Bug, **Medium**

*In plain words:* the rule says a field has two labels when, by HTML's own rules, it has only one. It uses its own shortcut ("any label that contains the input, plus any label whose `for` matches") instead of the engine's shared, correct helper.

- Examples (each `fail` "associated with 2 labels"; each should pass):
  - `<label>From <input id="from"> to <input id="to"></label><label for="to">End date</label>`: a wrapping label labels only its *first* labelable descendant, so `#to` has one label.
  - `<label for="email">Email <input id="email2"></label><input id="email"><label for="email2">Backup</label>`: a label with `for` doesn't label the input it wraps.
  - `<label for="x">A</label><input id="x"><label>B <input id="x"></label>`: `for` matches only the first element with that id.
  - A light-DOM `<label for="q">` and a shadow-root `<label>Zip <input id="q"></label>`: `for` doesn't cross trees.
- **Spec.** HTML, *labeled control* (quoted in NM-2), and: "If the for attribute is not specified, but the label element has a labelable element descendant, then the first such descendant in tree order is the label element's labeled control."
- **Others.** A: pass (its multiple-labels check passes these). B: no equivalent rule.
- **Cause.** `form-control-single-label.js:97-125` builds its own index. `helpers.getAssociatedLabelElements` (`dom-helpers.js:1796`) already handles all four cases.
- **Evaluation.** Clear bug. The markup is less common than in NM-1 to NM-4, hence Medium.

<a id="nm-6"></a>**NM-6. label-in-name adds a `<select>`'s options to its label** — Bug, **Medium**

*In plain words:* for a dropdown inside a label, the engine reads every option into the visible label ("Quantity 1 2"), then complains the name "Quantity" doesn't contain it.

- Example: `<label>Quantity <select aria-label="Quantity"><option>1</option><option>2</option></select></label>`. Engine `fail`; should be `notApplicable`. A textarea's default text is added the same way.
- **Spec.** ACT 2ee8b8 applies only to widgets whose role "supports name from content"; a `select` (combobox or listbox) does not, so the rule doesn't apply to it at all. Even where it applies, options are not part of a visible label.
- **Others.** A: `n/a`. B: `n/a`.
- **Evaluation.** Clear bug.

<a id="nm-7"></a>**NM-7. An SVG `<title>` names the image only if it is the first child** — Bug, **Medium**

*In plain words:* an icon with its `<title>` after the shapes is reported as having no text alternative, though every browser and screen reader reads that title.

- Example: `<svg role="img"><circle r="4"/><title>Star</title></svg>`. Engine (svg-text-alternative-present) `fail`; should be pass.
- **Spec.** SVG-AAM, name computation: "If the current node has **at least one direct child title element**, select the appropriate title…". Its list of sources: "a direct child title element". No position is required.
- **Others.** A: pass. B: pass.
- **Cause.** `nonEmptyFirstChildTitleText` (`svg-text-alternative-present.js:113-126`) accepts only `firstElementChild`. Its comment ("commonly ignored by AT") is a deliberate choice, but unsourced, and the engine's own `getSvgTitleChildText` (`dom-helpers.js:3987`) accepts a `title` anywhere among the children.
- **Evaluation.** Bug: a deliberate choice that contradicts the spec, the engine's own name helper, and the "fail only when certain" rule. If the AT claim can be sourced, `cantTell` would be the honest outcome, not `fail`.

<a id="nm-8"></a>**NM-8. Upper-case roles are skipped by most name rules** — Inconsistency, **Medium** (missed violations)

*In plain words:* `role="BUTTON"` works as a button in browsers, but 18 name rules look for exactly `role="button"`, so a nameless upper-case button is never checked.

- Examples (each `notApplicable`; each should be `fail`): `<div role="BUTTON" tabindex="0"></div>`, `<span role="Link" tabindex="0"></span>`, `<div role="Checkbox" aria-checked="false" tabindex="0"></div>`, `<div role="OPTION"></div>` in a listbox.
- **Spec.** ARIA in HTML: "Authors SHOULD use ASCII lowercase for all role token values … While modern browsers treat the role or aria-* attribute values as ASCII case-insensitive, not all assistive technologies will correctly parse these values." So upper case is poor authoring, but browsers honour it.
- **Inside the engine.** `getExplicitRole` lowercases; `aria-required-attr` fails `role="CHECKBOX"` for a missing `aria-checked`; `dialog-name-present` and `role-img-text-alternative-present` handle `role="Dialog"` / `role="Img"`. Only these selectors don't.
- **Others.** A: same miss. B: `fail` (it reads the role case-insensitively).
- **Cause.** Case-sensitive selectors like `[role="button"]` in 18 files (`button-name-present.js:113`, `link-name-present.js:89`, …). Fix with `[role="button" i]` or role-based filtering.
- **Evaluation.** Inconsistency, not a spec violation by itself; the engine already decided to read roles in any case (`6a968b1`), so these rules should follow.

<a id="nm-9"></a>**NM-9. label-in-name: invisible characters and apostrophes split or change words** — Bug, **Low**

*In plain words:* characters that don't show on screen (a soft hyphen, a zero-width space) are treated as word breaks, and a typographic apostrophe makes "Don’t" a different word from "Dont".

- Examples:
  - `<button aria-label="Download">Down&shy;load</button>` (or `&#8203;`): engine `fail`; should be pass. **A:** `fail` (same). **B:** pass.
  - `<button aria-label="Dont save">Don’t save</button>`: engine `fail`. **A:** `fail`. **B:** pass.
- **Spec.** A soft hyphen renders as nothing unless the line breaks there. ACT 2ee8b8 is inapplicable when "every word that appears in both … uses the same spelling" does not hold, so for "Dont"/"Don’t" the rule should not apply rather than fail. The rule's own `@expectation` also says punctuation never decides the outcome.
- **Cause.** `tokenize` (`label-in-name.js:134`) treats `\p{Cf}` as a separator; `hyphensJoin` covers dashes only.
- **Evaluation.** Bug, rare markup.

<a id="nm-10"></a>**NM-10. aria-hidden-focus skips `aria-hidden="TRUE"`** — Inconsistency, **Low** (missed violation)

*In plain words:* a focusable button inside `aria-hidden="TRUE"` is hidden from screen readers in browsers, but the rule doesn't look at it.

- Example: `<div aria-hidden="TRUE"><button>x</button></div>`. Engine `notApplicable`; should be `fail`.
- **Spec.** As NM-8: browsers read the value in any case; authors should write lower case.
- **Inside the engine.** Name computation already treats `aria-hidden="TRUE"` as hidden, and `6a968b1` made ARIA true/false values case-insensitive.
- **Others.** A: `n/a` (same miss). B: `n/a` (same miss).
- **Cause.** `aria-hidden-focus.js:721` queries `[aria-hidden="true"]`. Fix: `[aria-hidden="true" i]`.

<a id="nm-11"></a>**NM-11. label-in-name skips `<input type="submit" value="…">`** — Gap, **Low**

*In plain words:* the text written on a submit button comes from its `value`, and it is the button's visible label, but the rule only reads text nodes, so it never checks these buttons.

- Example: `<input type="submit" value="Go" aria-label="Search site">`. Engine `notApplicable`; under WCAG 2.5.3 the visible label "Go" is not in the name, so `fail`.
- **Spec.** WCAG 2.5.3 covers any component "with labels that include text or images of text". ACT 2ee8b8 only covers text *nodes*, so it doesn't apply either: this is a gap in both.
- **Others.** A: `n/a`. B: `n/a`.
- **Evaluation.** Gap. Worth closing, low urgency.

<a id="nm-12"></a>**NM-12. Smaller name-computation slips** — Bug, **Low** *(not re-run)*

None of these was seen to cause a wrong `fail`.
- accname 2C/2E: an embedded control referenced by `aria-labelledby` contributes its value (textbox), selected option (select, listbox) or value (range). The engine gives all options ("Red Blue" instead of "Red") or nothing ("Remind me in days" instead of "Remind me in 3 days").
- `<input aria-labelledby="a"><label id="a">Name <input value="x"></label>` gives "Name Name".
- `<label for=" x">` labels `id="x"`: the `for` value is trimmed (`dom-helpers.js:1752`), but HTML compares IDs exactly.
- `tabindex="-1x"` is invalid to the engine (`Number()`); HTML's rules for parsing integers read it as -1.
- An SVG `<a xlink:href>` inside `aria-hidden` isn't counted as focusable.

**Open questions from this area** (not findings; behaviour matches the engine's documented scope):
- `nested-interactive-controls-absent` counts `tabindex="-1"` descendants with a widget role.
- `form-control-single-label` fails any field with two non-empty labels, though HTML-AAM concatenates them into one name.
- `aria-required-parent` treats a plain `<li>` under `ul[role=menubar]` or `ul[role=tablist]` as a blocking listitem.

---

## 3. Contrast, layout and visual rules

All examples here were run in Chromium with `html, body { background: #fff; color: #000 }`, and the contrast ones were checked against screenshot pixels.

<a id="vs-1"></a>**VS-1. An element's own `opacity` is counted twice when it has its own background** — Bug, **High**

*In plain words:* a semi-transparent badge with white text on black is measured as if it were faded twice, so a readable badge fails.

- Example: `<span style="display:inline-block; opacity:.6; background:#000; color:#fff">New feature tag</span>`. Engine `fail` at 3.22:1 (foreground `#c2c2c2`, background `#666`). Pixels: `#fff` on `#656565`, 5.83:1: should pass. With `opacity:.5` and 30px text: engine 2.17:1, pixels 4.0:1 (large text, passes 3:1).
- **Spec.** WCAG 1.4.3 is about the contrast the user sees; Understanding 1.4.3 measures the rendered colours.
- **Others.** A: pass. B: pass.
- **Cause.** `computeEffectiveBackground` (`contrast-helpers.js:~1595`) already scales the background by the element's own opacity; `computeEffectiveForeground` (`~1481`) also gives the text that alpha; the rule then composites that faded text over the faded background (`contrast-minimum.js:~425`). Group compositing (`resolveGroupOpacityColors`) runs only when the opacity is on an ancestor (`cur !== el`).
- **Relation to the first round.** P13 / R-3 fixed opacity counted twice on an *ancestor*. This is the same family, on the element itself.
- **Evaluation.** Clear bug; badges, tags and disabled-looking buttons use this.

<a id="vs-2"></a>**VS-2. SVG shapes behind SVG text are ignored** — Bug, **High**

*In plain words:* in an SVG badge or a chart label, light text sits on a dark `<rect>`. The engine doesn't see the rectangle and measures the text against the white page behind the SVG.

- Example: `<svg width="200" height="40"><rect width="200" height="40" fill="#000"/><text x="10" y="25" fill="#ddd">Badge label</text></svg>`. Engine `fail` 1.36:1 against `#fff`; pixels 15.46:1: should pass. The reverse (black text on a `#333` rect) **passes** and should fail.
- **Others.** A: pass. B: pass.
- **Cause.** `__paintCandidate` (`contrast-helpers.js:~2075`) counts only CSS backgrounds and replaced elements as paint; SVG shapes that paint with `fill` are never painters, and the outer `<svg>` is an ancestor of the text, so it's skipped. So the `BACKGROUND_OVERLAP` check from P1 never fires either.
- **Evaluation.** Clear bug, in both directions. SVG text on a shape is the normal case for charts and badges.

<a id="vs-3"></a>**VS-3. avoid-inline-spacing fails values exactly at the WCAG minimum** — Bug, **Medium**

*In plain words:* `line-height: 1.5` is exactly what WCAG asks for, but at some font sizes the browser's pixel values divide to 1.4999966, and the engine compares strictly, so it fails a correct page.

- Examples: `<p style="font-size:11pt; line-height:1.5 !important">`, and the same with `letter-spacing:0.12em !important`, `word-spacing:0.16em !important`, or `font-size:1.1em` / `0.9rem`. Engine `fail`; should pass. (22px / 14.6667px = 1.4999966; 1.76 / 14.6667 = 0.1199997.)
- The same rounding gives a wrong `cantTell` (`STYLESHEET_IMPORTANT`) in text-spacing-content-loss (`.x { font-size:11pt; line-height:1.5 !important }`).
- **Spec.** ACT 78fd32: "the used value of its line-height property is **at least** 1.5 times the computed value of its font-size". The author's value meets that exactly; the shortfall is floating-point error.
- **Others.** A: pass on both. B: pass on `line-height`, `fail` on `letter-spacing` (the same rounding).
- **Cause.** `spacingRatio` divides two computed px values and compares strictly (`avoid-inline-spacing.js:271,319`; `text-spacing-content-loss.js:153`). Fix: a small tolerance, or read the declared em/unitless value.
- **Evaluation.** Clear bug. Medium because it needs `!important` inline spacing, which is uncommon.

<a id="vs-4"></a>**VS-4. link-in-text-block misses common non-colour cues** — Bug, **Medium**

*In plain words:* the rule says a link "relies on colour alone" when it is plainly underlined, just not with `text-decoration`.

- Examples (each `fail`; base style `a { color:#333; text-decoration:none }` in a paragraph):
  - An underline drawn by an empty pseudo-element: `a::after { content:""; position:absolute; left:0; right:0; bottom:0; height:1px; background:#333 }`, or the same with `border-bottom`. Very common in design systems. **A:** `cantTell`. **B:** `fail` (same).
  - A background chip on the link's content: `<a href><code style="background:#ddd">fetch()</code></a>`, or `<a href><mark>…</mark></a>`. **A:** `cantTell`. **B:** pass.
  - A footnote superscript inside the link: `<a href="#fn1"><sup>1</sup></a>`. The rule already exempts `<sup><a>`, so the result depends on tag order.
- **Spec.** WCAG 1.4.1 is met by any visual cue other than colour (Technique G183 names underline; F73 fails only colour-alone links).
- **Cause.** `EMPTY_CONTENT` treats `content:""` as no content (`link-in-text-block.js:396`); `cueOnContent` (`:557`) checks weight, style, border and underline but not background, though a background on the link itself counts.
- **Evaluation.** Bug. A `cantTell` is the safe answer if the engine can't measure the pseudo-element; `fail` is not.

<a id="vs-5"></a>**VS-5. Viewport `content` is split only on `,` and `;`, not on spaces** — Bug, **Medium**

*In plain words:* `<meta name="viewport" content="width=device-width user-scalable=no">`, written with spaces instead of commas, blocks zooming in browsers, but the engine reads it as one long, odd value. The same parsing also produces the opposite mistake.

- Examples:
  - `content="width=device-width initial-scale=1 user-scalable=no"`: engine `notApplicable` (missed); should be `fail`. **A:** pass (same miss). **B:** `fail` (right).
  - `content="user-scalable=yes maximum-scale=5"`: engine `fail` (reads `user-scalable` as `"yes maximum-scale=5"`); should pass. **A:** pass. **B:** pass.
- **Spec.** CSS Viewport, *parsing algorithm*: a property name and its value each end at whitespace, a separator or `=`, and the loop then skips whitespace and separators. So whitespace separates pairs. Chromium agrees.
- **Also.** With two viewport `<meta>`s, browsers apply only the last; the engine also judges the first. `meta-viewport-large` (manual) has the same split (`meta-viewport-large-manual.js:66`).
- **Cause.** `split(/[,;]/)` (`meta-viewport-zoom-enabled.js:72`).
- **Evaluation.** Clear bug, both a wrong `fail` and a miss.

<a id="vs-6"></a>**VS-6. css-orientation-lock fails rules that match no element** — Bug, **Medium**

*In plain words:* a stylesheet rule that rotates a class nobody uses is reported as "locking the page to one orientation".

- Example: `<style>@media (orientation: portrait) { .does-not-exist { transform: rotate(90deg) } }</style>`. Engine `fail`; should be `notApplicable`.
- **Spec.** ACT b33eff applies to "any HTML element that is **visible** and has one of the following CSS properties applied conditionally on the orientation media feature". No element, nothing to judge.
- **Others.** A: `fail` (same). B: `n/a` (right).
- **Note.** A small decorative chevron rotated 90° in one orientation also fails. ACT applies to any visible element, so that one is consistent with ACT, though arguably not what SC 1.3.4 is about. Worth a decision, not counted as a bug.
- **Cause.** `judgeStyle` / `findings.push` (`css-orientation-lock.js:262-264`) never checks that the selector matches a visible element.
- **Evaluation.** Bug. Common in real CSS: frameworks ship orientation rules for components a page may not use.

<a id="vs-7"></a>**VS-7. text-spacing-content-loss: clipping ignores containing blocks** — Bug, **Medium**

*In plain words:* a dropdown or tooltip positioned outside an `overflow:hidden` box is reported as cut off, though it's fully visible.

- Example: `<div style="position:relative; width:400px"><div style="overflow:hidden; height:40px; width:200px"><span>Menu</span><div style="position:absolute; top:0; left:0; width:150px; line-height:1.2">This dropdown tooltip text wraps on lines</div></div></div>`. Engine `fail` ("cuts off the text … 29px past its edge"). With the spacing applied, the screenshot shows the popup fully visible.
- **Spec.** CSS Overflow: `overflow` clips content whose containing block is the box or a descendant of it. An absolutely positioned box whose containing block is outside the clipping box escapes it, as does `position: fixed`.
- **Others.** Neither has this rule.
- **Cause.** `clippersOf` (`text-spacing-content-loss.js:336`) walks `parentElement` and treats every `overflow:hidden` ancestor as a clipper.
- **Evaluation.** Clear bug.

<a id="vs-8"></a>**VS-8. target-size-minimum exempts any inline link inside a `li`, `td` or `p`** — Gap, **Medium**

*In plain words:* a row of tiny, touching pagination links ("1 2 3") passes, because each link is "inline inside a list item", though none of them sits in a sentence.

- Example: `<ul style="display:flex"><li><a href="/1" style="font-size:12px">1</a></li><li><a href="/2" …>2</a></li><li><a href="/3" …>3</a></li></ul>`. Engine pass; should be `fail`.
- **Spec.** WCAG 2.5.8, *Inline* exception: "The target is **in a sentence** or its size is otherwise constrained by the line-height of non-target text." A link alone in a list item is not.
- **Others.** A: `fail` (3). B: `fail` (3).
- **Cause.** `isInlineTextExceptionTarget` (`target-size-minimum.js:240`) exempts any inline link inside `li`, `td` or `p`, with no check for surrounding text.
- **Also.** A 23.99px target is reported as "Target is 24×24 … under 24×24" (rounding in the message; already listed as R-11).

<a id="vs-9"></a>**VS-9. `-webkit-text-fill-color` is ignored** — Bug, **Medium**

*In plain words:* this property sets the colour the text is actually painted in, overriding `color`. The engine reads `color`, so it measures a colour that isn't on screen.

- Examples: `<p style="color:#eee; -webkit-text-fill-color:#000">` (black on white): engine `fail` 1.16:1; should pass. The opposite: `color:transparent; -webkit-text-fill-color:#ccc` is dropped as "not drawn" and never checked.
- **Spec.** The Compatibility Standard (WHATWG) defines `-webkit-text-fill-color` as the fill colour of the text, defaulting to `currentcolor`. All current browsers implement it.
- **Others.** A: pass. B: `fail` (same).
- **Cause.** `computeEffectiveForeground` reads only `cs.color` (`contrast-helpers.js:~1463`), and so does `isUndrawn` (`~460`).
- **Evaluation.** Bug. Used mainly in gradient-text and "clip text" effects, hence Medium.

<a id="vs-10"></a>**VS-10. `-webkit-text-stroke` is not a computability blocker** — Bug, **Low**

*In plain words:* outlined text is drawn mostly in the outline colour, but the engine measures only the fill, and fails text that is readable.

- Example: `<p style="color:#ddd; -webkit-text-stroke:2px #000; font-size:30px">`. Engine `fail` 1.36:1; the dominant glyph pixels are `#000`.
- **Others.** A: pass. B: `fail` (same).
- **Cause.** `getComputabilityBlocker` (`contrast-helpers.js:~1819`) handles `text-shadow` but not stroke.
- **Evaluation.** Bug. `cantTell`, as for a text shadow, is the honest answer.

<a id="vs-11"></a>**VS-11. `::first-line` and `::first-letter` colours are ignored** — Bug, **Low**

*In plain words:* if CSS paints the first line in another colour, the engine still measures the paragraph's own colour.

- Example: `.f { color:#bbb } .f::first-line { color:#000 }` on a one-line paragraph. Engine `fail` 1.92:1; pixels are black, 21:1. A low-contrast `::first-letter` drop cap is never checked.
- **Others.** A: pass. B: `fail` (same).
- **Evaluation.** Bug, rare.

<a id="vs-12"></a>**VS-12. Large-text size ignores CSS `zoom` and SVG `viewBox` scaling** — Bug, **Low** (already known: [R-14](./2026-10-stress-test.md))

*In plain words:* text made twice as large with `zoom: 2` is still treated as small text, so it must reach 4.5:1 instead of 3:1.

- Examples: `<p style="color:#888; font-size:12px; zoom:2">` lays out exactly like 24px text; engine `fail` at 3.54:1 against 4.5:1. `<svg viewBox="0 0 100 20" width="800"><text font-size="10" fill="#888">` renders about 88px tall but is read as 10px.
- **Spec.** WCAG, *large scale*: "the font size … should be obtained from the user agent, or calculated based on font metrics as the user agent does"; "Font size is the size when the content is delivered", which excludes only resizing done by the *user*. Author `zoom` is part of delivery.
- **Others.** A: pass. B: `fail` (same).
- **Evaluation.** Bug, already in the 1.11.0 plan (R-14 lists `zoom`). The SVG `viewBox` case is new.

<a id="vs-13"></a>**VS-13. link-in-text-block treats a `|` between links as surrounding text** — Debatable, **Low**

*In plain words:* in a footer like "Privacy | Terms", the rule treats the bar as a sentence the links sit in, and fails both links for relying on colour.

- Example: `<footer><p><a href="/p" style="color:#333; text-decoration:none">Privacy</a> | <a href="/t" …>Terms</a></p></footer>`. Engine `fail` on each link.
- **Spec.** WCAG 1.4.1 and G183 concern links "in a block of text". A row of links separated by punctuation is navigation, not text.
- **Others.** A: `n/a`. B: `fail` (same).
- **Inside the engine.** `hasSurroundingText` (`link-in-text-block.js:476`) accepts any non-space character, while the contrast text scan requires a letter or digit (`[\p{L}\p{N}]`).
- **Evaluation.** Debatable, but requiring a letter or digit around the link would match the engine's own text test and the intent of the SC.

**Checked and found right in this area.** Large-text boundaries (14pt bold, 18.666px against 18.67px, 18pt, rem/em, default headings, the `font` shorthand, `<b>` inside weight 300); CSS Color 4 parsing against the canvas (oklch, lab, `color()`, `none`, `color-mix`, relative colours, `light-dark()`, system colours); native buttons, selects and submits; `opacity: 0`; ancestor-opacity compositing; target-size at exactly 24px and 24px spacing, overlays, disabled targets; text-spacing with ellipsis, sr-only text and `line-clamp`; orientation-lock `rotate(90deg) rotate(-90deg)` and `rotateY`.

**Not a bug.** White text at 50% alpha on white fails at 1.00:1. That text is drawn, and the first round decided drawn text is measured (R-8).

---

## 4. Structure and document rules

Across all 137 fixtures, no rule threw or returned an `error`, and no manual rule ever returned `fail`.

<a id="st-1"></a>**ST-1. Definition lists don't read the flat tree** — Inconsistency, **Medium**

*In plain words:* a custom element that renders a `<dl>` and slots its `dt`/`dd` children in is reported as broken, though browsers expose a correct definition list. The same pattern with `ul`/`li` already passes.

- Example: `<x-dl><dt>a</dt><dd>b</dd></x-dl>` with shadow root `<dl><slot></slot></dl>`. definition-list-children-valid `fail` ("invalid child: slot"); dlitem-parent-valid `fail` on both items. Should pass.
- **Spec.** HTML's content model is defined on the DOM tree, so on paper the light-DOM `x-dl` holds `dt`s. But WCAG 1.3.1 is about what is programmatically determined, which is the accessibility tree, built from the flat tree. The first round decided this for lists (`edde85d`), on that basis.
- **Others.** A: pass. B: no equivalent rule.
- **Cause.** `childElementsOf` (`definition-list-children-valid.js:101`) and `el.parentElement` (`dlitem-parent-valid.js:68`); the slot-aware helpers in the list rules can be reused.

<a id="st-2"></a>**ST-2. td-has-header misreads `rowspan="0"`** — Bug, **Medium**

*In plain words:* `rowspan="0"` means "span to the end of this group of rows". The engine reads it as no span, every column shifts by one, and correct data cells are reported as having no header.

- Example: a table whose first row is `<th rowspan="0">Group</th><td>a</td><td>b</td><td>c</td>`, followed by three rows of three `<td>`s. Engine: 6 `fail`s. The same table with `rowspan="4"` is correctly `notApplicable`.
- **Spec.** HTML, *forming a table*: "If rowspan is zero, then set cell grows downward to true and set rowspan to 1", and the cell then grows to the end of the row group.
- **Others.** A: `n/a`. B: 6 `fail`s (same).
- **Cause.** The `hasSpan` guard (`td-has-header.js:135`) only checks values greater than 1.

<a id="st-3"></a>**ST-3. iframe-focusable-content counts elements that can't take focus** — Bug, **Medium**

*In plain words:* an `iframe` with `tabindex="-1"` fails when it contains something focusable. The rule counts things that can't actually be focused.

- Examples, each inside `<iframe tabindex="-1" srcdoc="…">` (each `fail`; each should pass):
  - `<fieldset disabled><button>x</button></fieldset>`: the button is disabled.
  - `<div tabindex="">` or `<div tabindex="abc">`: an invalid tabindex is ignored, so the div isn't focusable (`Number("")` is 0, and `NaN` isn't excluded).
  - `<map name="m"><area href="/x"></map>` with no image using the map.
- Missed the other way: `contenteditable=""` is focusable but not counted.
- **Spec.** HTML: "A form control is disabled if … the element is a descendant of a fieldset element whose disabled attribute is specified"; disabled controls are not focusable. `tabindex` uses the rules for parsing integers, and an unparsable value is ignored. An `area` is focusable only as part of an image map an `img` uses.
- **Others.** A: `n/a`. B: `fail` (same).
- **Cause.** The selector at `iframe-focusable-content.js:238`.

<a id="st-4"></a>**ST-4. listitem-parent-valid rejects `role="directory"`** — Bug, **Low**

- Example: `<ol role="directory"><li>a</li></ol>`. Engine `fail`.
- **Spec.** WAI-ARIA, `listitem`: *Required Accessibility Parent Roles: directory, list*. `directory` is deprecated but still valid.
- **Others.** A: `fail` (same). B: pass.
- **Evaluation.** Bug, rare markup. An advisory about the deprecated role belongs to `aria-deprecated-role`, which already exists.

<a id="st-5"></a>**ST-5. Meta refresh `content` parsing differs from the HTML algorithm** — Bug, **Low**

*In plain words:* browsers accept some odd time values in `<meta http-equiv="refresh">` that the engine rejects, so the engine can judge a tag the browser ignores and miss one it obeys.

- Examples:
  - `<meta http-equiv="refresh" content=".5; url=/a"><meta http-equiv="refresh" content="30">`: the first is valid (time 0, a redirect), so the browser ignores the second. The engine rejects the first and fails the second.
  - `content="5.5.5"` means 5 seconds; the engine says `notApplicable`.
  - `content=" 5"` with a leading no-break space is invalid (it isn't ASCII whitespace), but `trim()` strips it and the engine fails it.
- **Spec.** HTML, *shared declarative refresh steps*: collect ASCII digits; "If timeString is the empty string: If the code point … is not U+002E (.), then return"; then "Collect a sequence of code points that are ASCII digits and U+002E FULL STOP characters … Ignore any collected characters." And "If document's will declaratively refresh is true, then return": the first valid one wins.
- **Cause.** `meta-refresh-timing-absent.js:100`, `meta-refresh-no-exceptions.js:106`.
- **Evaluation.** Bug, rare markup. Chromium's parser differs slightly from the spec here, so the spec is the reference.

<a id="st-6"></a>**ST-6. html-xml-lang-mismatch with an invalid `lang` or `xml:lang`** — Debatable (one part a Bug), **Low**

- `<html lang="en" xml:lang="x-foo">` or `xml:lang="!!"`: engine `fail`. ACT 5b7ae0 applies whenever `lang` has a known primary tag and `xml:lang` is non-empty, and expects "the values of the primary language subtags, **if any exist**, … are the same". `x-foo` and `!!` have no primary language subtag, so ACT can be read as passing or failing it. **Debatable.**
- `<html lang="xx" xml:lang="yy">`: engine `fail`. ACT does not apply, since `lang` has no known primary tag (`html-lang-valid` already fails that page). **Bug**, low: a second failure for the same problem.
- **Others.** A: `n/a` on both (its own language-validity rule fails the page). B: `n/a`.
- **Cause.** `html-xml-lang-mismatch.js:80` checks only that both are non-empty.

<a id="st-7"></a>**ST-7. Smaller HTML parsing slips** — Bug, **Low**

- **`usemap` case.** `<img usemap="#Map">` with `<map name="map">`: the engine lowercases names, so it judges that map's areas as used. HTML, *rules for parsing a hash-name reference*: "Return the first element … that has an id or name attribute whose value **is** s", which is case-sensitive. A map referenced by its `id` (allowed by the same text) is never matched. **A:** `fail` (same). **B:** no equivalent rule.
- **`autocomplete="section- email"`.** HTML: "a token whose first eight characters are an ASCII case-insensitive match for the string "section-"", so `section-` alone is a valid section token. Engine `fail`. **A:** `fail` (same). **B:** pass. And `split(/\s+/)` splits on a no-break space, so `"email "` passes; HTML splits on ASCII whitespace only.
- **`scope`.** `scope-attr-valid` (manual) queries `[scope]` on every element, so `<my-tabs scope="page">` gets a `cantTell`, and it trims the value, so `scope=" col "` (invalid) passes.
- **Text in a list.** Non-whitespace text directly inside `<ul>` is not reported by list-children-valid. HTML allows only `li` and script-supporting elements there.

<a id="st-8"></a>**ST-8. valid-lang reads light-DOM children, not the flat tree** — Inconsistency, **Low** *(not re-run)*

- `<x-a lang="xx">` whose only text is in its shadow root: `notApplicable` (missed). `<x-a lang="xx">secret</x-a>` whose shadow root has no slot (the text is never rendered): `fail`.
- Cause: `valid-lang.js:143`.

**Already known.** `meta-viewport-large` (manual) passing what the AA rule fails is [R-13](./2026-10-stress-test.md), planned for 1.11.0.

**Checked and found right.** BCP 47 cases in valid-lang and html-lang-attr-present (grandfathered and private-use tags fail as ACT requires; extlang, case, padding, `und`/`mul`/`zxx` pass); meta refresh with `;`, `,` and whitespace separators, `+N`, more than 20 hours, a refresh in `body` or `noscript`; viewport yes/no/0/1/device-width; autocomplete section/shipping/contact/webauthn order and exempt types; img, input-image and area naming; server-side-image-map, aria-hidden-body, page-title-present, deprecated-elements-not-used, the duplicate-id rules.

---

## 5. Options, selection and scoping

Engines A and B have different APIs, so no comparison is given in this section. Each item is judged against the engine's own docs.

<a id="op-1"></a>**OP-1. A comma inside `:not(…)` or `:is(…)` splits an `excludeSelectors` string** — Bug, **Medium**

*In plain words:* `excludeSelectors: 'img:not(.a, .b)'` is cut at every comma, so it becomes two broken selectors. Part is thrown away with a warning, and the rest excludes the wrong elements.

- Example: three images `.a`, `.b`, `.keep2`, with `excludeSelectors: 'img:not(.a, .b)'`. Only `img.a` is reported; `img.a` and `img.b` should be. `':is(.a, .b)'` doesn't exclude `.b`. Rule-scoped excludes and `[alt=","]` are hit too.
- **Contract.** ENGINE_OPTIONS.md: excludeSelectors takes an "array or comma-separated string". A CSS selector list is what that string is, and the same doc gives a string `contextSelector` CSS selector-list semantics.
- **Cause.** `normalizeSelectorList` does `value.split(',')` (`src/core/dom-helpers.js:44-50`). It needs a split that respects parentheses, brackets and quotes, or should pass the whole string to `matches()`.

<a id="op-2"></a>**OP-2. Contrast rules ignore `excludeSelectors` for text in an excluded shadow host** — Bug, **Medium**

*In plain words:* excluding a third-party widget by its host element works for every rule except the three contrast rules, which still report the widget's text.

- Example: `<div id="widget">` with an open shadow root holding low-contrast text, `excludeSelectors: ['#widget']`. contrast-minimum still `fail`s on it; button-name-present in the same root is correctly excluded. contrast-computable and contrast-enhanced leak the same way, and a rule-scoped exclude doesn't help.
- **Contract.** "Elements matching … (and their descendants) are skipped entirely, for every rule."
- **Cause.** `isExcluded` walks `el.parentElement` only, so it never steps from a shadow root to its host (`dom-helpers.js:1134`); the contrast collection relies on it (`contrast-helpers.js:615,659`). The documented helper is wrong for any node inside a shadow root.

<a id="op-3"></a>**OP-3. `region` ignores `excludeSelectors`** — Bug, **Medium**

*In plain words:* the docs' own example (excluding a cookie banner) doesn't work for this rule: the banner is still reported as content outside a landmark.

- Example: `<div id="banner"><p>Cookie text</p></div><main>…</main>` with `excludeSelectors: ['#banner']` (or rule-scoped): `region` still gives `cantTell` on the banner. A sweep of every fixture with `excludeSelectors: ['body *']` found no other rule that does this.
- **Cause.** `region-manual.js` (from line 113) walks `document.body`'s children without `isExcluded`.

<a id="op-4"></a>**OP-4. A non-string `contextSelector` scans the whole page** — Bug, **Medium**

*In plain words:* passing an element, a NodeList or an `{ include, exclude }` object as the scope (a common habit carried over from other engines' APIs) isn't refused. The whole page is scanned instead, and the result doesn't say so.

- Example: `runa11yCoreInPage(url, { include: ['main'] }, {}, ['img-alt-present'])` reports the footer image too, and the result has `contextSelector: null`. The same happens with an `Element`, a `NodeList`, a number, `[['#main']]` or `[element]`. Non-string items in an array (`['footer', 5]`) are dropped silently.
- **Contract.** ENGINE_OPTIONS.md: "A scope the page doesn't have is not widened to the whole page", and a bad selector throws `INVALID_CONTEXT_SELECTOR`.
- **Cause.** `resolveContextRoots` (`dom-helpers.js:70-79`) maps non-strings to `''`, which becomes `null`, meaning the whole document.
- **Evaluation.** Bug. Throwing `INVALID_CONTEXT_SELECTOR` (or supporting elements) would both be fine; a silent full scan is not.

<a id="op-5"></a>**OP-5. Cross-frame scans enter iframes inside excluded subtrees** — Bug, **Medium** *(not re-run)*

- With `excludeSelectors: ['#ads']` or `['iframe[title=ad]']`, `runa11yCoreAcrossFrames` still pings and scans the iframe inside `#ads` and returns its findings in `frames`. Third-party embeds are exactly what BASELINE.md and ENGINE_OPTIONS.md use as examples of what to exclude.
- Cause: `frame-scan.js:112-115` filters frames only on `isFrameShown`.

<a id="op-6"></a>**OP-6. Selection forms that still run every rule, or none, without a word** — Bug, **Low** (overlaps [S-6](./2026-10-stress-test.md))

*In plain words:* 1.10.0 made most typos in `runOnly` throw, because a scan that silently checks the wrong set of rules looks like a clean pass. A few forms still slip through.

- Runs **every** rule, silently:
  - `{ type: 'tag', values: 'wcag2a' }` and the typo `{ type: 'tag', values: 'wcag2aaaa' }` (a string `values`; the `rule` form accepts a string correctly). Re-run: 134 rules.
  - `{ type: 'tag' }` with no values.
  - `{ type: 'tag', values: […], excludeTags: […] }`: the excludes are dropped.
  - `engineOptions.tags: ['wcag2a']`, `engineOptions.rules: ['img-alt-present']` (instead of `{ include: … }`), `runOnly: new Set([…])`.
  - An unknown key beside a known one (`{ includeRuleId: […], includeMode: 'or' }`): no throw, no warning.
  - `excludeRuleIds: ['a11ycore-wcag-1.1.1-non-text-content']`: the legacy prefix (documented as accepted) removes the composite but not its 4 child rules. As an include, the prefixed composite id throws. Re-run: 134 checks still run.
- Runs **no** rule, silently: `engineOptions.tests.include: ['img-alt-presnt']` (re-run: 0 rules). The docs call `tests.include` an alias of `rules`, which is checked.
- Cause: `scripts/build-core.js:832,884` (`Array.isArray(values)`), `:1238-1252`, `:1286-1288`; `expandCompositeRuleId` doesn't strip the prefix.

<a id="op-7"></a>**OP-7. A custom rule given as one object, or with id `__proto__`, vanishes** — Bug, **Low** (a case [C-3](./2026-10-stress-test.md)'s fix missed)

*In plain words:* the 1.10.0 fix added `skippedCustomRules` so that a custom rule that doesn't run is listed. These two cases still leave no trace.

- `customRules: { id, runInPage }` (one object, not an array): ignored, `skippedCustomRules: []`, no warning. Re-run. The outcomes doc lists C-3, which included exactly this case, as fixed in `82600b6`.
- `customRules: [{ id: '__proto__', … }]`: not run, not listed, no warning; `runOnly: ['__proto__']` is accepted and runs 0 rules. Re-run. Cause: `extraImpls[ruleId] = …` on a plain `{}` sets the prototype (`dom-runner.js:854,938`).
- Related: with `engineOptions.rules` set, rules named `constructor` or `toString` get `ctx.config === Object` (`dom-runner.js:1128-1132`, needs an own-property check).
- `meta.tags: 'mytag'` (a string, not an array) is dropped, and `runOnly: { tags: ['mytag'] }` then throws "no tag named". *(not re-run)*

<a id="op-8"></a>**OP-8. A rule's own `error` text overwrites the engine's note** — Bug, **Low**

- A custom rule returning `{ outcome: 'failed', error: 'oops' }` is `cantTell` with `error: "oops"`; the engine's note ("returned outcome "failed" … reported as cantTell") is gone. Re-run. The same happens to the manual-`fail` coercion, bad-severity and depth-limit notes.
- **Contract.** ENGINE_OPTIONS.md and POLICY.md: `error` names the value or explains the coercion.
- Cause: the last line of `normalizeRuleResult` (`build-core.js:1662`), `if (raw && raw.error) out.error = String(raw.error);`. Append, don't replace.

<a id="op-9"></a>**OP-9. Cross-frame scans miss iframes in shadow roots, or the scoped iframe itself** — Bug, **Low** *(not re-run)*

- An iframe in an open shadow root is neither scanned nor listed in `frames`, though `includeShadowDom` defaults to true. OUTPUT_SCHEMA.md: "one entry per direct child iframe in the scanned scope". Cause: `findChildFrameElements` uses `querySelectorAll('iframe, frame')` (`frame-scan.js:33-50`).
- `runa11yCoreAcrossFrames(url, 'iframe[title=x]', …)` gives `frames: []`: only the roots' descendants are searched, never a root itself.
- Function-valued `customRules` make every child frame fail with a `DataCloneError`. The error is reported per frame, but the docs don't say to pass `fn.toString()` for cross-frame scans, and the engine could do it itself.

<a id="op-10"></a>**OP-10. `index.d.ts` is behind the docs** — Bug, **Low**

- `LegacyTagRunOnly` allows only `type: 'tag'` (`index.d.ts:35`), so the documented `{ type: 'rule' | 'rules' | 'tags', values }` doesn't compile.
- `CustomRule.meta` is required (`index.d.ts:98`); the runtime and docs say it's optional.

**Checked and found right.** runOnly validation of numbers, booleans, functions, prototype names, composite shorthand and null-prototype objects; prototype-like names in profiles, mappings, locales, `messages` and `policyContract`; profile precedence; `contextSelector` escapes and overlapping roots; closed roots and `includeShadowDom: false`; custom rule revival from every function form; **determinism** (re-running gives byte-identical JSON in jsdom and Chromium on every fixture); **entry-point parity** (`runa11yCoreInPage` and `runDomRulesInPage` byte-identical on every fixture under five option sets); serialisability; baselines stable when an unrelated paragraph is added.

---

## 6. Reporters and translations

<a id="rp-1"></a>**RP-1. SARIF uses a property name the schema doesn't have** — Bug, **High**

*In plain words:* nearly every SARIF file the engine writes from a real browser scan is invalid, and a tool that validates SARIF against the schema rejects it. The notes it meant to carry are lost either way.

- Example: scan any page with text in Chromium, `renderSarifReport(result)`, validate against the official schema: `runs[0].invocations[0] should NOT have additional properties: 'toolExecutionNotices'`. Re-run: the official schema contains `toolExecutionNotifications` once and `toolExecutionNotices` zero times.
- **Why nearly every scan.** In a browser, `contrast-computable`'s `pass` always carries a summary occurrence, which is written as one of these notices.
- **Spec.** SARIF 2.1.0, `invocation` object: `toolExecutionNotifications`.
- **Cause.** `src/sarif.js:290`; the wrong name is also in `docs/SARIF.md:19,25` and `tests/sarif.test.js:627`.
- **Evaluation.** Clear bug; a one-word fix, but a visible output change for anyone who already reads the wrong name.

<a id="rp-2"></a>**RP-2. A `fail` with no occurrences is a pass in JUnit, SARIF and baselines** — Bug, **Medium** (related to [C-9](./2026-10-stress-test.md))

*In plain words:* if a rule says `fail` but lists no element (a page-level failure from a custom rule, for example), the CI gate passes: JUnit shows no failure, SARIF has no result, and the baseline sees nothing new.

- Example: a custom rule `runInPage() { return { outcome: 'fail', occurrences: [] } }`. JUnit: `tests="1" failures="0"` and a bare `<testcase/>`. SARIF: 0 results. Baseline: 0 entries, `totalFail: 0`. The HTML report contradicts itself (headline "1 failure", no card). EARL is right (`earl:failed`).
- **Expected.** JUnit already emits a failure for a `cantTell` with no occurrences ("Needs manual review"); a `fail` deserves at least the same.
- **Cause.** `src/junit.js:144` (no `check.outcome === 'fail'` branch); `src/sarif.js` and `baseline.js` loop over occurrences only.
- **Evaluation.** Bug. The first round's C-9 is about the engine accepting this shape; this is about the reporters hiding it. Either fix closes the hole.

<a id="rp-3"></a>**RP-3. A rule that threw is invisible in SARIF, JUnit and the HTML report** — Bug, **Medium**

*In plain words:* when a rule crashes, the result says so in an `error` field, but the reports show it as an ordinary "needs review" item, or not at all.

- Example: a custom rule that throws `'boom'`. Result: `cantTell`, `error: 'boom'`. JUnit: `<skipped message="Needs manual review"/>` with `errors="0"` hard-coded. SARIF: no result and no notification. HTML: "boom" appears nowhere.
- **Spec.** JUnit has `<error>` for exactly this; SARIF has `toolExecutionNotifications` with `level: "error"`.
- **Cause.** `src/junit.js:320,332` (literal `errors="0"`, `classify` ignores `check.error`); `src/sarif.js` reads only occurrences.

<a id="rp-4"></a>**RP-4. JUnit takes a criterion's outcome from its first composite only** — Bug, **Medium**

*In plain words:* WCAG 4.1.2 is checked by two composites ("name" and "ARIA validity"). If the first passes and the second fails, the JUnit suite for 4.1.2 is labelled `pass` while containing a failure.

- Example: `<button aria-pressed="banana">OK</button>` (name passes, ARIA validity fails). JUnit: `<testsuite name="WCAG 4.1.2 … accessible name" failures="1">` with `<property name="criterionOutcome" value="pass"/>`.
- **Expected.** The worst outcome across the criterion's composites, and a criterion-level title.
- **Cause.** `src/junit.js:236` keeps only the first composite per criterion; `docs/JUNIT.md:45` assumes one.

<a id="rp-5"></a>**RP-5. The HTML report fails WCAG 1.4.3 itself** — Bug, **Medium**

*In plain words:* the accessibility report has low-contrast text of its own.

- Light mode: the fail chip `#c1502e` on `#fdece5` is 4.11:1, and the pass chip `#0ca30c` on `#e9f7e9` is 3.03:1. Both are 10.5px bold text, which needs 4.5:1. Re-run (computed from the palette in `src/report.js:19-24`).
- Dark mode: every `h2` stays `#555` on `#16181c` (2.38:1, re-run) and on `#1f2227` (2.14:1); the scorecard digits are `#8a6400` (2.97:1) and `#5f6368` (2.64:1) on `#1f2227`. Chips keep their light backgrounds.
- **Cause.** `src/report.js:695` (`h2 { color:#555 }`, no dark override), the `STATUS` palette used in inline styles, and the `@media (prefers-color-scheme: dark)` block around `:680-690`.
- **Evaluation.** Bug, and an awkward one for an accessibility tool.

<a id="rp-6"></a>**RP-6. EARL: the last result wins, so input order can erase a failure** — Bug (doc contradiction), **Medium**

- Example: two results for the same URL, one with rule `r` failing and one passing. `renderEarlReport([fail, pass])` gives `earl:passed`, and `[pass, fail]` gives `earl:failed`. URL-less results get `about:blank#result-N` by position, so they also change with order.
- **Contract.** `docs/EARL.md:89`: "the same inputs produce byte-identical output **in any order**". The same doc (`:87`) also says "the last one wins". Both cannot hold.
- **Cause.** `src/earl.js:158` (`assertions.set` overwrites).
- **Evaluation.** Bug. Merging to the worst outcome (`fail` > `cantTell` > `pass` > `inapplicable`) keeps the determinism promise and can never hide a failure.

<a id="rp-7"></a>**RP-7. Smaller reporter slips** — Bug, **Low**

- **Dead schema URL.** SARIF `$schema` points to `…/oasis-tcs/sarif-spec/main/Schemata/sarif-schema-2.1.0.json`, which returns 404 (`src/sarif.js:34-35`). The schema now lives at `…/main/sarif-2.1/schema/sarif-schema-2.1.0.json` (re-run: fetched there).
- **Locale chip.** `locale: 'DE'` resolves to `de`, but the report shows "Sprache (angefordert: DE)" as if it fell back; `docs/I18N.md:95` says a case difference isn't a fallback (`src/report.js:215` compares with `!==`; it should use `reason`).
- **Percentages.** The German report shows "6 (4.5%)" beside "9,40:1": `fmtPct` and `renderHeroBar` use `toFixed` (`src/report.js:116`), not `Intl.NumberFormat`.
- **Catalog level.** `docs/RULE_CATALOG.md`'s Level column shows only the highest level, so `aria-hidden-focus` (2.4.7 AA, 4.1.2 A) reads AA and `contrast-computable` (1.4.3 AA, 1.4.6 AAA) reads AAA (`scripts/generate-rule-catalog.js:45`).
- **EARL.md.** It says `aria-allowed-role` is the only automatic rule with no criterion (so is `landmark-role-name-present`), and that `assertedBy` appears "only when you supply" it (a default assertor is always added unless `assertor: null`).

**Checked and found right.** About 770 HTML-injection payloads across every field of the HTML report: nothing ran, no page errors. JUnit stays well-formed XML with control characters, lone surrogates, U+FFFE/FFFF and `]]>`. Every real scan's SARIF validates apart from RP-1. Baselines, SARIF and JUnit agree; all reporters stay linear up to 32k occurrences. Output doesn't depend on the time zone. Translations: placeholders and sections match across en/de/es/fr/ja, no missing or orphaned keys, the browser i18n bundles match `src/i18n`. The WCAG 2.0/2.1/2.2 tables (61/78/86 criteria) and EN 301 549 V3.2.1/V4.1.1 clauses match the official lists.

---

## 7. Robustness and scale

Probed in jsdom and Chromium. The two worst problems only appear in a real browser: jsdom doesn't implement the HTML rule they depend on.

<a id="rb-1"></a>**RB-1. A form field named `parentNode` or `parentElement` makes the scan hang** — Bug, **High**

*In plain words:* a page with `<input name="parentNode">` in a form freezes the scan forever. The browser tab locks up and CI waits until it times out. No result comes back at all.

- Example: `<form><input name="parentNode"><label>Ok<input></label></form>`. Re-run in Chromium: `runa11yCoreInPage` had not returned after 20 s; the same page with `name="zparentNode"` scans in 54 ms. `name="parentElement"` hangs too.
- **Spec.** HTML declares `HTMLFormElement` with `[LegacyOverrideBuiltIns]`: a form's named controls *override* its built-in properties. So `form.parentNode` returns the `<input>`, whose `parentNode` is the form again, and a loop that climbs with `n = n.parentNode` never ends. jsdom doesn't implement this, which is why the test suite can't see it.
- **Where.** Unbounded parent walks: `primaryLangOf` in `form-control-label-quality-manual.js:242-251`, `heading-quality-manual.js:250`, `link-name-quality-manual.js:250`; `textAlternativeLangOf` (`dom-helpers.js:3747`); `dom-helpers.js:5136-5137` (`for (let n = control; n; n = n.parentElement)`); `target-size-minimum.js:359`; `text-spacing-content-loss.js:319,344,509`.
- **Others.** Engines A and B both finish on both examples (in 25–184 ms) and pass the labelled field.
- **Evaluation.** The worst finding of this round: a single, plausible form field (a CMS can name a field anything) takes the whole scan down. Read parents through `Node.prototype`'s getters, as the engine already does elsewhere, and cap every walk.

<a id="rb-2"></a>**RB-2. Named images and forms change results by overriding `document` and form properties** — Bug, **Medium**

*In plain words:* by the same HTML rule, `<img name="X">` or `<form name="X">` replaces `document.X`, and `<input name="X">` replaces `form.X`. The engine reads these as if they were the browser's own, so some names silently hide failures, invent them, or break rules.

- Examples (each compared with the same page using a `z`-prefixed name):

  | Markup | Effect |
  |---|---|
  | `<img name="documentElement" alt="Logo">` | The scan root becomes that image: a nameless `<button>` and an `<img>` without `alt` elsewhere go from `fail` to `notApplicable` / `pass`. **Re-run.** |
  | `<img name="querySelectorAll">` | A correctly labelled `<label for>` input fails; five other rules error. |
  | `<img name="getElementById">` | Broken `aria-labelledby` references are no longer reported. |
  | `<form name="title">` | `page-title-present` errors: `(e.title \|\| "").replace is not a function`. **Re-run.** |
  | `<form><input name="getAttribute"><button></button></form>` | The nameless button's `fail` becomes a `cantTell` error. **Re-run.** |
  | `<img name="getElementsByTagName">`, `"createTreeWalker"`, `"elementFromPoint"`, `"body"`, `"createRange"` | Rules error or go `notApplicable` / `pass`. |
  | `<form aria-foo="bar"><input name="attributes">` | The invalid ARIA attribute on the form is missed. |
  | `<form><input name="assignedSlot"><img src="x"></form>` | The ancestor walk cycles; `img-alt-present` becomes a "depth limit" `cantTell`. |
- **Spec.** HTML: `Document` is also `[LegacyOverrideBuiltIns]` and "supports named properties" (`img`, `form`, `embed`, `object` and `iframe` names, among others).
- **Cause.** `document.documentElement` (`dom-helpers.js:82`), `document.querySelectorAll` (`:1745`), `document.getElementById` (`:813`), `e.title` (`page-title-present.js:83`) and many `el.getAttribute` calls, all read as plain properties.
- **Others** (same pages, same Chromium):

  | Markup | This engine | Engine A | Engine B |
  |---|---|---|---|
  | `<img name="documentElement">` + a nameless button | button missed | button missed (same problem) | button `fail` (right) |
  | `<img name="querySelectorAll">` + a labelled input | label wrongly fails | **the whole scan throws** | pass (right) |
  | `<img name="getElementById">` + `aria-describedby="nope"` | missing reference not reported | `cantTell` | pass |
  | `<form name="title">` | page-title-present errors | `cantTell` | pass (right) |
  | `<form><input name="getAttribute"><button></button></form>` | button's `fail` lost | **the whole scan throws** | button `fail` (right) |

  Engine B handles every case; Engine A shares the weakness, and twice fails harder.
- **Evaluation.** Bug. Names like `title`, `body` or `attributes` are realistic; `documentElement` less so. One fix covers it: take these functions from the prototypes once, at the start of the scan.

<a id="rb-3"></a>**RB-3. image-redundant-alt is quadratic** — Bug (performance), **Medium**

*In plain words:* a page with many images side by side (a gallery, a logo wall) gets slow very quickly: each image re-reads all of its siblings' text.

- Re-run in Chromium, N `<img alt="photo">` siblings in one `<div>` with some text, this rule only: 1,000 → 0.53 s, 2,000 → 1.76 s, 4,000 → 7.19 s (×4 per doubling). The probe measured 8,000 → 31.6 s in Chromium and 150.7 s in jsdom. A few images next to a `<main>` holding about 1.4 MB of text: 100 images 1.9 s, 400 images 7.5 s.
- **Cause.** `image-redundant-alt-manual.js:63-90`: for each image it walks every child of the parent, calling `isAccTreeEligible` and reading each sibling's full `textContent`.
- **Fix.** Build each parent's text once.

<a id="rb-4"></a>**RB-4. Reporting many occurrences among wide sibling lists is quadratic** — Bug (performance), **Low** *(not re-run)*

- `buildSelectorUncached` (`dom-helpers.js:4932`) verifies each selector with `el.matches(… :nth-of-type(k))`, which Blink resolves by walking the siblings, so each check is O(siblings).
- `img-alt-present` in Chromium, flat `<img>` siblings: 2,000 → 70 ms, 8,000 → 422 ms, 16,000 → 1,640 ms; interleaved with `<span>`s, 3.4 s at 16,000. Under jsdom much worse: `heading-quality` takes 19.4 s at 4,000 placeholder headings and 97.9 s inside a full scan at 8,000.
- The first round accepted this cost at about 0.5 s per 10,000 findings ([§4 of the outcomes doc](./2026-10-stress-test-outcomes.md)); these numbers show it is not linear on flat lists, and jsdom pays far more.
- Fix: verify against the engine's own `__siblingInfo` index instead of `matches`.

<a id="rb-5"></a>**RB-5. One element whose `shadowRoot` getter throws breaks about 77 rules** — Bug, **Low**

- Example: `customElements.define('x-bad', class extends HTMLElement { get shadowRoot() { throw new Error('sr') } })` and `<x-bad><button></button></x-bad><img src="q">`. Re-run: `button-name-present` is `cantTell` with `error: "sr"` instead of `fail`, and `img-alt-present` is `notApplicable` instead of `fail`.
- Cause: `collectShadowRoots` reads `el.shadowRoot` without a per-element `try` (`dom-helpers.js:1259,1288`).

<a id="rb-6"></a>**RB-6. An SVG document gets a `page-title-present` failure** — Bug, **Low**

- Example: an SVG file opened on its own (`image/svg+xml`), with a `<title>`. Re-run: `page-title-present` `fail`, located at `head > title`, which doesn't exist.
- **Spec.** WCAG 2.4.2 and ACT 2779a5 concern HTML pages ("web pages" whose document element is `html`); an SVG document's title comes from its own `<title>` child.
- Expected: `notApplicable`.

<a id="rb-7"></a>**RB-7. A depth-limit downgrade is reported through `error`** — Doc contradiction, **Low** *(not re-run)*

- `OUTPUT_SCHEMA.md` (around line 153) says `error` appears only when a rule threw, or for the manual-`fail` coercion. When every occurrence's ancestor walk passes 200 steps (about 100 nested shadow roots, a 1,000-deep DOM), the result carries `error: "Ancestor walk hit its depth limit…"` for a rule that didn't throw (`scripts/build-core.js:~1562`).
- Either the doc or the field should change; a separate `uncertainty` code would fit the engine's design better.

<a id="rb-8"></a>**RB-8. aria-hidden-focus changes what it measures on pages that react to focus** — Debatable, **Low** *(not re-run)*

- The rule moves focus to test elements. A carousel whose `focusin` handler moves `aria-hidden` between slides gives different findings on each scan (`#s2|#s3`, then `#s1|#s3`), and the page is left changed.
- `docs/LIMITATIONS.md` covers the page's script reacting, but says "the findings are not affected", which is not true here. At least the doc should change.

**Not reproduced.** A native `<marquee>` was reported to give `text-spacing-content-loss` a different answer on some scans (20 `pass`, 10 `cantTell` in 30). An independent run of 30 scans gave 30 `pass`. Kept as a lead, not a finding: the cause offered (the browser's own marquee animation isn't listed by `document.getAnimations()`, `text-spacing-content-loss.js:487-505`) is plausible, so timing may decide it.

**Checked and found right.** Empty documents, no `head`/`body`, framesets, XHTML, XML, foreign namespaces, `<html>` removed or replaced, two bodies, quirks mode; ids `__proto__`, `constructor`, `hasOwnProperty`; 5,000 shadow roots, 2,000 slots, 200 `srcdoc` iframes, 5 MB attributes, 100,000 text nodes, `aria-owns` cycles, a 5,000-long `aria-labelledby` chain; wide lists of divs, links, ids, radios and tables (linear to 16,000); 1,000-deep nesting (Chromium itself crashes past about 2,000); pages that wrap or extend built-ins without changing what they return (`Array.prototype.map`, `Object.keys`, `JSON`, frozen prototypes, `Promise`, timers, `CSS.escape`, `Node.prototype.contains`, MutationObserver); rescans after DOM changes.

---

## 8. What to do with this

- **Work from [`FINDINGS.md`](./FINDINGS.md).** It holds these items merged with the first round's open ones, by severity. Nothing here has been changed; each item is for the maintainer to accept, reject or re-scope first. The suggested first batch, by severity and how many pages it touches: RB-1, NM-1, NM-2, NM-3, NM-4, VS-1, VS-2, RP-1.
- **Several items share one cause** and would be one fix each: NM-1 (role tokens), NM-2 and the `headers` part (tree-scoped ID lookup), NM-8 and NM-10 (case-insensitive selectors), VS-5 (viewport parser, in two rules).
- **Before fixing any item, reproduce it on current `main`**, as the first round's outcomes doc advises.
- **Probe scripts** are in [`2026-10-probes-2/`](./2026-10-probes-2/), one folder per section. They assume the same environment as the first round's (see that doc's §8): the repo at `/home/user/core` with `npm ci` and `npm run build` done, and Chromium at `/opt/pw-browsers/chromium`. Raw JSON results over 100 KB were left out. The comparison runs against Engines A and B are not included.
