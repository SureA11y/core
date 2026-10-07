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

Sorted by severity, then by how many pages it touches. Every Medium finding is fixed, and the feature requests (section 2) are in pull request #146. The Low findings are in progress.

| # | Finding | Verdict | Severity | Found in |
|---|---|---|---|---|
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
| O-5b | A help page per rule for the 27 rules mapped to no WCAG criterion (`region`, `landmark-one-main`, `heading-order`, …), which have no help link: needs a decision on where the pages live (surea11y.dev?) and who keeps them up | Round 1 (the rest of O-5 / P14) |
| C-13 | Custom rules joining WCAG composites by mapping; custom composites | Round 1 |
| C-20 | Profiles without forking core (`profile-kit` export or a runtime option); profiles/README.md:67 also contradicts the scaffold's test imports | Round 1 |
| O-12 | A compact output mode (an empty page's result is 200 KB) | Round 1 |
| §7-9 | A `strictOptions` mode that throws on unknown or mistyped options | Round 1 |

---

## 3. Fixed — history

### Fixed, not yet in `main`

**Features.** Branch `feat/audit-2026-10-features` (from `main` at `819e5c9`), pull request [#146](https://github.com/SureA11y/core/pull/146). O-12 and §7-9 were left out for a decision, with C-13, C-20 and O-5b.

<a id="c-15"></a>
<a id="c-16"></a>
<a id="o-10"></a>
<a id="o-5"></a>
<a id="p4"></a>
| # | Finding | Decision | Commit | Issue | Done |
|---|---|---|---|---|---|
| C-15 (feature) | Catalog APIs that see `customRules` | Recommended, taken directly: the scan's custom rule handling is one shared function, `resolveCustomRules`; with `customRules` in `engineOptions`, `getChecksCatalog`, `getCheckDefById` and `getChecksForRunOnly` list the rules a scan with the same options has, an override in its built-in's place. | `fd8ff88`, changelog `96a4e6d` | [#141](https://github.com/SureA11y/core/issues/141) | 2026-10-07 |
| C-16 (feature) | A custom rule's `helpUrl` and custom tags in the outputs | Recommended, taken directly: every check result's `meta` carries `helpUrl` and `tags`; SARIF `helpUri` and the rule's own tags (less bookkeeping and criterion tags), a JUnit `help:` line, an HTML "How to fix <rule>" link; only absolute `http(s)` links are ever linked. Also what O-5's help links will flow through. | `f349007`, changelog `41320b2` | [#142](https://github.com/SureA11y/core/issues/142) | 2026-10-07 |
| O-10 (feature) | Type declarations for the subpaths | Recommended, taken directly: a declaration file per entry point on the main entry's result types (the browser bundle as an `export =` namespace, as `module.exports` is at run time); `types` conditions, `typesVersions` for `node10`, and the files published. | `68b8413`, changelog `4374a5a` | [#143](https://github.com/SureA11y/core/issues/143) | 2026-10-07 |
| O-5 / P14 (feature, first part) | Help links per rule and per criterion; SARIF `helpUri` | Recommended first step, taken directly: W3C's id for every criterion (from the Recommendation's source), `url` and `understandingUrl` on every WCAG 2.1/2.2 mapping, and the reporters' help link falling back to the criterion's Understanding document; 107 of 134 rules now have one. Per-rule pages for the 27 rules mapped to no criterion stay open (O-5b): they need a decision on where they are hosted. | `14b0d2c`, changelog `43c4122` | [#144](https://github.com/SureA11y/core/issues/144) | 2026-10-07 |
| P4 (feature) | JUnit, SARIF and the HTML report reading a cross-frame result; `flattenCrossFrameResult` exported | Recommended, taken directly: every reporter and the baseline functions take the tree as it is. A frame is named by its path (the selectors of the frame elements leading to it); its findings are located in its document, and the path is part of their identity (SARIF fingerprints, baseline entries' `frame`). A frame that did not answer is reported as not scanned (a SARIF warning notification, a skipped JUnit testcase, a report section). `flattenCrossFrameResult` is exported from the root, typed and supported. | `efb83b9`, changelog `5b82da3` | [#145](https://github.com/SureA11y/core/issues/145) | 2026-10-07 |

How C-15 was checked: with a best-practice custom rule, an override of `img-alt-present`, an invalid descriptor and one with a composite's id, `getChecksForRunOnly` was compared with the rules a scan runs under seven selections (none, a rule id, tags, a WCAG target, a profile, a profile with `bestPractices`, an exclude), in jsdom and against a scan in Chromium: identical every time. Before, the custom rules were missing and `getCheckDefById` gave the overridden built-in. Without `customRules` the catalog is unchanged. The tests fail before the change. The 136 fixtures give the same results in Chromium and jsdom. The full suite passes (the same one environmental failure).

How C-16 was checked: custom rules with an `https` help link and their own tags, and one with a `javascript:` link, through the result and each reporter, from jsdom and from a scan in Chromium. After: the result carries both; SARIF has `helpUri` and the custom tags for the first and no `helpUri` for the second; JUnit has a `help:` line; the HTML report links "How to fix acme-rule" and has no `javascript:` href. Built-in rules' SARIF tags gain their own tags (`wcag2a`, `images`, `best-practice`), never `a11ycore`, `atomic` or `wcag111`; one SARIF test now includes them. Results grow by about 7% (203 to 218 KB on a small page). The new tests fail before the change. The 136 fixtures give the same results in Chromium and jsdom. The full suite passes (the same one environmental failure).

How O-10 was checked: a `strict` TypeScript project, with the package linked into its `node_modules`, importing every subpath and calling each function with real options, compiled under `node10`, `node16` and `bundler` resolution, with two expected errors (`cantTellAs: 'warning'`, WCAG `'3.0'`). Before, each subpath import failed; after, all three compile. `npm pack` includes the nine declaration files. Types are a compile-time check, so there is no browser test; #139's Chromium test covers the browser bundle's import at run time. The full suite passes (the same one environmental failure).

How O-5 / P14 was checked: the ids were read from the file names of the criteria in W3C's source of WCAG 2.2 (github.com/w3c/wcag `guidelines/sc`, 87 files, matched to our table by heading), and 2.1's 2.5.5 from the source branch of 2.1, whose Recommendation includes `sc/21/target-size.html`. They agree with Engine B's own table on all 86 criteria it lists for 2.2 and on the 78 of 2.1. After: every one of the 116 WCAG mappings of the built-in rules links its criterion and Understanding document (duplicate-id's 4.1.1 to the 2.1 pages), a versionless mapping gets none, and SARIF, JUnit and the HTML report give the Understanding document as the help link of a rule with none of its own, in jsdom and from a scan in Chromium. The new tests fail before. The 136 fixtures give the same results in Chromium and jsdom. The full suite passes (the same one environmental failure).

How P4 was checked: before, all four reporters and the baseline functions threw a `TypeError` for a cross-frame result. After, a real `runa11yCoreAcrossFrames` scan in Chromium of a page with the same broken image in the page, two frames that answer (one nesting a third) and an ad frame without a responder: SARIF has four results with four distinct fingerprints, each with its frame's path, and a warning notification for the ad frame; JUnit has the frames' suites under their paths and a skipped suite for the ad frame; the HTML report has a section per frame; a baseline written from the result matches it in full, and a baseline of the page alone reports the three frames' copies as new. A plain scan result renders as before (the existing reporter tests are unchanged). Reporter timing is unchanged. The 136 fixtures give the same results in Chromium and jsdom. The full suite passes (the same one environmental failure).

**Low findings.** Branch `fix/audit-2026-10-low`, cut from the features branch so that it lands on `main` after #146, pushed as each fix is verified, no pull request yet. The debatable ones (VS-13, RB-8, the `x-foo` half of ST-6, O-6, O-14, R-15) are left for a decision.

<!-- low-table -->
<a id="st-9"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| ST-9 | valid-lang called `qaa` "not a syntactically valid" tag | Recommended, taken directly: a well-formed primary subtag (2 to 8 letters) that names no language gets its own message, "is well formed, but "qaa" names no known language (it is not in the IANA Language Subtag Registry, or is reserved for private use)", in every locale; a malformed value keeps the old one. Outcome and reason code unchanged, so finding identity is too. | `3f81ae3`, changelog `f7a0ee5` | [#147](https://github.com/SureA11y/core/issues/147) | 2026-10-07 |
<!-- /low-table -->

<!-- low-how -->
How ST-9 was checked: `lang="qaa"`, `lang="eng-GB"` and `lang="en_US"` in jsdom (every locale) and in Chromium. Before, all three said "not a syntactically valid language tag". After, the first two say they name no known language, `en_US` keeps the old message, and all three still fail with `ELEMENT_LANG_INVALID`. The new tests fail before. The 136 fixtures give the same results in Chromium and jsdom. The full suite passes (the same one environmental failure).


### Fixed after the second audit, eighth batch (in `main`)

Merged into `main` with pull request [#140](https://github.com/SureA11y/core/pull/140), 2026-10-07, which closed their issues. Commits are as they are in `main`. Every Medium finding was then fixed.

<a id="op-2"></a>
<a id="op-3"></a>
<a id="op-5"></a>
<a id="o-13"></a>
<a id="c-9"></a>
<a id="rp-3"></a>
<a id="rp-4"></a>
<a id="rp-6"></a>
<a id="rp-5"></a>
<a id="c-14"></a>
<a id="o-8"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| OP-2 | Contrast rules ignore `excludeSelectors` on a shadow host | Taken without a separate decision round (the user asked for the recommended option on the Medium findings): `isExcluded` walks shadow-including ancestors (DOM), going on from a shadow root to its host, so an excluded host's whole shadow tree is excluded for every rule, global and rule-scoped. | `13b9944`, changelog `a2c3797` | [#129](https://github.com/SureA11y/core/issues/129) | 2026-10-07 |
| OP-3 | `region` ignores `excludeSelectors` | Recommended option, taken directly: an excluded element (global or rule-scoped) is left out as content outside the accessibility tree is: no content, and a reported gap stops at it, so it never takes excluded content in. | `361c3c8`, changelog `3ea3a9f` | [#130](https://github.com/SureA11y/core/issues/130) | 2026-10-07 |
| OP-5 | Cross-frame scans enter iframes in excluded subtrees | Recommended option, taken directly: a frame matching an exclude selector, or inside an element that does, is left out of `frames` with its whole document, as a hidden frame already is. | `92cb89e`, changelog `3b56c05` | [#131](https://github.com/SureA11y/core/issues/131) | 2026-10-07 |
| O-13 | Cross-frame entries don't identify their iframe | Recommended option, taken directly (same code as OP-5): each entry names its frame element with `selector` (its id when unique, else its path by type) and `title` (its title attribute, or null), added fields; a frame still at `about:blank` with a `src` is reported with its `src`. | `7c58803`, changelog `647ecd7` | [#132](https://github.com/SureA11y/core/issues/132) | 2026-10-07 |
| C-9 | A `fail` with no occurrences: accepted by the engine, then shown as a pass by JUnit, SARIF and baselines (also RP-2) | Recommended option, taken directly: fixed in the engine, which closes it for every reporter at once: a `fail` that names no element gets one occurrence on the document element (`html`, its start tag, reason code `FAIL_WITHOUT_OCCURRENCE`, a message in every locale). It also makes a thrown rule's documented signature (`cantTell`, no occurrences, `error`) exact, which RP-3 builds on. | `2a98669`, changelog `d05dc32` | [#133](https://github.com/SureA11y/core/issues/133) | 2026-10-07 |
| RP-3 | A rule that threw is invisible in SARIF, JUnit and the HTML report | Recommended option, taken directly: one shared test in the reporters (`ruleErrorOf`: `cantTell`, no occurrences, an `error`, the documented shape of a thrown rule, made exact by C-9); JUnit `<error type="ruleError">` counted in `errors`, SARIF an `error`-level tool execution notification, the HTML report a card saying the rule did not complete, in every locale. | `6a3f008`, changelog `1f4f428` | [#134](https://github.com/SureA11y/core/issues/134) | 2026-10-07 |
| RP-4 | JUnit takes a criterion's outcome from its first composite only | Recommended option, taken directly: `criterionOutcome` is the worst outcome of all the criterion's composites (a criterion is met only when all of it is), and a criterion checked in parts is titled by the name their titles share; one composite keeps its title. | `b4197b2`, changelog `0874961` | [#135](https://github.com/SureA11y/core/issues/135) | 2026-10-07 |
| RP-6 | EARL: input order can erase a failure | Recommended option, taken directly: assertions on the same rule for one URL merge to the worse outcome (failed, cantTell, passed, inapplicable), ties broken by the assertions alone, so the output is byte-identical in any order; EARL.md drops "the last one wins" and notes that URL-less results are still told apart by position. | `97be36d`, changelog `1f20c4c` | [#136](https://github.com/SureA11y/core/issues/136) | 2026-10-07 |
| RP-5 | The HTML report fails contrast itself | Recommended option, taken directly: pass and fail colors darkened to meet 4.5:1 on their tints and on white (`#0b7d0b`, `#b0441f`); chips and tiles keep light surfaces with dark text in dark mode; dark-mode heading and placeholder colors; the report is checked with the engine's own contrast rules in both modes. | `38e70a0`, changelog `8cd4461` | [#137](https://github.com/SureA11y/core/issues/137) | 2026-10-07 |
| C-14 | Under a profile, an untagged custom rule never runs, and an untagged override removes a built-in | Recommended option, taken directly (beyond documenting it): an override runs wherever its built-in would have, whatever its tags; a custom rule the selection leaves out is listed in `skippedCustomRules` with one warning, whose reason says how to select it without dropping the profile (its criteria's tags, or `runOnly.bestPractices`). | `dfa21d6`, changelog `c0f053d` | [#138](https://github.com/SureA11y/core/issues/138) | 2026-10-07 |
| O-8 | The `/browser` subpath is empty for bundlers, though documented for them | Recommended option, taken directly (beyond the doc fix): the bundle also sets its API as `module.exports` when a module system is present (UMD), behind a `typeof` guard, and keeps the global for `<script>` tags and the locale side files; README and API_STABILITY show the import. | `8f4a8a8`, changelog `819e5c9` | [#139](https://github.com/SureA11y/core/issues/139) | 2026-10-07 |

How OP-2 was checked: low-contrast text, a nameless button and an image without alt in Chromium, in the shadow root of `#widget`, two shadow roots deep, and in a host inside an excluded `<section id="widget">`, with `excludeSelectors: ['#widget']` and with the same exclude rule-scoped. Before, contrast-minimum and contrast-enhanced failed on the text in all three shapes while button-name-present and img-alt-present were excluded; after, every rule leaves it out, as Engine A's `exclude` does. Text slotted from an excluded host's light DOM was already excluded. jsdom tests of `isExcluded` and of the contrast rules and a Chromium test fail before the fix. The 136 fixtures give the same results in Chromium and jsdom. The full suite passes (the same one environmental failure).

How OP-3 was checked: five page shapes in Chromium, global and rule-scoped: an excluded banner (before: cantTell on the banner; after: pass), the banner beside stray text (after: the stray text only), stray paragraphs around an excluded banner (after: the two paragraphs, not their wrapper; Engine A reports the wrapper, banner included), a wrapper whose only content is excluded by `.ad span` (after: pass; Engine A reports the wrapper), and nothing excluded (unchanged). A jsdom test and a Chromium test fail before the fix. The 136 fixtures give the same results in Chromium and jsdom. The full suite passes (the same one environmental failure).

How OP-5 was checked: a page in Chromium with an ad frame in `<div id="ads">`, two other frames that answer and one that never loads. Before, `excludeSelectors: ['#ads']` and `['iframe[title=ad]']` both still returned the ad frame's scan; after, it is left out and the others are unchanged, as with Engine A's `exclude`. A jsdom orchestration test (the excluded frame is never contacted, with the array and the string form) and a Chromium test (frames that answer, an unparseable selector excluding nothing) fail before the fix. The 136 fixtures give the same results in Chromium and jsdom. The full suite passes (the same one environmental failure), after the orchestration test was given the module's new free variable.

How O-13 was checked: a page in Chromium with three frames of one URL (one in `#ads`, one with an id, one with neither) and one whose server never answers. Before, the entries were three identical `{ url }` and one `about:blank`; after, each has a selector that matches exactly its own element (`#ads > iframe`, `#player`, `html > body > main > iframe:nth-of-type(2)`), its title or null, and the never-loading frame reports its `src`. A jsdom orchestration test (duplicate ids fall back to the path) and a Chromium test fail before the fix; the type test compiles against the new fields. The 136 fixtures give the same results in Chromium (`safe-dom.js` now lists `src`). The full suite passes (the same one environmental failure).

How C-9 was checked: a custom rule returning `fail` with `[]`, through the engine and every reporter. Before: JUnit `failures="0"` with a bare testcase, no SARIF result, no baseline entry, an HTML headline counting a failure with no card. After: one occurrence on `<html>` (`<html lang="en">`), a JUnit failure, a SARIF `error` result, a baseline entry keyed on the start tag, and an HTML card; occurrences of `undefined`, `null` or a string are handled the same way, a `fail` that names its element is unchanged, a manual rule's becomes a `cantTell` on the document element, and the message follows the locale. jsdom tests and a Chromium test fail before the fix. The 136 fixtures give the same results in Chromium and jsdom (no built-in rule fails without naming an element). The full suite passes (the same one environmental failure).

How RP-3 was checked: custom rules that throw and that return a Promise, beside one returning a `cantTell` that names an element, through JUnit, SARIF and the HTML report, from jsdom and from a scan in Chromium. Before: a "Needs manual review" skip with `errors="0"`, no SARIF result or notification, nothing in the HTML. After: two JUnit `<error>`s with `errors="2"` while the named `cantTell` stays a skip, two SARIF error notifications naming the rules and no result for them, and an HTML card with the error in the report's locale. jsdom tests and a Chromium test fail before the fix. The 136 fixtures give the same results in Chromium and jsdom. The full suite passes (the same one environmental failure).

How RP-4 was checked: `<button aria-pressed="banana">OK</button>` (4.1.2's name passes, its ARIA validity fails), scanned in jsdom and in Chromium. Before: `WCAG 4.1.2 Name, role, value: accessible name`, `criterionOutcome` `pass`, `failures="1"`. After: `WCAG 4.1.2 Name, role, value`, `criterionOutcome` `fail`, the same XML with the composites in either order, and single-composite suites unchanged (`WCAG 1.4.3 Contrast: minimum`). 4.1.2 is the only criterion with several composites today. The jsdom test fails before the fix. The full suite passes (the same one environmental failure).

How RP-6 was checked: failing, passing and inapplicable scans of one URL merged in every order. Before: `[failing, passing]` gave `earl:passed` and `[passing, inapplicable]` `earl:inapplicable`, and the three orders gave different output. After: `earl:failed` and `earl:passed`, and byte-identical output for every order; the same in Chromium for one page scanned before and after it gives its image an alt. The jsdom test fails before the fix. The full suite passes (the same one environmental failure).

How RP-5 was checked: reports of four fixture scans rendered in Chromium in light and dark mode, every `<details>` opened, scanned with contrast-minimum and with Engine A's color-contrast. Before: 23 failures in light mode (the pass chip at 3.02:1, the fail chip at 4.1:1) and 30 in dark mode (also the headings at 2.38:1 and 2.13:1, and the search placeholder, which only our engine measures); Engine A agreed on every chip and heading. After: no failure from either engine in either mode, on all four reports. A jsdom test of every inline color pair and a Chromium test of the rendered report in both modes fail before the fix. The full suite passes (the same one environmental failure).

How C-14 was checked: a best-practice custom rule, a WCAG-tagged one and an override of `img-alt-present` tagged `images`, under `profile: 'wcag22-aa'`, a WCAG 2.2 AA target, `tags: ['wcag2a']` and no selection. Before: under each selection the best-practice rule and the override did not run, the built-in went with the override, and `skippedCustomRules` was empty. After: the override runs (its own outcome, not the built-in's), the best-practice rule is listed with its reason and one warning, `runOnly.bestPractices` runs it while the profile still applies, and with no selection everything runs and nothing is listed. The 1.1.1 composite is `cantTell` with or without the override on that page (alt quality needs review). jsdom tests and a Chromium test fail before the fix. The 136 fixtures give the same results in Chromium and jsdom. The full suite passes (the same one environmental failure).

How O-8 was checked: an app importing `@surea11y/core/browser` by default, named and namespace import and `require()`, bundled with esbuild as IIFE and as ESM and run in Chromium. Before: `{}`, `undefined`, `{ default: {} }` and `{}`, with only `window.a11ycore` working. After: every form gets the API and a scan through it runs, and the global is still there. A Node test requiring the bundle and the Chromium test fail before the fix; the bundle shape tests now allow `module.exports` only behind its guard, and the `<script>` tests still pass. The 136 fixtures give the same results in Chromium and jsdom. The full suite passes (the same one environmental failure).

### Fixed after the second audit, seventh batch (in `main`)

Merged into `main` with pull request [#128](https://github.com/SureA11y/core/pull/128), 2026-10-07, which closed their issues. Commits are as they are in `main`. The pull request also carried the npm pin of the release workflow (`665da6d`).

<a id="rb-3"></a>
<a id="r-18"></a>
<a id="s-6"></a>
<a id="op-1"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| RB-3 | image-redundant-alt is quadratic | Option A: the text beside a parent's images is read once per parent, every `<img>` left out of it (an `<img>` holds no text, so it is the same for each image), and each image's alt is compared with it. Same outcomes, linear time. | `70b2f4c`, changelog `8cd274d` | [#124](https://github.com/SureA11y/core/issues/124) | 2026-10-07 |
| R-18 | jsdom scans of CSS-heavy pages are very slow | Option A: a color holding `var()` is unparseable without the probe element the parser adds to the page, which emptied jsdom's whole style cache and could not resolve `var()` either. Same outcomes; the rest of jsdom's cost on large stylesheets is noted in LIMITATIONS. | `fcbe366`, changelog `fc32b4c` | [#125](https://github.com/SureA11y/core/issues/125) | 2026-10-07 |
| S-6 | Wrong option types, including a non-string `contextSelector`, are accepted silently (also OP-4) | Option A: a `contextSelector` that isn't a selector, an array of selectors or `null` throws `INVALID_CONTEXT_SELECTOR` naming what was passed (an array item that isn't a string too), and an `{ include, exclude }` object is pointed to `excludeSelectors`; an engineOptions `wcagVersion`, `profile`, `timestamp` or a `pageUrl` of the wrong type is ignored with a `console.warn` saying what the run uses instead, as an unknown profile already was; the `optInRules` warning no longer lists an empty set. | `595929a`, changelog `98cd4f0` | [#126](https://github.com/SureA11y/core/issues/126) | 2026-10-07 |
| OP-1 | A comma inside `:not(…)` splits an `excludeSelectors` string | Option A (after weighing the requirements: CSS selector-list syntax, a string meaning the same as its array, an exclude that degrades per selector): a string is cut only at top-level commas, outside parentheses, brackets and quoted strings and not after a backslash; each selector still applies on its own, an invalid one excluding nothing with a warning. Global and rule-scoped excludes alike. | `3e19e05`, changelog `c713895` | [#127](https://github.com/SureA11y/core/issues/127) | 2026-10-07 |

How RB-3 was checked: the finding's pages in Chromium, this rule alone, before and after: 1,000, 2,000, 4,000 and 8,000 images in one `<div>` (0.77, 2.78, 9.01 and 33.3 s, now 0.06, 0.07, 0.08 and 0.15 s), and 100 and 400 images beside a `<main>` holding 1.4 MB of text (2.95 and 7.47 s, now 0.24 and 0.69 s). Outcomes and occurrence counts are the same on eight shapes (an icon link, two duplicate icons, a different alt, an `aria-hidden` and a visible label, mixed images and text, a matching gallery, a `hidden` sibling) and on the 136 fixtures in Chromium. A Chromium test and a jsdom test count the reads of a sibling's text: twice for 500 images, against 500 before. The full suite passes (the same one environmental failure).

How R-18 was checked: the frozen Daily Mail page (7,916 elements, 2,683 CSS rules) in jsdom, with jsdom's style-cache clears counted and `getComputedStyle` timed per rule. Before, the color probe emptied the cache twice in each contrast rule, all for `var()` values, which jsdom leaves unsubstituted and the probe returned unparsed; contrast-computable took 121 s, aria-hidden-focus (run after it) 109 s, contrast-minimum 133 s, and the full scan 456 s. After, no clears: 2.7 s, 0.7 s, 2.5 s and 243 s, of which about 224 s is jsdom's first computation of 5,735 elements (jsdom's own cost, upstream). Spiegel's contrast-minimum, which probed four `var()` values, went from 34.2 to 23.2 s; Falabella, Al Jazeera and Times of India probed none. In Chromium a computed color is always resolved, and an element given a `var()` color returns its value already substituted, so the probe never sees one there. Outcomes are the same on the 136 fixtures in Chromium and in jsdom (22,848 rule results each). Two jsdom tests fail without the fix (a `var()` value parses as null without touching the document; a scan of a page with a `var()` background adds nothing to it), and a Chromium test checks that colors set with custom properties are measured and the scan adds nothing to the document. The full suite passes (the same one environmental failure).

How S-6 was checked: every value from the finding in Chromium, on a page with an image without alt in `<main>` and one in `<footer>` (img-alt-present), before and after. An element, a NodeList, `{ include, exclude }`, `{ include }`, `5`, `true`, `[5]`, `['main', 5]`, `[element]` and `[['#main']]` scanned the whole page (or, for `['main', 5]`, dropped the 5); each now throws `INVALID_CONTEXT_SELECTOR` with a message naming the value, which is what crosses `page.evaluate`, and `runa11yCoreAcrossFrames` rejects with it. `'main'`, `['main']`, `null`, `''` and `[]` scope as before. `wcagVersion: 2.1` and `'3.0'`, `profile: 5`, a `Date` or numeric `timestamp` and a `pageUrl` of `{}` or `5` each now log one warning, and `result.url` is the document's. The 136 fixtures give the same results before and after, in Chromium and in jsdom (22,848 rule results each), and take the same time in jsdom (26 to 27.5 s for both). New jsdom tests cover each case in both entry points and fail before the fix; a Chromium test covers the errors, the cross-frame rejection and the `wcagVersion` warning. The full suite passes (the same one environmental failure).

How OP-1 was checked: the oracle is Chromium's `matches()` for the same string. On six images without alt (`.a`, `.b`, `.c`, `class="a,b"`, `data-x=","`, `.keep`), what img-alt-present leaves out for `'img:not(.a, .b)'`, `':is(.a, .b)'`, `':where(.a, .b)'`, `'img:not(.a, .b), .c'`, `'[data-x=","]'`, `'[data-x=","], .c'`, `'.a\,b'` and `'.a, .b'` differed from it in seven of the eight before and matches it in all after, with no warning, globally and for the rule alone; Engine A's `exclude` matches it too. `'.a, #bad['` still excludes `.a` and warns about `#bad[` (a string with an unclosed bracket keeps the rest of the string in that selector, as CSS tokenizes it). Unit tests of the split (quotes inside the other kind, escaped quotes and commas, `:nth-child(… of …)`), a jsdom scan test and a Chromium test fail before the fix. The 136 fixtures give the same results (none sets `excludeSelectors`). The full suite passes (the same one environmental failure). GitHub returned errors on the first attempts to open the issue; one issue was created.

### Fixed after the second audit, sixth batch (in `main`)

Merged into `main` with pull request [#122](https://github.com/SureA11y/core/pull/122), 2026-10-07, which closed their issues. Commits are as they are in `main`. Pull request [#123](https://github.com/SureA11y/core/pull/123) followed, outside this audit: `runOnly.bestPractices` adds to a conformance profile instead of overriding it.

<a id="nm-7"></a>
<a id="st-1"></a>
<a id="st-2"></a>
<a id="st-3"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| NM-7 | An SVG `<title>` counts only as the first child | Option A: an SVG element's first direct child `<title>` and first direct child `<desc>` count wherever they are among its children, as SVG-AAM reads them ("a direct child title element", "a direct child desc element"), through a new shared `helpers.getSvgChildText(el, tag)`, in all four rules that read them (svg-text-alternative-present, role-img-text-alternative-present, svg-image-text-alternative-present, img-alt-decorative). The first one counts, so an empty first `<title>` still names nothing; a `<title>` in a group is not a direct child; a `<desc>` alone still names nothing. | `1351c67`, changelog `6cb82f6` | [#118](https://github.com/SureA11y/core/issues/118) | 2026-10-07 |
| ST-1 | Definition lists don't read the flat tree | Option A: both definition list rules read the flat tree, as the list rules do, through new shared helpers (`flatChildNodes`, `flatChildElements`, `flatParentElement`): a `<slot>` stands for the nodes assigned to it, or its fallback when none is, and an item its host does not slot is left out. A custom element between a `<dl>` and its items is still an invalid child, as for lists. The list rules now read through the same helpers; with them, white-space text a host slots in keeps a slot's fallback from rendering, as in Chromium. | `bf4c597`, changelog `131a827` | [#119](https://github.com/SureA11y/core/issues/119) | 2026-10-07 |
| ST-2 | td-has-header misreads `rowspan="0"` | Option A (taken on "continue" after the recommendation): a `rowspan` that parses to 0 is a span, as HTML's table algorithm makes it (the cell grows to the end of its row group), so the table is left out like any other with spans. `colspan="0"` (read as 1) and a negative `rowspan` are still no span. Checking spanned tables by building HTML's table grid is left for later. | `4447ef7`, changelog `c2ad3bb` | [#120](https://github.com/SureA11y/core/issues/120) | 2026-10-07 |
| ST-3 | iframe-focusable-content counts elements that can't take focus | Option A: whether an element is in the frame's tab order is decided in the frame's own document by HTML's rules (`:disabled` and `inert` rule it out; a `tabindex` that parses as an integer decides, an invalid one is ignored; links, form controls, frames, media with controls, an `<area>` of a used image map with `usemap` matched exactly, a `<details>`' first `<summary>` and editing hosts count), and the frame's own `tabindex` is read the same way. The rule's header, description and failure message are corrected in every locale: a negative `tabindex` on the frame takes its content out of the tab order, so the content cannot be reached (the rule said it remained reachable). | `3e4b826`, changelog `51ffd78` | [#121](https://github.com/SureA11y/core/issues/121) | 2026-10-07 |

How NM-7 was checked: fifteen cases in Chromium, each against the name and description its accessibility tree gives the element: a `<title>` first, after a shape, last after a group, after a `<desc>`; an empty `<title>` before a non-empty one (Chromium takes the first, so no name); a `<title>` inside a `<g>`; an empty `<title>` after a shape; a `graphics-symbol` group titled after its shape; SVG `<image>`s with a `<title>` or `<desc>` after `<metadata>` or after each other; a `<desc>` alone after a shape, with and without a role. `main` failed the five named or described by a later child (and flagged a role-less `<svg>` titled last as an unlabeled image); the branch agrees with Chromium's name and description on all fifteen. Engine A and Engine B agree with the branch on every case they apply to (they don't look at SVG `<image>` or role-less `<svg>`). A Chromium test of nine cases fails six on `main`; jsdom tests cover each rule. The two scenario fixtures marked a later `<title>` or `<desc>` as failing (svg-text case 21, svg-image cases 10 and 13); they now pass, and a case for an empty first `<title>` is added; on the 136 fixtures in Chromium these are the only changes. The full suite passes (the same one environmental failure); the rules run faster on a page of 3,000 SVGs (about 205 against 260 ms).

How ST-1 was checked: nine cases in Chromium, each against where the accessibility tree puts the `<dt>` (in a DescriptionList, outside one, or not exposed): a shadow `<dl><slot>`, with a named slot, `<dl><div><slot>`, a shadow `<div><slot>` with no list, items the host doesn't slot, `<dl><x-group>` whose shadow is `<slot>` or `<div><slot>`, a `<p>` slotted in beside the items, and a plain `<dl>`. `main` failed both rules on the three slotted lists and reported the unslotted items; the branch gets every case right by the flat tree, and agrees with Engine A on all nine (Engine B has no such rules). The `<dl><x-group>` cases still fail both rules, as `<ul><x-group>` fails the list rules, though Chromium's tree ignores the group: the custom element is a child of the list in the flat tree too. For the shared helper, Chromium showed that any assigned node, even white-space text, keeps a slot's fallback from rendering; the list rules read only assigned elements and now follow it. A Chromium test of six cases fails five on `main`; jsdom tests cover the definition list rules and the fallback edge. On the 136 fixtures in Chromium no result changed. The full suite passes (the same one environmental failure); the four rules' time on a page of 3,000 lists is within noise (about 129 ms either way).

How ST-2 was checked: nine cases in Chromium, with the rendered cells as the oracle (how many rows the `<th>` spans, and whether row 2's first cell sits right of it or under it): `rowspan` `"0"`, `" 0 "`, `"00"`, `"0x"` (all span the four rows), `"0"` in the first of two `<tbody>`s (spans its two rows), `"4"`, `"1"`, `"-1"` (no span), and `colspan="0"` (one column). `main` failed the five zero spans with 6 or 8 false failures; the branch leaves them out as it does `rowspan="4"`, and still checks the others. Engine A builds the table grid and passes the spanned tables; Engine B makes the same mistake as `main`. A Chromium test of five cases fails four on `main`; jsdom tests cover the spans. On the 136 fixtures in Chromium no result changed. The full suite passes (the same one environmental failure); no cost.

How ST-3 was checked: the oracle is Chromium's sequential focus navigation, read by tabbing through the same content in a frame without `tabindex` (with `tabindex="-1"`, Chromium skips the frame's content altogether, as ACT akn7bn says, which also showed the rule's message was the wrong way round). Fifteen cases: a button in a disabled fieldset, in its first legend, in an inert div; `tabindex` `""`, `"abc"`, `" 0 "`, `"0"`, and `"abc"` on a button; an `<area>` with and without an `<img>` using its map, and with the `usemap` in another case; `contenteditable` `""` and `"plaintext-only"`; a `<details>`' `<summary>`; an `<a>` without `href`. `main` got 8 wrong (5 false fails, 3 misses); the branch agrees with Chromium on all fifteen. Engine A doesn't apply to these frames; Engine B gets 7 wrong. A Chromium test of twelve cases fails eight on `main`; jsdom tests cover thirteen. One existing Chromium test relied on a closed `<details>` holding nothing focusable; its `<summary>` is in the tab order, so the test now takes the summary out of it to keep testing the hidden link. On the 136 fixtures in Chromium no result changed. The full suite passes (the same one environmental failure).

### Fixed after the second audit, fifth batch (in `main`)

Merged into `main` with pull request [#115](https://github.com/SureA11y/core/pull/115), 2026-10-07, which closed their issues. Commits are as they are in `main`. Pull request [#117](https://github.com/SureA11y/core/pull/117) followed, outside this audit: selection by WCAG target (`runOnly.wcag`, `runOnly.bestPractices`), and [#116](https://github.com/SureA11y/core/issues/116), `aria-hidden-focus` mapped to 4.1.2 only, found by its check of each rule's WCAG tags.

<a id="vs-9"></a>
<a id="nm-5"></a>
<a id="nm-6"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| VS-9 | `-webkit-text-fill-color` ignored | Option A: the contrast rules read the computed `-webkit-text-fill-color` wherever they read the text's color (the foreground, the check for text that isn't drawn, the background walk); a `currentcolor` fill computes to `color`, so the default case is unchanged, and where the fill isn't computed `color` is read. Text filled with a background (`background-clip: text`) stays not computable. | `588c958`, changelog `c798675` | [#112](https://github.com/SureA11y/core/issues/112) | 2026-10-07 |
| NM-5 | form-control-single-label counts labels HTML doesn't associate | Option A: the rule takes a control's labels from the shared `helpers.getAssociatedLabelElements`, as the name rules do, which follows HTML's labeled control (a wrapping label without `for` labels its first labelable descendant only; a `for` label the first element with that id in its own tree). A `for` value trimmed before matching (in that helper) is left to its own finding. | `a3a236c`, changelog `c4e7987` | [#113](https://github.com/SureA11y/core/issues/113) | 2026-10-07 |
| NM-6 | label-in-name adds a `<select>`'s options to its label | Option A: the contents of `<select>` and `<textarea>` elements are left out wherever the rule reads a visible label (a `<label>`, the control's own text, `aria-labelledby` targets); selects and textareas stay in scope, as Understanding 2.5.3 names them, so one named without its label still fails. | `900db34`, changelog `b261abb` | [#114](https://github.com/SureA11y/core/issues/114) | 2026-10-07 |

How VS-9 was checked: seven cases in Chromium, with the color painted read from the darkest pixel of the text: a black fill over `color:#eee` (black), a `#ccc` fill over `color:#000`, over `color:transparent`, and inherited from a parent (`#ccc`), the default fill (`#ccc`), a 50% black fill (127 grey) and gradient text. The branch gives the painted color's ratio on all of them (pass; 1.61:1 four times; 3.95:1) and keeps the gradient text not computable; `main` failed the black text at 1.16:1, passed two of the light fills, dropped the transparent one and measured the translucent one at 1.16:1. Engine A agrees with the branch on every case; Engine B makes the same mistakes as `main` on three of them (it reads `color` too) and passes the gradient text. A Chromium test of the seven fails five on `main`; a jsdom test covers the three main shapes (jsdom computes the property). On the 136 fixtures in Chromium, no result changed. The full suite passes (the same one environmental failure); no measurable cost.

How NM-5 was checked: twelve cases in Chromium against the control's `labels`: a second field in a wrapping label, a wrapping label with `for`, a duplicate id, a document `for` label and a field in a shadow root, a button first in the label, a wrapping label whose `for` matches nothing (one label each; `main` failed all six with 2), a hidden input first in the label, a wrapping plus a `for` label, two `for` labels and a duplicate inside a shadow root (two labels each; `main` passed the shadow-root one). The branch agrees with `labels` on ten; the other two are a `for` value with spaces (the trimming finding) and nested labels, invalid HTML, which the helper reads as one. Engine A returns `cantTell` whenever a field has both a wrapping and a `for` label, the six one-label cases included; Engine B has no such rule. A Chromium test of nine of the cases fails seven on `main`; jsdom tests cover the five light-DOM shapes. On the 136 fixtures in Chromium, no result changed. The full suite passes (the same one environmental failure); on a page of 1500 labelled fields the rule's time is within run-to-run noise (about 54 against 57 ms).

How NM-6 was checked: nine cases in Chromium, each against the name Chromium computes from the label without `aria-label` (it leaves the field's own content out: "Quantity", "Comments", "Colour"): a select, a textarea with starting text, a listbox, a select with an optgroup, a select and a `for` label, a text input with a value, an input whose label holds a units select, and a select and a textarea named without their label. `main` failed the five named by their label ("Quantity 1 2", "Comments Hello there"…); the branch passes them and still fails the two real mismatches, with the label read as "Quantity" and "Comments". Engines A and B apply their rules only to roles named from content, so neither applies to any of the nine; Understanding 2.5.3 names comboboxes, dropdown lists and text inputs, so the rule keeps them. A Chromium test of six cases fails all six on `main`; jsdom tests cover five. On the 136 fixtures in Chromium, no result changed. The full suite passes (the same one environmental failure); the rule runs faster on a page of 1500 labelled selects (about 125 against 230 ms), as it skips their options.

### Fixed after the second audit, fourth batch (in `main`)

Merged into `main` with pull request [#111](https://github.com/SureA11y/core/pull/111), 2026-10-07, which closed their issues. Commits are as they are in `main`. The pull request also updated `source-map-js` to 1.2.2 in the lockfile (`7340142`), for a Dependabot alert that predated this work.

<a id="r-11"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| R-11 | target-size-minimum measured the bounding box, not what a pointer can hit | Option B′: work out the region a pointer can hit from the layout. The border box with its rounded corners and 2D transforms (`transform`, `rotate`, `scale`, on it and its ancestors), clipped by `overflow`, `contain: paint`, `clip` and `clip-path: inset()` on its containing-block chain and by the page's scrollable area, with content sticking out of it, less the boxes painted over it that take pointer events, ordered by the contrast rules' painting order (`comparePaintOrder`, exposed for it). Fixed and sticky boxes are left out (they cover at one scroll position). The size is the largest 24-aligned square in the region; rounded corners count, as Understanding 2.5.8 shows (decided). The spacing circle is centred on the region's bounding box and tested exactly against each neighbour's region; the 16-point sampling and its `cantTell` band are gone, and `undersized-ambiguous-spacing` is retired with its reason. Sizes are rounded down where rounding would reach the limit (23.98 reads 23.9). Found while fixing it and included: a link around an image was measured by its line of text, not the image; skip links parked at `left: -9999px` were judged against each other, though no scrolling reaches them. Left: 3D transforms, other `clip-path` shapes and an ancestor's rounded clipping stay their bounding box; a square must fit in one piece of a region. | `dad5904`, changelog `2b7eb07` | [#105](https://github.com/SureA11y/core/issues/105) | 2026-10-07 |

How R-11 was checked: the oracle is Chromium's own hit-testing (`elementFromPoint`, which is what the SC's "region that will accept a pointer action" means, unlike paint order). On 24 probe cases (the finding's and seven more: an ancestor's rotation, the `rotate` property, `contain: paint`, a scaled box, a child sticking out, a clipping box that isn't the containing block, a fixed bar), the branch gives the SC's result on every one; Engine A gets 11 right and Engine B 12. Neither handles clipping, rotation, rounded corners or `display: contents`; Engine A also passes a target under a plain box and a 23.98 px one, and Engine B subtracts covering boxes as the branch does but also counts a fixed bar over the target. A new Chromium test holds 23 cases, 20 of which fail on `main`. Rounded corners are measured as drawn; Chromium accepts hits about 1–1.3 px beyond the curve, so a target measured a hair under 24 can take a pointer there. 300 generated layouts (rotations, rounded corners, `clip-path`, clipping wrappers, boxes over targets with and without `pointer-events`, `z-index`) were judged by an oracle that applies the SC to Chromium's hit-tested regions, sampled every 0.5 px within 14 px of each target: of about 1,730 targets not within a pixel of a threshold, `main` got 102 wrong and the branch 1, a sliver about 1 px wide that Chromium leaves at the edge of a rotated box and the branch counts as covered. On the 136 fixtures in Chromium, only `target-size-minimum` changed, on three pages: the scenario fixture (two cases rewritten for the exact geometry), six image inputs 2 px above another one that were `cantTell` from sampling and now fail (Engines A and B don't evaluate them), and on `css-hidden-focus`'s page two off-page links no longer fail against each other while a 21 px button flush above a full-width block link now fails (Engine A fails it too; the link takes the pointer there). The full suite passes (the same one environmental failure). Cost: a target's region is worked out only when another target is within 24 px of it, after a first version cost 14× on a dense page; now fixtures 1.02× (full scan) and a dense page of 2,000 targets, 1,200 of them rounded or rotated buttons 2 px apart, 1.25× (the shapes account for about a third of that).

<a id="vs-8"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| VS-8 | target-size-minimum exempted any inline link in a `li`, `td` or `p` | Option B: a link is "in a sentence" when the stretch of its block container between line breaks (a `<br>`, an `<hr>`, or a box that isn't inline) holds text outside any target with a letter or a digit in it, the block found from the computed `display`, whatever the element. Separators alone (`|`, `›`, `·`) make no sentence: such links are judged, and the `cantTell` for two inline links crowding each other now applies to them only; links with no text around them fail. Chosen over the engines' rule (any text, separators included) because it reports more real crowding and its extra results are `cantTell`, never a wrong fail. Found while fixing it and included: a link in a sentence inside a `<div>` or a `<section>` was not exempt. | `bd2af32`, changelog `dad91f0` | [#106](https://github.com/SureA11y/core/issues/106) | 2026-10-07 |

How VS-8 was checked: 15 cases in Chromium (pagination as a flex list, as inline items and as links in a paragraph, a list of links, a link alone in its paragraph or after a `<br>`, adjacent links in sentences in a `<p>`, `<div>`, `<li>`, `<td>`, "Edit \| Delete", a breadcrumb). The branch fails all six crowded rows without a sentence, which `main` passed; Engine A fails all six, Engine B five (it exempts the link after a `<br>`, since its paragraph has text). All three exempt the links in sentences. On "Edit \| Delete" and the breadcrumb, which the engines exempt, the branch passes both, as their links aren't crowded; crowded symbol-separated links are `cantTell` (a Chromium test). A new Chromium test of 11 cases fails 7 of them on the previous commit; jsdom tests cover the sentence, list and separator cases. On the 136 fixtures in Chromium, one result changed: two pairs of bare links 4 px apart on the accesskeys page went from `cantTell` to `fail` (Engine A fails them too; Engine B exempts them because their `<div>` holds a title's text). The full suite passes (the same one environmental failure). Cost: none measurable (fixtures 0.96×, the dense page 1.02×, against the R-11 commit); each block is walked once for all its links.

<a id="vs-4"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| VS-4 | link-in-text-block missed underlines drawn by an empty pseudo-element, and cues on the link's content | Option A: in a browser, read what `::before` and `::after` draw from their computed style: content of their own, or an empty box painting a background, border, outline or shadow with a size that shows it, in a color other than the link's background; one that draws nothing is no cue. Without a layout (jsdom), an empty-content rule in the CSSOM counts when it declares such a paint. On the link's content, a background unlike the surrounding text's (a code chip, `<mark>`) and a raised or lowered element (`<sup>`) are cues, as on the link itself. Found while fixing it and included: an underline the computed style vouches for is now checked before the pseudo-elements, which makes the rule a little faster. | `1c159f0`, changelog `53ccba8` | [#107](https://github.com/SureA11y/core/issues/107) | 2026-10-07 |

How VS-4 was checked: 11 cases in Chromium, with what each draws measured from the pixels left once the link's text is made transparent: the empty `::after` bar and bottom border each leave a 1 px line (40 px), the chip and `<mark>` their background; an empty `::after` with nothing to paint, a transparent bar and a shadow of a zero-height box leave nothing. The branch now passes every case that draws a mark and fails the others. Engine A reports `cantTell` on every pseudo-element and content case; Engine B fails the pseudo-element underlines (and the `::before` arrow), passes the chip and the `<sup>`, and doesn't evaluate the `<mark>` case. A Chromium test of 13 cases fails 6 of them on the previous commit (the bar, the border, a `::before` bar, the chip, `<mark>`, `<sup>`); jsdom tests cover the CSSOM path and the content cues. On the 136 fixtures in Chromium, no result changed. The full suite passes (the same one environmental failure). Cost: none; fixtures 0.95×, the dense page 0.68× for this rule, thanks to the earlier underline check.

<a id="vs-3"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| VS-3 | avoid-inline-spacing failed values exactly at the minimum | Option A: a value relative to the font size (em, or unitless or a percentage for `line-height`) is read as declared, which is the ratio itself; otherwise the computed ratio meets the minimum within a relative 1e-5, the rounding of the six significant digits browsers report lengths with. Both `avoid-inline-spacing` and `text-spacing-content-loss`. | `a10b67b`, changelog `993daeb` | [#108](https://github.com/SureA11y/core/issues/108) | 2026-10-07 |

How VS-3 was checked: 9 cases in Chromium, inline and in a style sheet (`line-height:1.5`, `letter-spacing:0.12em`, `word-spacing:0.16em` and `line-height:22px` at 11pt, where Chromium reports the font size as `14.6667px`; `line-height:1.5` at `1.1em`, where 26.4 / 17.6 rounds under 1.5; `0.12em` at `0.9rem`; `150%` at 13px; the controls `line-height:1.49` and `letter-spacing:0.119em`). The branch passes the seven at the minimum and fails both controls, in both rules; `main` failed five of the seven inline and asked about the style sheet ones. Engine A passes the seven but also the `0.119em` control (it rounds); Engine B fails `0.12em` and `22px` at 11pt (the same rounding as `main`). A Chromium test of both rules on each case fails 5 of the 9 on the previous commit. On the 136 fixtures in Chromium, no result changed. The full suite passes (the same one environmental failure); no measurable cost (fixtures 0.98×).

<a id="vs-6"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| VS-6 (also the first round's suspected icon item) | css-orientation-lock failed rules that match nothing, and tiny icons | Option B: a quarter turn in an orientation block is judged on the visible elements its selector matches (ACT b33eff), visibility judged without the turn itself. It fails where one of them holds the page's content (`html`, `body`, `main` or an ancestor of it, or, without `main`, an element with half of the body's text, the rule's existing test for hidden content); any other element turned that way is `cantTell` (`ORIENTATION_MEDIA_ROTATES_ELEMENT`, reported against it); a rule turning no visible element, or a pseudo-element, has nothing to judge. The icon part, a decision: asked about rather than failed, since an arrow turned between a side-by-side and a stacked layout locks nothing; this departs from ACT and both engines only towards asking. | `af510b0`, changelog `9c23034` | [#109](https://github.com/SureA11y/core/issues/109) | 2026-10-07 |

How VS-6 was checked: six cases in Chromium in a portrait and a landscape viewport (a rule for a class nothing has, for a hidden element, turning `main`, turning `html`, a landscape rule turning `main`, a 10×10 icon). The branch passes the first two, fails the three that turn the page's content and asks about the icon; `main` and Engine A failed all six. Engine B (which implements ACT b33eff) leaves out the first two and fails the rest, the icon included; it also leaves out `html` in portrait, because it judges visibility after the turn has moved the page out of view, which the branch doesn't. A Chromium test of seven cases in both orientations fails 8 of the 14 on the previous commit; jsdom tests cover unmatched, hidden and decorative targets and a pseudo-element. The scenario fixture's locked region became the page's `main`, which it stands for (a short `div` with a fraction of the text is now a question). On the 136 fixtures in Chromium, no result changed. The full suite passes (the same one environmental failure); no measurable cost.

<a id="vs-7"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| VS-7 | text-spacing-content-loss: clipping ignored containing blocks | Option A: a shared helper, `helpers.containingBlockOf(el)` (parent box in flow; nearest positioned ancestor, or one holding fixed boxes, when absolutely positioned; nearest one holding fixed boxes when fixed; null for the viewport), and the rule takes as clippers only the boxes on the text's containing block chain. `target-size-minimum` uses the helper in place of its own copy. Found while fixing it and included: `contain: paint` (and `content`, `strict`) clips both axes and was not looked at, so text it cut off passed. | `0211212`, changelog `c90e6ca` | [#110](https://github.com/SureA11y/core/issues/110) | 2026-10-07 |

How VS-7 was checked: six cases in Chromium on the finding's markup (a popup that fits until the spacing adds a line), each checked by hit-testing the popup's last line with the spacing applied: the static clipping box (popup in view), a positioned one, a transformed one, a positioned wrapper inside a static one, `contain: paint` (popup cut off), and a fixed popup (in view). The branch matches the screen on all six; `main` failed the first and passed `contain: paint`. Neither engine has this rule. A first try at the variants used a sans-serif font in which the popup was cut off before any spacing, which the rule rightly leaves alone; the cases follow the finding's markup. A Chromium test of the six fails the two on the previous commit; unit tests cover the helper. On the 136 fixtures in Chromium, no result changed. The full suite passes (the same one environmental failure); no measurable cost.

### Fixed after the second audit, third batch (in `main`)

Merged into `main` with pull request [#104](https://github.com/SureA11y/core/pull/104), 2026-10-06, which closed their issues. Commits are as they are in `main`.

<a id="r-1"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| R-1 | Paint that isn't an ancestor's: fixed and sticky paint ignored, stacked layers and solid covers not measured | Option B: work out the paint order. The text, its ancestors' backgrounds and the boxes overlapping it are ordered by the CSS painting order (stacking contexts, `z-index`, positioned boxes, floats, document order) and composited from the top; solid colors covering all of the text are measured against, anything else is `BACKGROUND_OVERLAP`. Found while fixing it and included: an ancestor's background counts only where its box is under the text and it is painted before it (text overflowing its box, text with a negative `z-index`), and a box is tested against every line of the text (it was tested only against the first line whose index cell held it). Fixed and sticky boxes count behind the text and stay left out over it. Left: a gradient under the text stays `cantTell`, as with Engine A and Engine B. | `b8b3d74`, changelog `6493828` | [#101](https://github.com/SureA11y/core/issues/101) | 2026-10-07 |

How R-1 was checked: 100 generated layouts (positioned boxes with every kind of `z-index`, floats, negative-margin overlaps, inline-blocks, nested stacking contexts) were scanned and compared with the rendered pixels (the color under each text line with the text made transparent, and whether the text shows at all). Confident background colors that disagree with the screen: 373 on `main`, 0 on the branch, with no result that was right or `cantTell` on `main` becoming wrong; 82 wrong results became right, 290 became `cantTell`, and 41 right ones became `cantTell` (mostly text partly outside a box, which the pixel check samples at mid-line only). A first attempt at the comparison used the browser's hit-test order (`elementsFromPoint`) and was dropped: it lists a later block's background over earlier text, which the pixels show is painted under it. On the texts whose result changed, Engine A (which models the painting order) agrees: it is unsure of 200 of the 224 texts that became `cantTell` with real paint over or partly under them; Engine B gives a confident pass or fail on almost all of them, so it isn't a reference here (it also fails the fixed, sticky and positioned-box examples). On the finding's examples the branch matches Engine A on all six. The full suite passes (the same one environmental failure); two cases of the 1.10.0 overlap test, light text on solid black, are now measured and pass, as rendered. Cost: fixtures 1.025×, a large page 1.04×, after caching each box's paint role and box per scan.

<a id="r-13"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| R-13 (also VS-5) | The viewport `content` parser: spaces, odd values, several metas | Option A′: read the `content` attribute as browsers do, in both rules, and keep judging every viewport `<meta>`. Whitespace separates settings as `,` and `;` do; a setting with no value, or a value that isn't a number, counts as 0 (so it blocks zoom); `yes` is 1, `device-width` and `device-height` are 10; a number is read up to its first non-numeric character (`1.5x` is 1.5); a later setting replaces an earlier one with the same name; case is ignored; a negative `maximum-scale` is dropped. The parser is shared (`helpers.readViewportContent`), so the two rules no longer disagree. Left by choice: a page with two viewport metas, of which only the last applies in browsers, still fails when an earlier one blocks zoom. | `53effd3`, changelog `34822e0` | [#102](https://github.com/SureA11y/core/issues/102) | 2026-10-07 |

How R-13 was checked: each case was loaded in Chromium with a mobile viewport and zoomed in with a pinch gesture (CDP `Input.synthesizePinchGesture`) to find the largest zoom the browser allows; 17 cases, among them the finding's. After the fix both rules agree with the browser on every one but the two-meta case (`user-scalable=no` then `width=device-width`, which Chromium lets the user zoom), which fails on purpose. On the finding's eight cases Engine B gives the same result as the branch on all eight, so it agrees with the browser on seven and also fails the two-meta case; Engine A agrees with the browser on four: it misses `user-scalable=no` after a space, `maximum-scale=abc` and `maximum-scale=no`, which all block zoom, and passes the two-meta case. The full suite passes (the same one environmental failure).

<a id="r-14"></a>
| # | Finding | Decision | Commit | Issue | Fixed |
|---|---|---|---|---|---|
| R-14 | Input values and placeholders are never contrast-checked | Option B: measure the text a field shows, values and placeholders. The value of an `<input>` that shows text (text, search, email, url, tel, password, number, the date and time types) and the current value of a `<textarea>` are measured in the field's color against its background; while the value is empty, the placeholder is measured in its `::placeholder` color and font, faded by its `opacity`, over its own background (a background image, a shadow, or `opacity` over its own background make it `cantTell`). Found while fixing it and included: a `<textarea>` was measured by its starting text, not by what it shows once edited. Left: the text a browser draws in an empty date field, file inputs and `<select>`; paint overlapping a field isn't looked for; placeholders aren't measured under jsdom, which computes no `::placeholder` style. | `7f88c9c`, changelog `30aa61b` | [#103](https://github.com/SureA11y/core/issues/103) | 2026-10-07 |

How R-14 was checked: 20 cases in Chromium (values set and typed, each field type, textareas, placeholders in the default color, in a light color, hidden by a value, with `opacity`, a background, a large bold font, a shadow, a gradient, an empty date field, a disabled field, a checkbox), with the ratios checked against rendered pixels where `opacity` is involved. Engine A agrees on every value case and, like the branch, leaves out disabled fields and checkboxes; it never measures a placeholder (it passes a field with a 1.6:1 placeholder). Engine B leaves all of them out, as the ACT rule it follows applies to text nodes only. On the 137 fixtures in Chromium, 12 rule results changed, all fields with a placeholder in Chromium's default color (#757575 on white, 4.61:1): `contrast-minimum` went from `notApplicable` to `pass`, and `contrast-enhanced` now fails them, as 1.4.6 asks for 7:1. The full suite passes (the same one environmental failure). Cost: 1.015× on the fixtures.

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
