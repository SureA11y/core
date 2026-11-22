# Stress test of the last 48 hours' changes, twelfth round: findings (2026-11-22)

The twelfth round ran at `ec311ea8`, `main` after #422 (1.17.0 plus the unreleased 1.18.0 work). It stress-tested everything changed in the 48 hours before 2026-11-22, together with the work on round 11's decisions (round 11 report, §2). It had seven parts:
- **the engine, API and reporters** (prefix A12);
- **the rules changed in the window** (prefix U12);
- **contrast**, with the branch of round 11's contrast decisions (prefix C12);
- **the CMS repository and the four packs** (prefixes K12 and PK12);
- **a speed profile** of where whole scans got slower (prefix P12);
- **a first review of #423** before merge (prefix R12F);
- **a final review of #423** before merge (prefix F12).

Every finding is fixed or decided in [#423](https://github.com/SureA11y/core/pull/423), merged 2026-11-22 as `d1a51036` (one commit on `main`; unreleased, for 1.18.0), apart from the CMS and pack findings, which were acted on in their own repositories (§5), and the items left for the owner (§6). #423 also made round 11's decisions. As in rounds 6 to 11, there is no `FINDINGS.md` per area; probes are under [`2026-11-probes-12/`](./2026-11-probes-12/):

| Part | Folder | Prefix | Runtime | Findings |
|---|---|---|---|---|
| Engine, API, reporters | [`api/`](./2026-11-probes-12/api/) | A12 | jsdom, Chromium | 17 |
| Rules | [`rules/`](./2026-11-probes-12/rules/) | U12 | jsdom, Chromium | 17 |
| Contrast | [`contrast/`](./2026-11-probes-12/contrast/) | C12 | jsdom, Chromium | 18 |
| CMS and packs | [`cms/`](./2026-11-probes-12/cms/) | K12, PK12 | Node, Chromium | 7 and 5 |
| Speed profile | [`perf/`](./2026-11-probes-12/perf/) | P12 | jsdom, Chromium | 3 |
| First review of #423 | [`review/`](./2026-11-probes-12/review/) | R12F | jsdom, Chromium | 16 |
| Final review of #423 | [`final/`](./2026-11-probes-12/final/) | F12 | jsdom, Chromium | 9 |

That makes 92 findings. In #423, **53 were evident and are fixed**, and 27 were decided by the owner on 2026-11-22 (§2). Of the 12 CMS and pack findings, 2 were fixed in core (K12-4, K12-5) and the rest in the CMS and pack branches, apart from two release items (§5, §6). **The fixes themselves caused regressions three times**, each caught by a review before merge: the `Object.prototype` hold (R12F-1 to R12F-6), and F12-1, F12-2 and F12-3 (§3).

**Basis**
- `main` at `ec311ea8` (1.17.0 plus the unreleased 1.18.0 work), Chromium 153 (`/opt/pw-browsers/chromium`), jsdom from the repo. For comparison: `254b644f` (round 8) and v1.17.0. The contrast part ran the decisions branch at `fc91853c`; the first review ran #423 at `5f4f9c12`, the final review at `3a50391d`.
- WCAG 2.2 and its Understanding documents are the source of truth; the ACT rules, WAI-ARIA 1.2, HTML and the CSS specs decide the details; Chromium is supporting evidence.

**How findings were verified.** Each finding was reproduced by its probe, most four ways (jsdom and Chromium, before and after), and again while it was fixed, with a regression test that fails without its fix (#423).

**Running the probes.** Run each with `node <probe>` from its folder. They read built checkouts by absolute path, kept as they were: `/home/user/core` is `main` (`ec311ea8` when the round ran), `core-r8` is `254b644f`, `core-v117` is v1.17.0, `core-r11` is `462df5b4`; `r12-api`, `r12-rules`, `r12-contrast`, `r12-review`, `r12-final` and `r12-speed` are the trees each part tested; `pack-*` are the packs' `core-1.18` branches. `PLAYWRIGHT_BROWSERS_PATH` is set to a scratch folder, `/tmp/scratch/pw1234`; change it, and the checkout constants, to run elsewhere. Each checkout needs `npm ci` and `npm run build`. The harnesses are `api/h.js` (jsdom) and `api/bh.js` (Chromium), `rules/h.js`, `contrast/h.js`, `review/h.js` and `review/rh.js`, and `final/h.js`; each runs a case four ways. `api/perf/pages.js` writes the realistic pages. `perf/` holds the speed part's three prototypes as patches. `final/f12-6/` holds the contrast speed pass of F12-6 (`bench.js`, `corpus-chrome.js`, `prof.js`, `fixdiff.js`).

**What the probes leave out.** Generated pages and outputs, copies of other repositories, and anything large:
- the esbuild bundles of `src/index.js` for cross-frame scans, `api/core-iife-*.js` (11 to 12 MB);
- `api/packs/`, copies of `pack-en301549` and `pack-wai-aria` with the core range widened;
- the realistic pages `api/perf/page-*.html` (up to 700 KB; `pages.js` writes them), `corpus-real.json` and the other results (`*.out`, `*.json`, `*.jsonl`, `*.log`, up to 1 MB);
- the contrast screenshots (`*.png`);
- the CMS worktree at `7ef29e6`, the published `pack-rgaa` 1.2.1 used for PK12-1, and the built `engine.js` and `panel.js` the CMS harness loads (2.4 MB);
- `review/prof/`, a CPU profile (2.3 MB);
- `final/rerun/`, earlier probes repointed to #423, which duplicate the folders above;
- from the F12-6 pass, its builds (`dev/`), its results and diffs, and its copy of core's bundle build script.

---

## 1. Findings

### 1.1 Engine, API and reporters

| # | Finding | Sev. | Outcome |
|---|---|---|---|
| A12-1 | `Object.prototype.occurrenceOutcome = 'pass'`, a plain data property, turns every failure into a pass, with no error; v1.17.0 failed it (`hp2.js`). | Medium | Fixed; reworked after R12F-1 to R12F-6 |
| A12-2 | Engine-only flags and options read through the prototype chain: `__budgetSpent` or `timeBudgetMs` there stops every rule; `excludeSelectors` there excludes the page (`hp1.js` to `hp3.js`). | Low–Med. | Fixed, as A12-1 |
| A12-3 | A read-only `Object.prototype.type` or `.profile` throws a bare `TypeError`, with no `PAGE_BUILTINS_BROKEN` (`hp2.js`). | Low | Fixed, as A12-1 |
| A12-7 | `runa11yCoreInPageAsync` starts the time budget after fetching style sheets: a 1,000 ms budget took 3,285 ms and was not marked incomplete (`tb2.js`). | Low–Med. | Decided (§2) |
| A12-4 | A frame the budget never started, in a scan of several profiles, lists every profile as run (`f4.js`). | Low | Fixed |
| A12-5 | Budget warnings give the budget left, unrounded (`883.6999999999534 ms`), or `null ms` outside any frame (`f1.js`, `f4.js`). | Low | Fixed |
| A12-6 | The HTML report says "330 rules not run" for 118 rules, and counts profiles as rules in its banner (`b3.js`). | Low | Fixed |
| A12-8 | `packScript` refuses `<!-- <!--> <script>`, which HTML parses safely (`ps1.js`). | Low | Fixed |
| A12-9 | A `BigInt` or null-prototype option value throws a bare `TypeError` instead of a warning (`o1.js`, `rep1.js`). | Low | Fixed |
| A12-10 | `API_STABILITY.md` leaves `'pass'` out of `occurrenceOutcome`. | Low | Fixed (docs) |
| A12-12 | An empty `runOnly` rule list runs every rule without a word. | Low | Decided (§2) |
| A12-13 | `strictOptions` accepts `probes` of any type, a `Date` for object options, and an empty `profile` or `timestamp` (`o1.js`). | Low | Decided (§2) |
| A12-14 | `runa11yCoreOnHtml` says nothing about its own misspelt keys (`engineOption`, `runonly`). | Low | Decided (§2) |
| A12-15 | A plain-object pack is deep-frozen on first use, with caller objects it reaches (`pk1.js`). | Low | Decided (§2) |
| A12-16 | A selector-only occurrence is read as the selector's first match, and dropped when that match is excluded (`x1.js`). | Low | Decided (§2) |
| A12-17 | Whole scans in Chromium 8–18% slower than at round 8 on 3 of 4 pages; `contrast-computable` 24–38% slower on two (`perf/abt.js`, `perf/abc.js`). | Low | Decided (§2) |
| A12-11 | "applicability returned a undefined" (`a1.js`). | Trivial | Fixed |

What behaved correctly: `timeBudgetMs` with one profile, several and across frames, in every reporter; `maxOccurrencesPerRule` and its plurals in five locales; `excludeSelectors` for custom rules; the strict checks added in round 10; `checkPack`, `definePack` and `packScript`'s other cases; locale fallback; baseline keys; nested and concurrent scans; hostile pages beyond `Object.prototype`; no leak in 20 jsdom and 60 Chromium scans; reporters growing linearly to 4,000 failures.

### 1.2 Rules

| # | Finding | Sev. | Outcome |
|---|---|---|---|
| U12-1 | `resize-text-content-loss` skips text a clipping box hides wholly, even when the box shows its other text, so a box that loses a whole line passes. | High | Decided (§2) |
| U12-4 | `text-spacing-content-loss`: a vertical box already cut, cut further by spacing, was `TEXT_CLIPPED_FURTHER` at round 8 and v1.17.0, and is now not applicable. A regression. | Medium | Fixed: lines counted by column |
| U12-7 | `aria-prohibited-children` does not follow shadow roots, while `aria-required-children` does. | Medium | Fixed: flat tree |
| U12-8 | `target-size`: unstyled native range, select, file and colour inputs fail, with no user-agent exception. | Medium | Fixed; scope decided (§2) |
| U12-6 | `tabindex` quotes the raw attribute uncapped (200 KB in, 200 KB out). | Low–Med. | Fixed |
| U12-2 | `resize-text-content-loss` below 640 px still says "as a 1280 pixel window shows the page at 200% zoom", and leans fail on a 400% cut. | Low | Message fixed; lean decided (§2) |
| U12-3 | `clipCss` names `contain: content` for a box styled `content-visibility: auto`. | Low | Fixed |
| U12-5 | `text-spacing-content-loss` is not applicable on a page whose only text is already clipped. | Low | Fixed |
| U12-9 | A checkbox shrunk by author `zoom` passes as user-agent sized; the same size by `transform: scale` fails. | Low | Fixed |
| U12-10 | Any small icon in a sticky header is asked about once any small page target can scroll past it. | Low | Decided (§2) |
| U12-11 | `click-handler-keyboard-operable` counts hidden and screen-reader-only text as short visible text. | Low | Fixed |
| U12-12 | `click-handler-keyboard-operable`: jsdom and Chromium disagree on a styled `<span onclick>` inside a `<button>`. | Low | Fixed |
| U12-13 | `click-handler-keyboard-operable` leans fail on badges with tracking handlers, and misses gradients and symbol-only controls ("✕"). | Low | Decided (§2) |
| U12-14 | `form-group-name-present` reports radios split over two named fieldsets as "in no group with a name". | Low | Decided (§2) |
| U12-15 | `p-as-heading` does not ask about `<strong>Ingredients</strong>:`, and asks about a 13-word bold line as "short". | Low | Decided (§2) |
| U12-16 | `css-focus-indicator-suppressed`: jsdom asks about a selector list Chromium drops; the quoted selector differs; shadow-root sheets, `:focus-within` and `:has(:focus)` not read. | Low | Parity fixed; gaps decided (§2) |
| U12-17 | `target-size-minimum` and `css-focus-indicator-suppressed` slower in Chromium on the composite page (+27%, +18%). | Low | Decided (§2) |

### 1.3 Contrast

Run on `fc91853c`, `main` with round 11's contrast decisions (B11-9, B11-10, D6, D11).

| # | Finding | Sev. | Outcome |
|---|---|---|---|
| C12-2 | Text placed straight into a shadow host is measured in the host's colour, not its slot's: grey text passes at 21:1 (since round 8). | High | Fixed |
| C12-3 | Text an `overflow: hidden` ancestor cuts off is measured where its element's box shows; WooCommerce's star-rating text for screen readers fails in Chromium. | High | Fixed |
| C12-1 | B11-9: a currency sign in a flex, grid or float box is text under jsdom and a graphic in Chromium. | Medium | Fixed: those boxes are block boundaries under jsdom |
| C12-4 | D11: jsdom measures SVG text against a shape hidden by `display` or `visibility`. | Medium | Fixed |
| C12-5 | D11: jsdom ignores a baseline set in CSS on SVG text. | Medium | Fixed: asked about |
| C12-7 | D11: jsdom measures text over a `<circle>` or `<ellipse>`; Chromium asks. | Medium | Fixed: measured in both |
| C12-9 | D6: Bootstrap's disabled nav link without `href` now fails. | Medium | Decided (§2): no change |
| C12-10 | `aria-disabled` on a shadow host exempts its shadow text from `symbol-graphic-contrast` but not from the text rules. | Medium | Fixed |
| C12-13 | B11-9: the search for a sign's neighbours has no total bound: 6.8 s to 36.2 s on a built page. | Low–Med. | Fixed: one budget per scan |
| C12-6 | D11: jsdom ignores SVG geometry set in CSS. | Low | Fixed: asked about |
| C12-8 | D11: 1em per character asks about most labels that fit, and is not a strict bound for `@` or emoji. | Low | Decided (§2) |
| C12-11 | B11-10: text not seen (`opacity: 0`, `font-size: 0`, a box of no width) counts as visible text. | Low | Fixed |
| C12-12 | B11-9: a sign before a linked amount (`<span>$</span><a href>45</a>`) is a graphic. | Low | Decided (§2) |
| C12-14 | Under jsdom, a link with `color: revert` inherits; Chromium gives the link colour. | Low | Fixed |
| C12-15 | An underline in the background colour on a link's content counts as a cue. | Low | Fixed |
| C12-16 | The four decision commits had no changelog entry. | Low | Fixed |
| C12-17 | A lone "€" fail reads as a plain text fail, with no word on why it is held to the text ratio. | Low | Decided (§2) |
| C12-18 | Under jsdom, text over a positioned `::before` is skipped, not asked about. | Low | Fixed: asked about |

### 1.4 CMS and packs

| # | Finding | Sev. | Outcome |
|---|---|---|---|
| PK12-1 | `pack-raweb` depends on `pack-rgaa ~1.2.1`, whose published version declares core `~1.17.0`, so core 1.18 skips both packs; the branch copy of `pack-rgaa` still says 1.2.1. | High | Open: release work (§6) |
| K12-1 | `resize-text-content-loss` findings are filed "In your content", though they name theme CSS. | Medium | Decided (§2) |
| K12-2 | The CMS decision record says the 1.4.4 rule does not run in the panel's check; the page checker runs it at 640 px or less. | Low | Fixed (CMS) |
| K12-3 | Editors see core's developer wording for the new rules and codes. | Low | Decided (§2) |
| K12-4 | Core's `LIST_ROLE_OVERRIDDEN` hint for a landmark parent cannot be followed. | Low | Fixed (core) |
| K12-5 | Core says "as a 1280 pixel window shows the page at 200% zoom" at 360 px; ratios keep a decimal point in French, German and Spanish. | Low | Fixed (core: U12-2, decimals per language) |
| K12-6 | The panel and `pack-cms` declare core `^1.17.0`, but their tests name rules 1.17.0 lacks. | Low | Open: release work (§6) |
| K12-7 | Core asks about the panel's own "How to check" labels as headings. | Low | Decided (§2) |
| PK12-2 | `pack-rgaa` calls its three-checkbox threshold RGAA's; RGAA gives no number. | Low | Wording fixed; threshold decided (§2) |
| PK12-3 | `pack-wai-aria` narrows its core range to `^1.18.0` for one test. | Low | Decided (§2) |
| PK12-4 | `pack-en301549`'s changelog leaves out the clauses three new rules feed. | Low | Fixed (pack) |
| PK12-5 | `pack-rgaa` maps `symbol-graphic-contrast` to 3.3.2; unverified whether DINUM reads symbols as graphics. | Info | Decided (§2) |

### 1.5 Speed profile

The machine was shared (load 16 to 28 on 4 cores), so the part measured renderer CPU time over CDP as well as wall time. Over the 11 realistic pages, `ec311ea8` used 7.1% more renderer CPU than v1.17.0 and 11.4% more than round 8. Most of it is new work: new rules, and new checks per ancestor in `contrast-computable`. Nothing leaked. Three prototypes were made, each with no change on 155 fixtures and the focus fuzz cases:

| # | Finding | Sev. | Outcome |
|---|---|---|---|
| P12-1 | Under jsdom, `css-focus-indicator-suppressed` tests every element against every rule that removes an outline, even one that needs a class or id no element has. | Low | Fixed: such rules skipped |
| P12-2 | `symbol-graphic-contrast` reads every element's children to find symbol text: 100 of 133 profiled ms on the composite page. | Low | Fixed: one walk per tree (11 ms) |
| P12-3 | The label text-node test's 30 s wall bound fails on a loaded machine; the scan is linear. | Low | Fixed: bounded by processor time |

### 1.6 First review of #423

An independent stress test of #423 at `5f4f9c12`, four ways. The contrast family was out of scope.

| # | Finding | Sev. | Regression? | Outcome |
|---|---|---|---|---|
| R12F-2 | On a non-extensible `Object.prototype`, a held value is deleted and never restored. | High | Yes (A12-1's fix) | Fixed: hold replaced |
| R12F-1 | Page focus and blur handlers run during the scan and see `Object.prototype` stripped; page code throws. | Medium | Yes (A12-1's fix) | Fixed: hold replaced |
| R12F-5 | A value page code re-adds during the scan is not held, so failures still turn into passes. | Medium | Yes (A12-1's fix) | Fixed: hold replaced |
| R12F-6 | Any read-only, non-configurable value on `Object.prototype` refuses the whole scan. | Medium | Yes (A12-1's fix) | Decided (§2) |
| R12F-8 | One slow style sheet can use the whole budget, so no rule runs. | Medium | No (A12-7's fix) | Decided (§2) |
| R12F-11 | A text input the author sized is still exempt as user-agent sized. | Medium | No (U12-8's fix) | Decided (§2) |
| R12F-12 | Document style sheets are applied to elements in shadow roots (also on `main`). | Medium | No | Fixed |
| R12F-13 | The candidate query moved ahead of the early exit: up to 50 times slower alone in jsdom. | Medium | Yes (U12-16's fix) | Fixed |
| R12F-9 | A plain-object pack from another realm is neither copied nor frozen. | Low–Med. | No (A12-15's fix) | Fixed |
| R12F-10 | Empty selections through `engineOptions`, and `runOnly: {}`, still run every rule without a word. | Low–Med. | No (A12-12's fix) | Fixed: warned, and thrown under `strictOptions` |
| R12F-3 | Restoring reverses the order of held keys, so for-in order changes for good. | Low | Yes (A12-1's fix) | Fixed: hold replaced |
| R12F-4 | A page's write to a held key during the scan is overwritten at release. | Low | Yes (A12-1's fix) | Fixed: hold replaced |
| R12F-7 | `preloadStyleSheets` reads its deadline and timeout through the prototype chain. | Low | No (A12-7's fix) | Fixed |
| R12F-14 | Unreplaced WordPress SEO variables (`%%title%%`) are not read as placeholders. | Low | No | Decided (§2) |
| R12F-15 | The hover-only marquee check misses handlers added on load and jQuery's `.hover`. | Low | No | Decided (§2) |
| R12F-16 | A comment in `aria-prohibited-children` says slot fallback is left out; the code, rightly, includes it. | Info | No | Fixed |

### 1.7 Final review of #423

An independent stress test of #423 at `3a50391d`, four ways, with the earlier probes rerun against it.

| # | Finding | Sev. | Outcome |
|---|---|---|---|
| F12-1 | Declarations that leave a checkbox or radio at the same size (normalize.css, `*{padding:0}`, `max-width:100%`) count as author-sized, so such lists now fail in Chromium. A regression of the R12F-11 fix. | High | Fixed: only declarations that change the drawn size count |
| F12-2 | Under jsdom, a `::before` that is hidden or a small corner badge turns a real contrast fail into a question. A regression of the C12-18 fix. | Medium | Fixed |
| F12-3 | The early exit of R12F-13 is skipped on any page with an open shadow root: 107 to 3,787 ms alone in jsdom. | Low–Med. | Fixed |
| F12-6 | Whole-scan renderer CPU up 7.7% against `main` and 12.4% against v1.17.0 over the 11 pages; the commit had said "unchanged within noise". | Low–Med. | Decided (§2): speed pass |
| F12-4 | A read-only value on `Object.prototype` still stops the scan with a bare `TypeError` for 12 names, against the docs. | Low | Fixed |
| F12-5 | The engine still reads its own records through the prototype chain (4,164 names on a composite scan), against the docs. | Low | Fixed for the names found; docs corrected; rest open (§6) |
| F12-7 | Host text no slot takes, which is not drawn, is measured and fails (also on `main`). | Low | Fixed |
| F12-8 | Outlines removed through `::part()`, `::slotted()` and `:host` are not read. | Low | Decided (§2) |
| F12-9 | jsdom and Chromium quote the focus rule's selector differently. | Info | Fixed |

---

## 2. Decisions taken

All taken by the owner on 2026-11-22. The core ones are made in [#423](https://github.com/SureA11y/core/pull/423), each with a test that fails before it; the CMS and pack ones are in their repositories (§5).

**Engine and API**
- **A12-7:** the time budget counts the browser bundle's style-sheet preload; after R12F-8, the preload gets half the budget at most, and sheets not read are named (`engine.incomplete.styleSheetsNotRead`).
- **A12-12:** an empty `runOnly` list warns, and throws under `strictOptions`.
- **A12-13:** stricter option checks: `probes` a plain object of JSON data; object options plain objects; `profile` and `timestamp` not empty.
- **A12-14:** the test helpers warn about a key they do not know, naming the closest.
- **A12-15:** a plain pack is frozen as a copy; the caller's objects stay as they were.
- **A12-16:** a selector-only occurrence is dropped only if every element it matches is excluded.
- **A12-17:** a speed pass (F12-6).

**Rules**
- **U12-1:** text a box hides wholly while it shows its other text is asked about, leaning fail.
- **U12-2:** below 600 px wide, `resize-text-content-loss` asks with no lean.
- **U12-8:** unstyled native controls are exempt from target size; scope confirmed. After F12-1, only declarations that change the drawn size make a control author-sized.
- **U12-10:** a pinned target is asked about only when a page target really comes within reach of it.
- **U12-13:** more control cues are read, and the fail lean comes only from a strong one.
- **U12-14:** `RADIO_GROUP_SPLIT` for radios split over named groups, and later `CHECKBOX_GROUP_SPLIT` for checkboxes, with no lean.
- **U12-15:** a trailing colon outside the bold counts; a short bold line is 8 words or fewer.
- **U12-16:** shadow-root style sheets, `:focus-within` and `:has(:focus)` are read.
- **U12-17:** folded into the speed pass.

**Contrast**
- **C12-8:** without a layout, SVG text is taken as up to 1.1em a character, or 2em for wide characters.
- **C12-9:** Bootstrap's disabled nav link without `href` still fails; no change.
- **C12-12:** a link's digits count as a sign's neighbour.
- **C12-17:** the message says why a sign read with its price is held to the text ratio.

**CMS and packs**
- **K12-1:** resize-text findings are theme findings, unless the box is in the content.
- **K12-3:** editor texts for the new rules in `pack-cms`, with a "For your developer" part.
- **K12-7:** "How to check" becomes a heading.
- **PK12-3:** `pack-wai-aria` keeps the wide range `^1.15.0`.
- **PK12-5:** RGAA says nothing on symbols, so 3.3.2 is kept as the pack's reading.
- **PK12-2 (the gap):** `pack-rgaa` asks from 2 checkboxes sharing a name.
- **Panel:** English is split into its own file.

**From the reviews**
- **R12F-1 to R12F-6:** the hold on `Object.prototype` was replaced by records with no prototype and reads of own properties; `Object.prototype` is left as the page set it.
- **R12F-8:** style sheets get half the budget at most.
- **R12F-11:** controls the author sized are judged as targets.
- **R12F-14:** `%%var%%` and "Sample Page" count as placeholders.
- **R12F-15:** hover handlers added on load or with jQuery count as hover-only.
- **F12-6:** speed. Rare CSS features are gated per page. The result is +0.7% against `main` and +9% against v1.17.0 in renderer CPU; the remainder is new checks. No verdict changed on the 155 fixtures.
- **F12-8:** `::part`, `::slotted` and `:host` are read.

## 3. Lessons

**The reviews of #423 were needed three times.** Each review found regressions that the fixes had caused:
- the first review found that the `Object.prototype` hold, the fix of A12-1 to A12-3, broke pages in five ways (R12F-1 to R12F-5) and refused scans it need not (R12F-6);
- the final review found F12-1 (the fix of R12F-11 made normalize.css checkboxes fail), F12-2 (the fix of C12-18 lost real contrast failures under jsdom) and F12-3 (the fix of R12F-13 lost its early exit on pages with a shadow root).

Lesson: the stress test of a pull request before merge, round 10's measure, was needed three times on one pull request. Fixes to fixes need the same review as the first fixes.

**CI catches worth a lesson**
- ACT rule afw4f7 caught a D6 regression: a label in an `aria-disabled` group must stay exempt. The ACT test cases guard decisions as well as fixes.
- Two tests depended on the machine's fonts and the message locale. Tests must fix both.
- A test raced against nested frames loading. A test with frames must wait for them.
- CodeQL flagged incomplete backslash escaping when requoting a selector; fixed.
- A name read through the safe DOM (`attachShadow`, `label`) was missing from `src/core/safe-dom.js`'s list.

## 4. Speed

At `d1a51036`, after the F12-6 pass, whole scans use 0.7% more renderer CPU than at `ec311ea8` and about 9% more than v1.17.0 over the 11 realistic pages. The remainder is new checks. A re-measure on an idle machine is left for the release (§6).

## 5. Downstream

- **Published packages.** Their results changed only for a French decimal comma: core now writes decimals in messages as each language writes them ("1,36:1").
- **Pack draft branches** (`core-1.18`):
  - `pack-rgaa`: `77c7fe8` (asks from 2 checkboxes), `0f71a00` (the decimal comma), `c77a55b` (review steps regenerated), `8154d0f` (the threshold is the pack's), `1aa4301` (symbols as graphics are the pack's reading);
  - `pack-en301549`: `0fe1bfb` (the changelog names the clauses the new rules feed);
  - `pack-wai-aria`: `d141fb4` (keeps `^1.15.0`).
- **CMS.** The CMS tests pass. The branch `round-12-docs` holds the CMS decisions (K12-1, K12-2, K12-3, K12-7, and English in its own file); it is pushed, and no pull request is open.

## 6. Still open, for the owner

1. Under jsdom, ask instead of emulating layout-dependent contrast cases (SVG geometry, `::before` sizing, flex blocks).
2. A complexity budget for new contrast edge cases: add them only from real pages or ACT, not because a stress test can build them.
3. Some internal records are still read through the prototype chain (F12-5); `TROUBLESHOOTING.md` says so.
4. Known limits: forwarded `exportparts`; a closed root on a built-in element styled through `:host` (the hole in the F12-6 gate); closed shadow roots in general.
5. Release work for 1.18.0: `pack-rgaa` 1.3.0, then `pack-raweb`'s dependency on it (PK12-1); lockfiles; the core ranges of `pack-cms` and the panel (K12-6); a speed re-measure on an idle machine.
