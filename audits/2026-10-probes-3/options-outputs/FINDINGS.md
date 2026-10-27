# Options, translations and output contracts — findings

- **Code under test:** `eaa5d3f1`, which is package version 1.10.0 plus unreleased changes. `208fbdf4` adds only audit files.
- **Compatibility checks:** made against the 1.10.0 package from npm. Set `OLD_CORE` to use another copy.
- **Running the probes:**
  - Each probe in this folder runs with `node <file>`.
  - `h.js` holds the shared helpers and `v.js` the output-schema validator.
  - Each `out-*.txt` is the output of the probe with the same number.
  - `05b-types.js` reads the samples `05-schema-sweep.js` writes (about 5 MB, not kept), so run 05 first.
- **Earlier rounds:** their items are not repeated. Where an old item still reproduces, the finding says so.
- **[V]:** reproduced by at least two separate probes or runs. OO-1 and OO-8 were also re-checked during consolidation.

| ID | Title | Category | Severity |
|---|---|---|---|
| OO-1 | An occurrence selector resolves to another element when an id, test id, name or aria-label is shared with a hidden, excluded or out-of-scope element [V] | bug | medium |
| OO-2 | A selection whose excludes cancel its includes runs no rule without a word, and the reporters show a clean pass [V] | bug / contract | medium |
| OO-3 | A compact result (`output.detail: 'findings'`) doesn't report as the full one for custom rules, packs and caller messages [V] | contract | medium |
| OO-4 | The reporters disagree when a check's outcome and its occurrences' tiers disagree [V] | contract | medium |
| OO-5 | `strictOptions: 'true'` or `1` turns strict checking off without a word [V] | ergonomics | medium |
| OO-6 | A policy that disallows `pass`/`notApplicable` makes the reporters say the rules "did not complete"; `allowedOutcomes` values are never checked [V] | contract | low |
| OO-7 | `index.d.ts` doesn't describe three things real results contain [V] | contract | low |
| OO-8 | Two reason codes shipped in 1.10.0 are missing from the finding-id inventory, so nothing protects them [V] | contract | low |
| OO-9 | jsdom: font-size keywords and `calc()` read as 0 px; messages say "font size: 0px", and large text set by keyword is held to 4.5:1 [V] | bug | low |
| OO-10 | A null-prototype object in a list option crashes the scan with an uncoded error, even under `strictOptions` [V] | bug | low |
| OO-11 | Without `strictOptions`, wrong-typed values are still ignored silently (S-6), some in the opposite direction from what the caller meant [V] | ergonomics | low |
| OO-12 | `rules[ruleId]` under a misspelt, differently cased or legacy-prefixed id is ignored silently, even under `strictOptions` | ergonomics | low |
| OO-13 | An invalid `contrast.rootCanvasFallback` silently falls back to white; `transparent` reads as black; the echo shows the value given | ergonomics | low |
| OO-14 | POSIX locale codes (`de_DE`, `ja_JP`, `de_DE.UTF-8`) fall back to English as `unknown-locale` | i18n | low |
| OO-15 | Reporter inputs outside their set silently default: JUnit `cantTellAs`, and `matchBaseline` given the baseline file | ergonomics | low |
| OO-16 | Profile `severity` levels are case-sensitive; one wrong case skips the whole pack, and the scan then runs every rule | ergonomics | low |
| OO-17 | `getMargins` returns `[]` for a cross-frame result and for anything else (part of O-3, still reproduces) | contract | low |
| OO-18 | Doc slips in OUTPUT_SCHEMA.md, API_STABILITY.md and ENGINE_OPTIONS.md | doc | low |
| OO-19 | German `css-hidden-focus` summary uses the tag name as a noun ("Das fokussierbare a") | i18n | low |

---

### OO-1. An occurrence selector resolves to another element — bug, medium [V]

