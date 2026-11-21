# Stress test of `main`, sixth round: findings (2026-11-19)

A sixth stress test of `main` at `23e0a387`: version 1.17.0 plus the unreleased work meant for 1.18.0. Most effort went to what 1.18.0 adds or changes:
- the new `reflow-horizontal-scroll` rule (WCAG 1.4.10);
- the engine-wide `excludeSelectors` filter;
- the rules changed for 1.18.0: `p-as-heading` at body size, `td-has-header` from 2 by 2, and heading levels from `aria-level`;
- the seven experimental APIs due to be made stable or removed at 1.18.0: `skip-link`'s `details.lean`, the `standard.review` dictionary keys, translations by id, tests under requirements, `deriveStandard`, standard data and laws.

Around that, it ran the same cases through four other engines, timed full scans before and after, and looked for memory that scans keep.

This round has no `FINDINGS.md` per area to match its report, as rounds 2 to 5 have. Its findings were fixed the day after it ran, so each area's folder holds the probes, and the report says where each one was fixed. Each area's probes are under [`2026-11-probes-6/`](./2026-11-probes-6/):

| Area | Folder | Prefix | Runtime | Confirmed |
|---|---|---|---|---|
| `reflow-horizontal-scroll` | [`reflow/`](./2026-11-probes-6/reflow/) | RF | Chromium at 320px, under phone emulation and in frames | 16 |
| Changed rules, exclusion filter, reporters | [`changes/`](./2026-11-probes-6/changes/) | CG | jsdom, Chromium (AX tree for heading levels) | 15 |
| Experimental APIs and pack tooling | [`experimental/`](./2026-11-probes-6/experimental/) | EX | Node, TypeScript | 14 |
| Other engines | not kept (the comparison's scripts named the engines; its results are summarised here, engines by letter) | CE | Engine A, engine B, engine C, engine D, in Chromium; engine E, a browser audit tool, a test runner and the ACT rules by their sources | 6 (all gaps or features) |
| Speed and memory | [`perf/`](./2026-11-probes-6/perf/) | PF | Chromium, jsdom | 1 |

That makes 52 confirmed findings. None is High; 16 are Medium, 33 Low, and 3 are features with no severity. No scan threw and nothing crashed.

**Basis**
- `main` at `23e0a387`. With lint, the format check, rule validation and every test file, 5,688 tests passed and 9 failed there. The 9 were browser tests that start Playwright's own Chromium build, not `tests/helpers/chromium.js`, and failed where only another build is installed (CG-15).
- Chromium 153.0.8010.12 (`/opt/pw-browsers/chromium`), jsdom from the repo. CI's Chromium is Playwright's own build (151), with other fonts.
- WCAG 2.2 and its Understanding documents are the source of truth; WAI-ARIA 1.2, ARIA in HTML, HTML-AAM, CSS Overflow 3, CSS Writing Modes 4 and CSS Containment decide the details; Chromium's layout, `scrollWidth` and accessibility tree are supporting evidence.

**How findings were verified.** Each probe reproduced its findings with a minimal script, in [`reflow/first-pass/`](./2026-11-probes-6/reflow/first-pass/), [`changes/`](./2026-11-probes-6/changes/) and [`experimental/`](./2026-11-probes-6/experimental/). During consolidation, RF-1, CG-1, CG-4, EX-1, EX-2 and EX-3 were re-run separately; the others are marked *(not re-run)* where they appear below. Every finding was then reproduced again while it was fixed, each with a regression test that fails without its fix ([#406](https://github.com/SureA11y/core/pull/406)); [`reflow/fixes/`](./2026-11-probes-6/reflow/fixes/) holds the cases that checked the reflow fixes.

## What held up

- **Reflow measures what Chromium lays out.** In 17 cases the rule's overflow matched Chromium's `scrollWidth` each time. It is the only engine of those compared that measures 1.4.10: engine A, engine B, engine C and engine E check only the meta viewport, and there is no ACT rule for it.
- **`link-name-quality-link-only`** is the only automated check for 2.4.9's generic link text of the engines compared, with the 2.4.4 / 2.4.9 split kept.
- **Heading levels are read most correctly.** Engine A fails `h1` on `<h1 role=heading>`, engine D reads tags only, engine E lets the tag beat `aria-level`, and engine C reads `aria-level="2.5"` literally.
- **`p-as-heading` at body size** catches bold titles engine A misses, with far fewer false positives than engine B or engine D.
- **`td-has-header` from 2 by 2** matches F91 better than engine A and a browser audit tool (3 by 3 and up) or engine C (tables with headers only), without engine B's false positive on a single-row table.
- **Counting excluded occurrences** (`excludedOccurrences`) is unique: every other engine drops them silently.
- **The experimental APIs' round trips:** `standardDataOf(standardFromData(x))` deep-equals `x` and is deep-frozen; `__proto__` and `constructor` keys are refused in data; translations fall back as documented; `uses` cycles are refused; pack ranges are reported.
- **Speed and memory in Chromium:** full scans are within the run's noise of 1.17.0 at desktop widths; the heap stays flat over 100 repeated scans.

---

## 1. Findings

Ordered by area, the most damaging first in each. The severity is the README's. Every finding below is fixed or decided, except the four marked *open* (§2, §3).

### Reflow (`reflow-horizontal-scroll`, new in 1.18.0)

| # | Finding | Verdict | Sev. | Fixed |
|---|---|---|---|---|
| RF-1 | **Under phone emulation an overflowing page is `notApplicable`.** The rule decided applicability from `innerWidth`, which Chromium widens exactly when the page overflows (608 against a `clientWidth` of 320), so the rule could never fail on an emulated phone. Without a meta viewport (980 wide) it was `notApplicable` too. | Bug | Medium | [#406](https://github.com/SureA11y/core/pull/406), `d2e7dbcc`: the layout viewport's width, the smaller of the root's `clientWidth` and `innerWidth` |
| RF-2 | **A fixed box wider than the viewport passes**, such as a cookie banner whose Accept and Reject buttons sit past the edge: fixed boxes don't add to the scroll width, so what is past the edge can never be reached. *(not re-run)* | Gap | Medium | #406, `d2e7dbcc`: a fixed box is measured against the viewport, `CLIPPED_AT_VIEWPORT_EDGE` |
| RF-3 | **Exemptions too broad, each a false pass on real layouts:** an app shell (`html,body{overflow:hidden} #app{overflow:auto}`) counted as the element's own scroller, so a layout table and media in it passed; `text-overflow: ellipsis` exempted the form fields it clipped; an outer layout table exempted a form inside a scroller (`closest('table, pre')` crossed the scroller); `contain: paint` and `content-visibility: auto` clipped unseen; `html{overflow-y:scroll}` with `body{overflow-x:hidden}` lost the body's clipping. *(not re-run)* | Gap | Medium | #406, `d2e7dbcc` (`isShell`, `containsPaint`, `bodyPropagates`) |
| RF-4 | **The verdict depends on scroll position:** what is past a box's edge was measured where it is drawn, so a scroller scrolled to its end passed. *(not re-run)* | Bug | Medium | #406, `d2e7dbcc`: measured unscrolled (`scrollLeft`) |
| RF-5 | **Open shadow DOM isn't walked:** content in a shadow root was reported as the host's (`UNATTRIBUTED`, which the changelog keeps for closed roots and pseudo-elements), and passed under root clipping. *(not re-run)* | Bug | Medium | #406, `902f0678`: shadow roots walked, flat-tree parents |
| RF-6 | **Fields: the fail is both too broad and too narrow.** Hidden or disabled inputs turned a question into a fail; a row failed when only its help text was cut; `contenteditable`, `menuitemcheckbox`, `menuitemradio` and `option` were missed; `<input type=submit>` failed while `<button>` was only asked about. Fields cut at the viewport edge were only asked about, while the same fields in a card failed. *(not re-run)* | Inconsistency | Medium | #406, `902f0678`: only a cut, shown, enabled field fails, a button never does |
| RF-7 | **Content cut at the start edge is never measured:** a negative margin or `left: -100px` in left-to-right text, the mirror in right-to-left text, and `<body dir=rtl>` under a left-to-right `<html>`. *(not re-run)* | Gap | Low | #406, `902f0678` (`beforeStartOf`, the body's direction) |
| RF-8 | **`body { writing-mode: vertical-rl }` fails at 771px.** It should be `notApplicable`, as it is when the root sets it: vertical text reflows at 256 CSS pixels high. *(not re-run)* | Bug | Low | #406, `d2e7dbcc`: the body's writing mode is the page's |
| RF-9 | **A fixed form inside an `overflow: hidden; transform` box passes:** `escapes()` took a fixed box to escape every box. An absolutely positioned box was checked for `transform` only, not `filter`, `will-change` or `contain`. *(not re-run)* | Gap | Low | #406, `d2e7dbcc` (`holdsFixed`, `fixedOf`) |
| RF-10 | **A carousel of cards that each fit leans fail.** A row of cards each within 320px is WCAG's own sufficient technique (G225). | Bug | Low | #406, `ea0e7d00`: leans pass, with its own message |
| RF-11 | **Two-dimensional widgets that aren't native fail outright** (`role=grid`, a map with `role=application`), and a long `<math>` gives 17 separate fails. | Inconsistency | Low | #406, `ea0e7d00`: grids are tables, maps and formulas media, asked about |
| RF-12 | **One cause gives many findings:** a `body { min-width }` fails each child and never names the body; a navigation that doesn't wrap fails each link. | Inconsistency | Low | #406, `ea0e7d00`: the body named once; inline content reported by its block |
| RF-13 | **A collapsed panel (`height: 40px; overflow: hidden`) is reported as cut off sideways:** only the horizontal position was compared. *(not re-run)* | Bug | Low | #406, `d2e7dbcc`: vertical overlap counts for boxes that hide vertically |
| RF-14 | **Slow inside clipping boxes:** deep pages in an `overflow: hidden` wrapper took 3 to 6 times as long (20,000 elements: 160 ms to 600 to 990 ms); `escapes()` and `exemptInScrollBox()` weren't memoised and ran before the cheap geometry test. | Bug (speed) | Low | #406, `ea0e7d00`, `62b4c35d`: 2 to 3 times faster than before inside clipping boxes, within a few ms elsewhere |
| RF-15 | **Smaller gaps:** `overflow-clip-margin` ignored; text hidden by `clip-path: inset(50%)` reported; the 50-findings cap silent; `SCROLLS_IN_CONTAINER`'s message called the overflow "wider than the box"; a `<frameset>` document passed without looking at its frames. *(not re-run)* | Bug | Low | #406, `d2e7dbcc`, `902f0678`, `ea0e7d00`, `62b4c35d` (`data.omitted`, `notApplicable('frameset')`) |
| RF-16 | **A `visibility: hidden` panel partly past the edge is reported**, though nothing in it is drawn. It failed on `23e0a387`; on `c1bb82de` it is asked about (`CLIPPED_AT_VIEWPORT_EDGE`, cantTell), as a shown panel is ([`recheck-hidden-panel.js`](./2026-11-probes-6/reflow/recheck-hidden-panel.js)). | Bug | Low | **Open** (now a question, not a fail) |

### Changed rules, the exclusion filter and the reporters

| # | Finding | Verdict | Sev. | Fixed |
|---|---|---|---|---|
| CG-1 | **When the only failing occurrence is excluded, the result stays `fail` and points at an element that passed.** A rule failing `#pb` (excluded) and passing `#pm` gave `fail [#pm]`: a SARIF error, a JUnit failure, an EARL `failed` and a baseline entry, all on `#pm`. The outcome was not worked out again from the occurrences left (`normalizeRuleResult`, generated into `src/core.js`). | Bug | Medium | #406, `73b5ab71` |
| CG-2 | **A `pass` whose occurrences are all excluded stays `pass`**, where the changelog and OUTPUT_SCHEMA say `notApplicable` with `coercedFrom`; `index.d.ts` didn't allow `coercedFrom: 'pass'`. A `cantTell` left with only passing occurrences stayed `cantTell`. *(not re-run)* | Bug | Medium | #406, `73b5ab71` |
| CG-3 | **Occurrences that escape the filter:** one given by selector only, one whose node is a text node, and one in an excluded iframe's document, against OUTPUT_SCHEMA and ENGINE_OPTIONS. *(not re-run)* | Bug | Medium | #406, `73b5ab71` (`isOccurrenceExcluded`) |
| CG-4 | **Excluding an area changes page-level verdicts** (older than 1.18.0; the engine-wide filter makes it more visible). With `<h1>`, an excluded `<div><h2>`, then `<h3>`, `heading-order` asks about a skip from 1 to 3 that readers never meet; excluding the header that holds the only `<h1>` makes `page-has-heading-one` ask about a missing `<h1>`. Engine A, a test runner and engine C keep the excluded area as context, as `td-has-header` already does with an excluded `<thead>`. | Inconsistency | Medium | #406, `d8a5f4c1`: excluded areas are context, never reported in; decided 2026-11-19 |
| CG-5 | **`p-as-heading` asks about the last line of a bold run** (an address), against the changelog's "a run of bold lines… left out": only the next element was compared. Engine A compares the previous one too. | Bug | Low | #406, `3558ca2a` |
| CG-6 | **`p-as-heading` false positives on bold sentences** ending in a closing quote, in Arabic `؟` or Devanagari `।`, and on bylines and dates. *(not re-run)* | Bug | Low | #406, `3558ca2a` (`SENTENCE_END` past `CLOSERS`) |
| CG-7 | **A semibold `<p>` (600, set on the paragraph itself, as design systems set titles) is never asked about.** *(not re-run)* | Gap | Low | #406, `3558ca2a`: heavier than the text around it counts; large semibold titles get `BOLD_LARGE_PARAGRAPH` |
| CG-8 | **`BOLD_SHORT_PARAGRAPH` is raised on text at 30px**, a code meant for body size. *(not re-run)* | Bug | Low | #406, `3558ca2a` |
| CG-9 | **Under jsdom, `em` and `%` font sizes are read against 16px, not the parent's size:** `1.4em` in a 12px parent gave `BOLD_LARGE_DIV` at 22.4px. A false positive new in 1.18.0, from reading sizes with `parsePx`. | Bug | Low | #406, `3558ca2a` (`fontPxOf`) |
| CG-10 | **`td-has-header` from 2 by 2:** an empty second row, a hidden row or an empty column brings a one-dimensional table in. | Bug | Low | #406, `3558ca2a`: a table sized as a reader meets it |
| CG-11 | **`<table role=presentation aria-label=…>` is skipped**, though browsers ignore that role on a table with a global ARIA attribute. Older, but small tables are only checked from 1.18.0. *(not re-run)* | Gap | Low | #406, `3558ca2a` |
| CG-12 | **`aria-level` above 9 is read as it is**, while Chromium ignores it and keeps the tag's level, so a real skip is missed. `"0"`, `"-1"` and `"abc"` are exposed as 1 by Chromium; the engine uses the tag's level, as WAI-ARIA's default for an invalid value says. | Inconsistency | Low | #406, `3558ca2a`: levels 1 to 9 only. The invalid values follow WAI-ARIA, where Chromium differs: not changed |
| CG-13 | **A manual rule can get `coercedFrom: 'fail'`**, an outcome it can never have. *(not re-run)* | Bug | Low | #406, `73b5ab71` |
| CG-14 | **SARIF reports the passing occurrences of a failing result as errors**; so did JUnit, the HTML report and baselines. | Bug | Low | #406, `4d55a537` |
| CG-15 | **Nine browser tests fail where only another Chromium build is installed:** they start Playwright's own build instead of using `tests/helpers/chromium.js`. | Bug (tests) | Low | #406, `0115673c`: four frame tests use the helper; `procedures-render` finds Chromium through `CHROMIUM_EXECUTABLE_PATH` on `c1bb82de` |

### Experimental APIs and pack tooling (all due at 1.18.0)

| # | Finding | Verdict | Sev. | Fixed |
|---|---|---|---|---|
| EX-1 | **1.18.0 can't be released as it stands:** `tests/experimental.test.js` fails at 1.18.0 for all seven entries, and at `1.18.0-rc.1`. Every pack using them declares `~1.16.0` or `~1.17.0`, so 1.18.0 skips them all, even where an API becomes stable unchanged. | Bug | Medium | #406, `d20ac41f` to `b6e63356`: six made stable after the fixes below; requirement-level laws kept experimental until 1.20.0, pack `uses` until 1.19.0. Decided 2026-11-19 |
| EX-2 | **`deriveStandard` drops a base requirement's tests and rule rows** when membership is given only on the test side (`tests[t].requirements`, which the format allows): `tests: undefined`, `ruleMap: {}`, no error. `surea11y-pack new --kind derived` then writes a pack whose own generated test fails. | Bug | Medium | #406, `385d8fd4` |
| EX-3 | **Translations by id drop every test's texts** where the requirement doesn't list `tests`: `reqsOf(t)` checked `tests[t].requirements.includes(t)`, the test's own id. French coverage of a sample went from 4 of 11 to 0. | Bug | Medium | #406, `1278aa87` |
| EX-4 | **Tests under requirements accept what they can't read:** `asks`, `outsideCorrespondence` and `wcagCorrespondence` on a one-level standard were accepted and did nothing, and could hide a failure; duplicate rollup ids were refused only at scan time, skipping the whole pack. *(not re-run)* | Bug | Medium | #406, `eb39c57e`, `0115673c` |
| EX-5 | **Standard data's checker and schema disagree both ways**, and the checker didn't check rule-map rows; the typings lacked `laws`, top-level `texts`, a version's `notes`, `review` and `texts`, and a profile's `law`. | Bug | Medium | #406, `b83bc398`: the checker decides, a test holds the schema to it; full types |
| EX-6 | **Laws:** `laws` on a requirement hid it from `listProcedures({ profile })`, but the scan still judged and failed it under that profile; a profile with no law dropped every requirement a law restricts; a `profile` given as an array or a number returned full WCAG; in a scan of several profiles, `engine.law` was the first profile's. | Bug | Medium | #406, `7caae7de`, `b6e63356`: the scan honours requirement laws (`engine.profileExcludes.requirements`) |
| EX-7 | **`standard.review` dictionary keys have no version**, so they translate a standard's second version with the first one's steps. *(not re-run)* | Bug | Low | #406, `d20ac41f`: they translate only versions whose steps match; made stable with `skip-link`'s `details.lean` (proposed for removal; kept, decided 2026-11-19, as a pack uses both) |
| EX-8 | **`deriveStandard` crashes or misreads on odd input:** `basedOn: 'toString'` crashes and `'__proto__'` resolves to `Object.prototype`; the rule-map sort used the machine's locale (`localeCompare` with no locale), so output differed between `en_US`, `da_DK` and `cs_CZ`; two derived requirements on one base requirement were refused only by `definePack`. | Bug | Low | #406, `385d8fd4` |
| EX-9 | **A partial `basedOn` (no `version`) passes the check**, then derivation says "based on base undefined". *(not re-run)* | Bug | Low | #406, `385d8fd4`: a clear message |
| EX-10 | **Translation keys can collide:** the dot-joined grammar reads `a` + `b.facets.c` and `a.facets.b` + `c` alike. *(not re-run)* | Debatable | Low | #406, `0115673c`: a clash is reported (`keyClashes`) |
| EX-11 | **`definePack` is quadratic in tests:** 5.9 s at 3,000 requirements of 3 tests. RGAA-sized standards are unaffected. | Bug (speed) | Low | #406, `0115673c`: 83 ms |
| EX-12 | **`definePack`'s message for an id with non-ASCII characters is wrong**: "must start with base-" when it does. *(not re-run)* | Bug | Low | #406, `0115673c` |
| EX-13 | **`checkPack` accepts `~1.17.0 \|\| ^2.0.0`** for a pack using an experimental API, though the next major may change it. | Bug | Low | #406, `0115673c` |
| EX-14 | **The experimental policy test itself** had to change when entries became stable, and `describePacks` no longer lists them. | Note | Low | #406, `d20ac41f`; `pack-rgaa`'s test of what it uses needs updating when it moves to 1.18 |

### Other engines

| # | Finding | Verdict | Sev. | Fixed |
|---|---|---|---|---|
| CE-1 | **A bold first line ended by `<br>` over text in the same paragraph** (`<p><strong>Title</strong><br>text</p>`), very common in CMS content, is a title engine B asks about and `p-as-heading` missed. | Gap | Low | [#407](https://github.com/SureA11y/core/pull/407), `81d8875b`: `BOLD_LEAD_LINE` |
| CE-2 | **A bold `<div>` at body size over body text**, which engine B asks about, was left out at body size. | Gap | Low | #407, `81d8875b`: `BOLD_SHORT_DIV`, over a passage below it only |
| CE-3 | **`p-as-heading` compared only the next element;** Engine A compares the previous one too. Same cause as CG-5. | Gap | Low | #406, `3558ca2a` |
| CE-4 | **A cheap 1.4.4 check for text clipped at 640px wide**, as ACT rule 59br37 and engine C's a rule of its own do (a rule of its own passed a case the engine rightly flags). | Feature | — | **Open** (§2 of the register) |
| CE-5 | **"The page starts with an `<h1>`"** as a best practice, as engine C's rule does. | Feature | — | **Open** |
| CE-6 | **A lean for a 2 by 2 table with no `<th>`**, which engine B fails. | Feature | — | **Open** |

### Speed and memory

| # | Finding | Verdict | Sev. | Fixed |
|---|---|---|---|---|
| PF-1 | **Scans in a synchronous loop under jsdom run out of memory:** about 80 MB stays per scan of a 75 KB page, until Node stops. The 1.17.0 core does the same. The cause is jsdom's: a new `JSDOM` queues its `DOMContentLoaded` and `load` work as promise jobs that hold the document and window until the code yields; `window.close()` doesn't release them. In a loop, 30 closed windows were all alive; after one yield, one was. Core keeps nothing: with a yield between scans, 20 scans stay at about 210 MB ([`perf/jsdom-refs.js`](./2026-11-probes-6/perf/jsdom-refs.js), [`jsdom-plain.js`](./2026-11-probes-6/perf/jsdom-plain.js), [`jsdom-yield.js`](./2026-11-probes-6/perf/jsdom-yield.js)). | Not a bug (core) | Low | #407, `94bcd3b3`: documented in LIMITATIONS.md and ENGINE_OPTIONS.md |

---

## 2. Decisions taken

All on 2026-11-19, while fixing:
- **Excluded areas are context** for rules that judge the whole page: no findings in them, and their content still read (CG-4). The other choice, leaving their content out of the page, was rejected because it invents findings readers never meet.
- **Every experimental API due at 1.18.0 is made stable after its fixes** (EX-1 to EX-9), including `skip-link`'s `details.lean` and the `standard.review` keys, first proposed for removal: `pack-rgaa` uses both, and both were fixed rather than removed.
- **Requirement-level laws stay experimental until 1.20.0**, made to work (the scan honours them, EX-6) rather than frozen while no pack uses them.
- **Invalid `aria-level` values follow WAI-ARIA's default** (the tag's level), where Chromium exposes 1 (CG-12).

## 3. What the fixes found

Fixing the round turned up three more problems, each fixed in the same pull request before it merged:
- **A module the packaged files require was missing from `package.json`'s `files`** (`src/law-applies.js`, added by EX-6's fix), which would have broken every install. A test now fails on any such module (`tests/package-files.test.js`, #406).
- **docs/I18N.md's coverage table** counted 1,776 keys after two were added; and a right-to-left reflow test depended on the width of the Arabic font installed: with CI's narrower one, its sentence lay wholly past the edge, which the rule rightly leaves alone (#406, `e96ec43f`; [`reflow/fixes/rtl-font-width.js`](./2026-11-probes-6/reflow/fixes/rtl-font-width.js)).
- **`tests/role-tokens.test.js` rewrote `role="x"` inside a fixture's visible text**, changing what a reader sees; it now rewrites attributes only (#407, `c1bb82de`).

## 4. Effect on the published packages

All 12 published packages that depend on core (`binding-base`, `cli`, `test-matchers`, the five browser bindings, `pack-rgaa`, `pack-raweb`, `pack-en301549`, `pack-wai-aria`) were run against core before the fixes, after #406 and after #407, and compared test by test ([`family/`](./2026-11-probes-6/family/)). The one difference: `pack-rgaa`'s test of the experimental APIs it uses, as it uses none any more (EX-14). `pack-rgaa`, `pack-raweb` and `pack-en301549` declare `~1.17.0`, so each needs a release to accept 1.18.0.
