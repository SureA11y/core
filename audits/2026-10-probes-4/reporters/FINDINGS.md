# Stress test 4: reporters and stored results

Prefix **RP**. Engine at `3af2008`.

Scripts are in this folder. `gen.js` builds the corpus, `check.js` cross-checks the reporters, `mutate.js` fuzzes stored results, `chrome.js`/`evil.js` test injection in Chromium, `selfscan*.js`/`emptytable.js` scan the report with the engine, `xframe.js` runs a real cross-frame scan in Chromium, `bstable.js` checks baseline stability, and `policy*.js`, `level.js` and `repros.js` hold the minimal repros.

## What I checked, and what came back clean
- **Corpus:** 1,644 jsdom scans of every fixture under 12 configs: full; compact (`output.detail:'findings'`); de/es/fr/ja (es and ja compact); `includeRuleIds` with `wcagLevel:'AA'` (partly checked); compact ids; a custom rule; the sample pack with its profile (full and compact); en301549 mappings. Each one was JSON round-tripped.
- **Every result:** SARIF valid against tests/schemas (ajv). JUnit parses with a strict XML parser (jsdom DOMParser application/xml). Root totals equal the sum of the suites, and per-suite tests/failures equal the testcases. Fail rules agree across checksResults, SARIF `error`, JUnit `<failure type=fail>`, EARL `earl:failed` and the HTML report-data rows. Fail and cantTell occurrence counts match SARIF error and warning counts. The baseline round-trip gives 0 new and 0 stale. SARIF and JUnit with `baselineEntries` leave no failures. `cantTellAs:'FAILURE'` raises failures. EARL `isPartOf` ids are the same in every locale. No mismatches.
- **Real cross-frame scan in Chromium** (`runa11yCoreAcrossFrames`, a frame that doesn't answer, open shadow roots in the page and in a frame; full, and compact+de): SARIF is valid. Fail counts agree across SARIF, JUnit, baseline and EARL. Baseline self-match and the match after an unrelated DOM edit both give 0 new.
- **Baseline fingerprints:** stable across two identical scans of every fixture, and after unrelated edits (a `<p>` prepended to body, a `<div>` appended, a `<meta>` in head). 0 new findings.
- **HTML injection in Chromium:** payloads in url, title, timestamp, engine fields, locale.requested, standards note/titleLang, ruleId, severity, helpUrl with quotes, mapping requirement/title, selector, html (`</script>`, `]]>`, `--`), summary, hint, margin, rule error, frame selector/title/url/error, and `options.title`. No script ran, no dialog fired, no `on*` attribute appeared, no injected img/svg, and the page had no JS errors. U+0000, U+202E and C0 characters were removed. JUnit drops U+FFFE and lone surrogates and still parses.

## CONFIRMED bugs

### RP-1 (Medium): A policy whose `allowedOutcomes` excludes `fail` still produces `fail` for any rule with fail-tier occurrences
`normalizeRuleResult` sets `outcome = 'cantTell'` and `policyOutcome = 'fail'`. The tier reconciliation added later (CHANGELOG line 99) then sees a `fail` tier and sets `outcome` back to `'fail'`. The result says `outcome:'fail', policyOutcome:'fail'`, which contradicts OUTPUT_SCHEMA ("policyOutcome: …when the policy's allowedOutcomes made it cantTell") and POLICY.md. SARIF reports it as `error`, JUnit as `<failure>`, and the build fails. This happens with built-in rules, not only custom ones.

Location: `scripts/build-core.js:1745` (policy branch) and `:1766` (tier upgrade); generated copy at `src/core.js:1569/1590`.

```js
const r = runa11yCoreOnHtml(fs.readFileSync('tests/fixtures/aria-prohibited-attr-all-scenarios.html','utf8'),
  { engineOptions: { policyContract: { id:'no-fail', allowedOutcomes:['pass','cantTell','notApplicable'] } } });
r.checksResults.filter(c => c.outcome === 'fail').map(c => [c.ruleId, c.policyOutcome]);
// observed: [['aria-prohibited-attr','fail'], ['aria-roles-valid','fail']]   expected: none; both cantTell
```

A custom rule returning `{outcome:'fail', occurrences:[{occurrenceOutcome:'fail'}]}` does the same (`policy.js`). The same rule without tiers is correctly `cantTell`.

**Fix:** when the policy rewrites the outcome, demote fail-tier occurrences to `cantTell`, as the manual-rule coercion already does. Alternatively, run the tier reconciliation before the `allowedOutcomes` check and skip the upgrade when `policyOutcome` is set.

### RP-2 (Low-Medium): The HTML report fails its own WCAG 2.2 AA self-scan when no occurrence row is shown
A clean scan, or any result with no fail/cantTell occurrences, leaves `<tbody id="findings-body">` empty. The report then fails `table-th-has-data-cells` (1.3.1) on 5 `<th>` cells, in light and dark mode. The same happens whenever the filters leave no row. The test added in 0d28802 only scans a report that has failures, so it doesn't catch this.

`src/report.js:928`, client `render()` around lines 995–1020. Repro: `emptytable.js` (includeRuleIds img-alt-present + page-title-present on a clean page, then run the bundle with `{wcag:{version:'2.2',level:'AA'}}`).

**Fix:** render a `<tr><td colspan="5">No occurrences match</td></tr>` row when the slice is empty, or hide the table and show only the pager text. Add a clean-result case to report-wcag-chromium.test.js.

### RP-3 (Medium-Low): No reporter conveys `shadowHostSelectors`, so a shadow-tree finding is located by a selector that resolves to a different element
For a finding inside an open shadow root, the occurrence has `selector:"img", shadowHostSelectors:["#host2"]`. The HTML card and table, SARIF `logicalLocations[].fullyQualifiedName`, JUnit `selector:` lines and baseline entries all show only `img`. On a page that also has a light-DOM `img`, `document.querySelector('img')` finds the wrong element. OUTPUT_SCHEMA itself says "Two components with the same content give the same selector and differ here". Repro: `xframe.js`; grepping each reporter's output for `host2` finds nothing.

**Fix:** show the host chain, e.g. `#host2 ▸ img` in the HTML report and JUnit. In SARIF, add a parent logical location or a `properties.shadowHostSelectors`. Optionally record it in baseline entries for human context.

### RP-4 (Low): HTML report throws a raw TypeError on null entries that the other reporters skip
Stored JSON that has `null` in `checksResults`, in a fail check's `occurrences`, or in `rulesResults` crashes `renderHtmlReport`. Sparse arrays also become `null` after a JSON round-trip. SARIF, JUnit, EARL and baseline all skip such entries, and baseline.test.js asserts that they should.

- `src/report.js:172` → `Cannot read properties of null (reading 'outcome')`
- `:714` / `:653` → `(reading 'selector')`
- `:396` → `(reading 'meta')`

Repro: `repros.js` B2. **Fix:** filter `Boolean` at the top of `renderHtmlReport` (checksResults, rulesResults, each `occurrences`).

### RP-5 (Low): French JUnit suite name for 4.1.2 has a trailing space
French titles put a space before the colon (`Nom, rôle et valeur : nom accessible`). `criterionOf` splits at `': '`, so the shared head keeps the space: `<testsuite name="WCAG 4.1.2 Nom, rôle et valeur ">`.

`src/junit.js:265`. **Fix:** split on `/\s*:\s/`, or `.trim()` the heads.

### RP-6 (Low): SARIF writes a `note` notification for passing contrast rules, not only for notApplicable
SARIF.md says the notes come from a `notApplicable` check and that "a run with nothing to report has no `invocations` key at all". Passing contrast rules carry a scan-describing occurrence ("All computable text meets minimum contrast (AA). Eligible text nodes: 1. Computable: 1."). `src/sarif.js:293` emits a note for any non-fail/cantTell outcome. This happened on 151 corpus results, so a clean page always gets an `invocations` block.

**Fix:** restrict the notes to `notApplicable`, or document pass notes. "Computable 4 of 55" is arguably useful, but then say so in the docs.

### RP-7 (Low): SARIF `artifactLocation.uri` is not always a valid uri-reference, and a non-string url throws
`runDomRulesInPage('dist/my page.html', …)` stores `url:"dist/my page.html"`. SARIF writes it verbatim, so the result fails schema validation (`format "uri-reference"`). `https://example.test/a b` behaves the same. Only `file:` URLs are encoded. A stored `url: 5` throws `TypeError: url.startsWith is not a function`.

`src/sarif.js:49-63`. **Fix:** require a string, use `new URL(url).href` when it parses, and otherwise `encodeURI` the relative path, with `\` converted to `/`.

## PLAUSIBLE leads (design or consistency questions, not clear bugs)

1. **`wcagLevel` and `wcagVersion` scoping is ignored by JUnit, SARIF and EARL.** With `wcagLevel:'AA'`, `rulesResults` drops 1.4.6. JUnit still emits a failing `WCAG 1.4.6` suite (`wcagLevel` property AAA, no `criterionOutcome`) and the root `failures` count includes it, so an AA-scoped CI run goes red on an AAA criterion. `includeRuleIds:['duplicate-id']` under 2.2 likewise yields a `WCAG 4.1.1` suite, though ENGINE_OPTIONS says it "adds no 4.1.1 under 2.2". This follows from "suites come from each rule's own WCAG mappings", but the docs never mention it. Repro: `level.js`; `check.js` found 256 such suites. Suggestion: omit suites, or mark them `outOfScope`, for criteria the run's level and version exclude; or document it in JUNIT.md.
2. **Stored results from before the tier reconciliation are still inconsistent across reporters.** For example, `outcome:'cantTell'` with a fail-tier occurrence gives a SARIF error and a JUnit failure, but no baseline entry and no EARL failure, so it can't be baselined. The fix (CHANGELOG line 99) is in the engine only. The reporters could apply the same rule when reading.
3. **EARL merges frames that share `about:srcdoc` or `about:blank`.** Several srcdoc frames, or a `setContent` top page plus frames, become one subject with the worst outcome kept. Consider making the subject `source#frame=<path>` when the URL is not unique.
4. **Hostile types crash the reporters with raw TypeErrors or produce invalid SARIF.**
   - `meta.normativeMappings` as an object or string crashes all four reporters.
   - A non-string `ruleId` gives invalid SARIF (`rules[].id`) and a JUnit crash `a.check.ruleId.localeCompare is not a function` (`junit.js:346`). A compact result with a numeric `ruleId` hits this too.
   - A non-string `occurrence.selector`, `title` or `engine.version` gives invalid SARIF.
   - `rulesResults` as an object crashes JUnit (not iterable).
   - `engine.locale.requested` with a broken `toString` crashes HTML.

   None of these are documented as accepted inputs, but the rest of the code goes out of its way to coerce.
5. **At 320 CSS px the whole report scrolls horizontally** (scrollWidth 418–1147), driven by the `.wcag-table` tables and the findings table. Data tables are a 1.4.10 exception, but wrapping each table in its own scroll container (with `tabindex=0` and a label) would keep the page itself reflowing.

## Improvements
- Self-scan cantTell findings on the report: card snippet regions are `overflow:auto` but not focusable (`scrollable-region-focusable`, 2.1.1 risk). Add `tabindex="0"` with a label, or wrap instead of scrolling. The bold tile labels trip `p-as-heading`. The search field's name comes only from `aria-label` (a visible label would help).
- JUnit suite names are localized (`WCAG 1.1.1 Nicht-Text-Inhalt…`). A team that changes scan locale breaks CI test history. Consider an English or neutral suite name, with the localized title as a property.
- The HTML rollup's "Contributing" column lists every `checksIds` entry, including rules not selected or not run (21 rules for 1.1.1 when only one ran). Mark which ones ran.
- Rollup WCAG mappings use `level` while check mappings use `conformanceLevel`. JUnit reads both and the HTML report reads only `level`. Unify, or document both.
- The client-side filter uses `active[r.outcome]` on a plain object. Rows whose outcome is `constructor`, `toString` or `__proto__` can't be filtered out, and rows with an unknown outcome are hidden silently while still counted in the total. Use `Object.create(null)` or `hasOwnProperty`.
- Extend report-wcag-chromium.test.js to cover a clean result (RP-2), a cross-frame result, a pack/standard rollup, the ja/de locales, and a 320px viewport.