- **Repro** (`08b-selector-uniqueness.js`): `<main><p id="a" hidden>x</p><img id="a" src="a.png"></main>`, `runOnly: ['img-alt-present']`.
- **Observed:**
  - The occurrence's `selector` is `"#a"`, and `document.querySelector('#a')` returns the hidden `<p>`.
  - `structuralPath` and `html` point at the `<img>`.
- **Same result when the other element is:**
  - excluded (`excludeSelectors: '.ad'`);
  - outside `contextSelector: 'main'`;
  - matched by `data-testid` (`[data-testid="t"]`);
  - matched by an `aria-label` anchor (`button[aria-label="Go"]`).
- **On the repo's own fixtures:** the schema sweep found it on `duplicate-id-all-scenarios.html` `#dupid_case_04`, in `duplicate-id`, `region` and `contrast-computable`, under every option set.
- **1.10.0** does the same.
- **Expected** (OUTPUT_SCHEMA.md:196): "the engine actively verifies it resolves to the reported element before using it".
- **Cause:**
  - `createSelectorUniqIndex` counts ids, test ids, names and aria-labels over `queryAllSmart(...)`, which leaves out hidden, excluded and out-of-scope elements (`src/core/dom-helpers.js:5181-5240`).
  - `uniqueIdSel` and the other anchors trust that count (`:5344-5349`).
  - Uniqueness has to be counted over the whole document, the way `querySelector` resolves it.
- **Effect:** SARIF `logicalLocations`, the HTML report and any tool that re-resolves the selector land on the wrong element. Scoped scans are most exposed, since ids repeated across page regions are common.

### OO-2. A selection that comes to nothing runs no rule without a word — bug / contract, medium [V]

- **Repro** (`12-selection-consistency.js`, `12b-empty-selection.js`), on a page with a failing `<img>` and `<button>`:
  - `{ includeRuleIds: ['img-alt-present'], excludeRuleIds: ['img-alt-present'] }`
  - `{ tags: ['wcag2a'], excludeTags: ['wcag2a'] }`
  - `{ wcag: { version: '2.2', level: 'AA' }, excludeTags: [<the WCAG level tags>, 'best-practice'] }`
  - `{ includeRuleIds: ['region'], tags: ['wcag111'] }` (default `includeMode: 'and'`, disjoint sets)
  - `{ ..., includeMode: 'xor' }` (invalid, read as `'and'`)
  - `{ excludeTags: ['a11ycore'] }` or `engineOptions.tags.exclude: 'a11ycore'`
- **Observed:** `checksResults: []` and no warning, also with `strictOptions: true`. Downstream:
  - JUnit: `tests="0" failures="0" errors="0"`;
  - SARIF: 0 results;
  - `matchBaseline`: `newCount: 0`.
- **Expected:**
  - ENGINE_OPTIONS.md:172 makes an include that names nothing throw, "since it would select nothing and a run of no rules reads as a clean pass". The same reasoning applies after excludes: at least a warning, or `INVALID_RUN_ONLY`.
  - `runOnly.includeMode` outside `'and' | 'or'` is checked by nothing (`scripts/build-core.js:613-616`).
- **Where:** `resolveEffectiveRunOnly` and its filtering (`scripts/build-core.js:1202` onward, `:1411`, `:1468`).

### OO-3. A compact result doesn't report as the full one for custom rules, packs and caller messages — contract, medium [V]

- **Repro** (`06-compact-vs-full.js`, `06b-compact-packs-messages.js`): scan a page twice, once with `output: { detail: 'findings' }`, and render every reporter from both results.
- **Identical** for plain scans, `ja`, `de-AT`, a profile, `mappings` and `wcagVersion`.
- **A passing custom rule** (`meta.wcagSc: ['1.1.1']`, `title`, `helpUrl`):
  - SARIF names it by id and drops its title.
  - JUnit's 1.1.1 suite goes from `tests="4"` to `tests="3"`.
  - EARL loses `isPartOf`.
- **A pack's profile:** SARIF drops the standard's tags, and JUnit drops its properties.
- **Caller messages:** SARIF `shortDescription` goes back to English.
- **A custom rule naming EN 301 549:** 0 `en301549-*` tags in compact output, 1 in full output.
- **Expected** (OUTPUT_SCHEMA.md:59, API_STABILITY.md:10): "the reporters read a compact result as the full one".
- **Cause:**
  - `expandCompactResult` rebuilds each check from `getCheckDefById(ruleId, { locale, mappings, profile })`, without the scan's `customRules`, `packs` or `messages` (`src/scan-result.js:110-136`).
  - Those options aren't stored in the result, so they can't be passed along.
- **Related:** PB-13.

### OO-4. Reporters disagree when outcome and occurrence tiers disagree — contract, medium [V]

- **Repro:** `04-tier-consistency.js`.
- **Case 1, `outcome: 'cantTell'` with an occurrence `occurrenceOutcome: 'fail'`:**
  - SARIF: an `error`-level result.
  - JUnit: `failures="1"`.
  - Baseline: 0 entries.
  - EARL: not `failed`.
  - So it gates CI but can't be baselined.
- **Case 2, `outcome: 'fail'` whose only occurrence is `cantTell`-tier:**
  - EARL: `earl:failed`.
  - JUnit: `failures="0"`, the case is `skipped`.
  - SARIF: no `error` result.
  - Baseline: 0 entries.
  - So a `fail` passes a JUnit gate.
- **Expected:** one answer to "is this a failure" across reporters. Either the engine normalises the outcome against the tiers, or every reporter applies the same rule.
- **Cause:**
  - SARIF and JUnit decide per occurrence (`src/sarif.js:203-214`, `src/junit.js:94-131`).
  - Baselines also require `check.outcome === 'fail'` (`src/baseline.js:118-121`).
  - EARL reads the check outcome.
- **Background:** this follows from C-8/C-9 of the first round (custom-rule result shape not enforced), which the outcomes file lists as left.

### OO-5. `strictOptions: 'true'` or `1` turns strict checking off without a word — ergonomics, medium [V]

- **Repro:** `{ strictOptions: 'true', lcoale: 'de' }` (`01-fuzz-options.js`, `02-string-booleans.js`).
- **Observed:** no throw; the typo is only warned about.
- **No warning for the non-boolean itself:** `'true'`, `1`, `'yes'` and `{}` are all taken as false.
- **Why it matters:** a string from an environment variable or a CLI flag is the likely way to get this wrong in CI.
- **Expected:** a non-boolean warns, or counts as strict.
- **Cause:** `engineOptions.strictOptions === true` (`src/core/engine-options.js:211`, `:219-220`).

### OO-6. A policy that disallows `pass`/`notApplicable` makes reporters say rules "did not complete" — contract, low [V]

- **Repro:** `policy: { allowedOutcomes: ['fail', 'cantTell'] }` on a passing page (`14-policy.js`).
- **Observed:** each `pass` or `notApplicable` becomes `cantTell` with no occurrences and an `error`. Downstream:
  - JUnit counts each as an `<error>`.
  - SARIF writes "The rule … did not complete".
- **Same result for:**
  - `allowedOutcomes: ['passed', …]` (typo);
  - `allowedOutcomes: []`.
- **Not caught by `strictOptions`:** it only checks for a list of strings (`src/core/engine-options.js:38-41`).
- **Also:** an unknown `allowedConfidence` value is ignored silently.
- **Docs:**
  - OUTPUT_SCHEMA.md:162 defines "cantTell with no occurrences and an error" as a rule that did not complete, so a coerced pass can't be told apart from one.
  - POLICY.md calls the coercion "silent", but it adds an `error`.
- **Where:** `scripts/build-core.js:1533`, `src/scan-result.js:161-166`.

### OO-7. `index.d.ts` doesn't describe three things real results contain — contract, low [V]

- **Compact results:**
  - `checksResults` is typed `CheckResult[]` (`src/index.d.ts:625`). A compact result gives 124 strict tsc errors (11 required fields missing).
  - So `r.checksResults.map(c => c.meta.tags)` compiles and then throws.
  - `tests/types/result-types.test.js` has no compact scan.
- **Custom-rule mappings:** a custom `meta.wcagSc` becomes `{ standard: 'WCAG', requirement }`, with no `version` or `title`. `NormativeMapping` requires both (`index.d.ts:365-369`), as does OUTPUT_SCHEMA.md:119.
- **`data.details: null`:** `img-alt-quality` and `input-image-alt-decorative` emit it.
  - The types allow an object or absence (`index.d.ts:457`).
  - Sources: `src/checks/manual/img-alt-quality-manual.js:275`, `input-image-alt-decorative-manual.js:195`.

### OO-8. Two reason codes shipped in 1.10.0 are missing from the finding-id inventory — contract, low [V]

- **The codes:** `aria-hidden-focus` emits `ariaHiddenFocusable_modalOpen_needsReview` and `ariaHiddenFocusable_runtimeRedirect_needsReview` (`src/checks/automatic/aria-hidden-focus.js:939,946`).
- **Missing from:** `scripts/data/finding-ids.json` and `released-finding-ids.json`.
- **Why it matters:** both shipped in 1.10.0. Renaming either would pass the finding-id tests and break baselines and Code Scanning alerts.
- **Cause:**
  - The generator's `/\breasonCode\s*:/` (`scripts/generate-finding-ids.js:53`) misses `occReasonCode = '...'`.
  - It runs only each rule's own fixture, so a code reached on another fixture is missed too.
- **Scope:** 165 of the other 166 emitted codes are in the inventory. 20 rules emit occurrences with no `reasonCode` (`out-17.txt`).

### OO-9. jsdom: font-size keywords and `calc()` read as 0 px — bug, low [V]

- **Repro:** `<p style="color:#888;font-size:xx-large">` on white (`16-jsdom-font-keywords.js`).
- **Cause:** jsdom keeps the computed `fontSize` as `"xx-large"` (or `"medium"`, or `"calc(32px)"`), and the engine reads it with `parseFloat` (`src/core/contrast-helpers.js:966-967`).
- **Effect on messages:** jsdom contrast messages say `font size: 0px`.
- **Effect on outcomes:** text sized with `xx-large`, `larger` or `calc(16px * 2)` is held to 4.5:1, so 32 px text at 3.54:1 fails.
- **Handled correctly:** `2em`, `200%` and `32px`.
- **Expected:** resolve the keywords, or treat an unparsable size as not computable.
- **Docs:** not in LIMITATIONS.md.

### OO-10. A null-prototype object in a list option crashes the scan with an uncoded error — bug, low [V]

- **Inputs that throw `TypeError: Cannot convert object to primitive value`**, with no `code`, even under `strictOptions`:
  - `optInRules: Object.create(null)`;
  - `mappings: [Object.create(null)]`;
  - `excludeSelectors: [Object.create(null)]`;
  - `runOnly.tags: [Object.create(null)]`.
- **Wrong error under `strictOptions`:** `rules: [{}]` throws `INVALID_RUN_ONLY` instead of `INVALID_ENGINE_OPTIONS`.
- **Cause:** the option check runs after `resolveEffectiveRunOnly` (`scripts/build-core.js:2191-2206`; `src/core/dom-runner.js:924`). ENGINE_OPTIONS.md:312 says strict mode checks every option before the scan.
- **Crash site:** `parseCommaList` (`scripts/build-core.js:589-600`) and `applyOptInRules` (`:1031-1038`).

### OO-11. Without `strictOptions`, wrong-typed values are ignored silently, some backwards — ergonomics, low [V]

S-6 still reproduces outside strict mode, which is by design. These cases go the opposite way from what the caller meant:

- **Turned on, or kept on, by `'false'` or `0`:**
  - `perfStats: 'false'` and `profileRules: 'false'` turn them on. `profileRules` makes output non-deterministic.
  - `includeShadowDom: 'false'` or `0` keeps shadow DOM on.
  - `output.includeHtml: 'false'` keeps HTML.
- **Left off by `'true'` or `1`:**
  - `fragment: 'true'` or `1` stays off.
  - `includeHiddenElements: 'true'` stays off.
- **Ignored whole:**
  - an `engineOptions` that is a string, an array or a number;
  - prototype getters on a class instance.
- **Every rule runs:** `runOnly` as a `Map` or a `Date`.

See `out-01b.txt`. All of these are caught under `strictOptions`.

### OO-12. A misspelt `rules[ruleId]` is ignored silently, even under strict mode — ergonomics, low

- **Repro:** `rules: { 'img-alt-presnt': { excludeSelectors: ['.ad'] } }` (`23-rule-scoped-typos.js`).
- **Observed:** nothing is applied, and there is no warning.
- **Same for:**
  - `'IMG-ALT-PRESENT'`;
  - `'a11ycore-img-alt-present'`, the legacy prefix the docs say matching accepts.
- **Cause:** `src/core/engine-options.js:165-167`.

### OO-13. An invalid `contrast.rootCanvasFallback` silently falls back to white — ergonomics, low

| Value | Measured against |
|---|---|
| `'banana'`, `'#fff0'` | white (4.48:1, fail), with no warning |
| `'transparent'`, `'rgba(0,0,0,0)'` | black (pass) |

- **Echo:** the result echoes the string given, not the color used.
- **Cause:** `src/core/dom-runner.js:950-953`.

### OO-14. POSIX locale codes fall back to English — i18n, low

- **Repro:** `de_DE`, `ja_JP` or `de_DE.UTF-8`, as found in `LANG`.
- **Observed:** `{ resolved: 'en', reason: 'unknown-locale' }`. By comparison, `de-DE` resolves to `de`.
- **Cause:** `matchLocale` and `isKnownLocale` split on `-` only (`scripts/build-core.js:381-425`).

### OO-15. Reporter inputs outside their set silently default — ergonomics, low

- **JUnit:** `cantTellAs` set to `'Failure'`, `'fail'` or `true` is treated as `skipped`; only the exact `'failure'` gates (`src/junit.js:389`).
- **Baseline file:** `matchBaseline(result, file)` given the whole baseline file, an object map or a string reports every finding as new and 0 stale, with no error (`src/baseline.js:146`).
- **Malformed entries:** entries missing `ruleId` or `html` count as stale and never match, silently.

### OO-16. Profile `severity` levels are case-sensitive — ergonomics, low

- **Repro:** `severity: { 'img-alt-present': 'Critical' }` in a checklist profile.
- **Observed:**
  - The whole pack is skipped (with a warning).
  - Its profile then doesn't exist, so the scan runs every rule (with a warning).
- **Inconsistency:** a custom rule's `defaultSeverity` is read in any case.

### OO-17. `getMargins` returns `[]` for a cross-frame result — contract, low

- `getMargins('x')`, `getMargins([])` and `getMargins({ topFrame, frames })` all return `[]` (`src/core/margin.js:154-162`).
- This is part of O-3, and it still reproduces.

### OO-18. Doc slips — doc, low

- **API_STABILITY.md:12:** says `tags` aren't on result meta, but `meta.tags` and `meta.helpUrl` are on every check result.
- **OUTPUT_SCHEMA.md top-level `ts` block (16-44) leaves out:**
  - `engine.version`, `engine.profileExcludes`, `engine.optInRules`, `engine.outputDetail`, `engine.packs`;
  - `environment.images`, `environment.animationsSettled`;
  - `standards`, `skippedPacks`.
- **OUTPUT_SCHEMA.md meta block (109-126):** leaves out `deprecated` and `deprecation`.
- **`error` comments:** OUTPUT_SCHEMA.md:149 and `index.d.ts:533` describe `error` more narrowly than the note at :162.
- **Catalog functions:**
  - ENGINE_OPTIONS.md:137 and :447 present `getCheckDefById`, `getChecksForRunOnly` and `getCompositeRuleById` as public.
  - API_STABILITY.md:65 and `index.d.ts:876-889` call them internal.
- **Custom mappings:** ENGINE_OPTIONS.md:466 (short form) and OUTPUT_SCHEMA.md:119 (`version` and `title` required) disagree.

### OO-19. German `css-hidden-focus` summary uses the tag name as a noun — i18n, low

- **Observed:** `cssHidden_focus_summary_cantTell` renders "Das fokussierbare a ist visuell verborgen…" and "Das fokussierbare button ist…".
- **Expected:** a neutral phrasing, such as "Das fokussierbare Element `<a>` ist…".

---

## Held up

- **Output schema:** a validator over 240 scans (12 fixtures × 20 option sets) found only OO-1. It checks:
  - fields;
  - enums;
  - that a manual rule is never `fail`;
  - that `fail` has occurrences;
  - `rollupIds`, precedence, metrics and contributors;
  - `engine.version`;
  - JSON and `structuredClone` round trips.
- **Catalog and results agree:**
  - `getChecksCatalog`, `getRulesCatalog` and the scan agree under 8 option sets, including a pack, custom rules and messages.
  - `getChecksForRunOnly` lists exactly what ran in all 30 selection combinations.
- **Translations:** 141 fixtures × 5 locales.
  - No raw placeholders, `undefined`, `NaN` or `[object …]`.
  - No English left over, and no missing keys.
  - Outcomes and counts are identical across locales.
- **Locale resolution:** as documented for case, region, whitespace, empty, prototype names and extension subtags. The browser bundle side files behave as documented.
- **Baselines:**
  - A 1.10.0 baseline applied to main on 141 fixtures: 789 of 789 failures known, 0 new. The 15 stale entries are documented fixes.
  - Identity is stable under these changes:
    - attribute order;
    - class order and whitespace;
    - quote style;
    - a sibling inserted before;
    - whitespace between elements;
    - an ancestor's style.
- **Stored 1.10.0 results through main's reporters:** no throws. Baselines are identical, and SARIF and JUnit totals equal 1.10.0's own.
- **Injection:** markup in every new field is escaped in HTML. No script ran, and JUnit parses as XML.
- **Scale:** reporters are linear up to 50,000 occurrences. At 50k: SARIF 195 ms (55 MB), JUnit 509 ms, HTML 45 ms, baseline 75 ms.
- **Compact output:** equals the full result in every reporter when there are no custom rules, packs or messages.
- **`result.standards`:** matches what the mappings name.
- **Odd option values:**
  - Throwing getters and Proxies pass the caller's error through.
  - Frozen options are not mutated.
  - Probes are capped and JSON-safe.
  - A bad `excludeSelectors` entry warns while the others apply.

## Missing tests

- OO-1: selector uniqueness when the same anchor is on a hidden, excluded or out-of-scope element.
- OO-2: a selection that ends empty after excludes or `includeMode`, and `includeMode` outside its set.
- OO-3: compact output with custom rules, packs and messages, compared with full output in each reporter.
- OO-7: type tests with a compact scan, a `wcagSc`-only custom rule and `img-alt-quality`.
- OO-4: reporter agreement on tier mismatches.
- OO-5 and OO-10:
  - a non-boolean `strictOptions`;
  - null-prototype list values;
  - strict errors raised before selection errors.
- OO-6: a policy-coerced pass in JUnit and SARIF, and invalid `allowedOutcomes`.
- OO-8: generated finding ids for codes set through a variable or reached on another fixture.
- OO-9: jsdom contrast with keyword and `calc()` font sizes.
- OO-12: `rules[ruleId]` with an unknown id.
- OO-14: POSIX locale codes.
