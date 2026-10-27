# Stress test 4: selection, and which criteria a scan reports

Prefix **SE**.

Scope: criteria reporting for scans that name checks, `wcagLevel`, `getRulesForRunOnly` parity, standards in play, profile waivers, case-insensitive ids.
Scripts are in this directory: `fuzz.js` (differential/property test), `t_*.js` (targeted probes), `repro/r*.js` (minimal repros). Nothing under /home/user/core was modified.

## Differential / property test
I ran `fuzz.js <seed> <n>` on about 2,900 random combinations: random rule ids, rollup ids and standard rollup ids in mixed case and with the `a11ycore-` prefix; shorthand, `{type:'rule'}`, includeRuleIds/includeTestIds/exclude*; WCAG, criterion, category and best-practice tags; `runOnly.wcag`; `bestPractices`; `includeMode`; `wcagVersion`; `wcagLevel` in mixed case; the four built-in profiles (en301549 included) and several pack profiles: the sample standard pack, a mappedRules-only standard pack, and a checklist pack with criterion and rule waivers. Also `optInRules`, `mappings`, custom rules with `meta.wcagSc` (one of them on 4.1.1), and `engineOptions.rules/tags/tests`.
Checked on each combination:
- `getRulesForRunOnly` matches `rulesResults` exactly, ids and order.
- `getChecksForRunOnly` matches `checksResults`.
- The catalog functions and the scan throw on the same inputs.
- Each rollup's outcome agrees with its contributors, and contributors agree with the checks.
- `notSelectedChild` appears exactly when there are notSelected contributors.
- No WCAG rollup above `engine.wcagLevel` unless it was named by id.
- No 4.1.1 added under 2.2, and no 2.2-only criterion added under 2.0 or 2.1.
- A standard's rollups appear only when the standard is in play.
- A mappedRules-only profile reports no WCAG rollups.
- `rollupIds` matches the rollups.
- A repeat scan gives the same result.

**Result: no parity difference, invalid rollup outcome or nondeterminism in about 2,900 combinations.** The only flags were my checker's own regex on prefixed ids. One of them was in fact bug 1 below. The browser bundle in Chromium matched Node on spot checks.

## CONFIRMED bugs

### SE-1. A standard's rollup id with the lowercase legacy prefix does not select the opt-in rules it groups — low/medium
```js
// repro/r1-prefixed-standard-rollup.js (sample pack from tests/fixtures/packs/sample.js)
runDomRulesInPage(url, null, { packs: [samplePack] }, { includeRuleIds: ['a11ycore-sample-1.0-S6'] });
```
- **Observed:** `'sample-1.0-S6'` and `'A11YCORE-SAMPLE-1.0-S6'` run `sample-statement-link`, and S6 is `fail`. `'a11ycore-sample-1.0-S6'` runs no rule and warns "The rule selection runs no rule". It still reports `sample-1.0-S6: cantTell` with every child missing. `getChecksForRunOnly` agrees (it lists nothing), so the problem is in selection, not parity.
- **Expected:** the legacy `a11ycore-` prefix is accepted wherever a rule id is (ENGINE_OPTIONS.md), and "by the id of one of its standard's own rollups that groups it" selects opt-in rules.
- **Cause:** in `ruleMatchesRunOnly`, `askedByRollup` looks up `OPT_IN_COMPOSITE_TAGS[String(id).trim()]` without stripping the prefix (scripts/build-core.js:1589, built into src/core.js:1413). `canonicalizeRuleIds` leaves a prefixed id unchanged when `isRuleId` already accepts it (build-core.js:1206). An all-caps id is rewritten to the bare form, so it works by accident.
- **Fix:** use `compositeIdOf(id)` for that lookup, or have `canonical()` drop the prefix from a valid composite id.

### SE-2. A custom or pack tag that starts with "wcag" adds no criteria — low/medium
```js
// repro/r2-wcag-prefixed-custom-tag.js
customRules: [{ id: 'org-chart', meta: { wcagSc: ['1.1.1'], tags: ['wcagteam'] }, runInPage: /* fail */ }]
runDomRulesInPage(url, null, { customRules }, { tags: ['wcagteam'] });
```
- **Observed:** with tag `team`, 1.1.1 is reported as `fail` and `rollupIds` is `['wcag-1.1.1-…']`. With tag `wcagteam`, the check fails but `rulesResults` is `[]` and `rollupIds` is `[]`. `getRulesForRunOnly` also returns `[]`.
- **Expected:** the docs say criteria are added for a rule named "by a tag that is not a WCAG tag (a custom rule's, a pack's or a standard's)". `wcagteam` is not a WCAG tag.
- **Cause:** `ruleNamedOnItsOwn` treats any tag with `t.indexOf('wcag') === 0` as one that names criteria (scripts/build-core.js, `namesCriteria`; src/core.js ~1534).
- **Fix:** test against the real WCAG tags: the keys of `WCAG_LEVEL_TAGS` and `WCAG_SC_BY_TAG`, plus `wcag22-removed`. Alternatively, reject custom tags that start with `wcag`.

### SE-3. An explicitly excluded custom rule is reported as "not selected", and the advice is to name it — low
```js
// repro/r3-excluded-custom-rule-warning.js
runDomRulesInPage(url, null, { customRules: [a, b] }, { includeRuleIds: ['org-a', 'org-b'], excludeRuleIds: ['org-b'] });
```
- **Observed:** `console.warn` says "customRules: not run, since the run's selection does not select them: org-b. To run one, name its id or one of its tags in runOnly." `skippedCustomRules` gets the same reason. The same happens for `rules.exclude`, `excludeTestIds` and excludes in any case.
- **Expected:** a rule the caller excluded on purpose should not be flagged as skipped. If it is reported at all, the reason should be "excluded by …".
- **Cause:** src/core/dom-runner.js:2032 pushes every unselected custom rule without checking `ruleExcludedByRunOnly`. The warning is at dom-runner.js:2531–2555.
- **Fix:** leave out ids that `ruleExcludedByRunOnly(def, runOnly)` excludes, or give them their own reason.

### SE-4. A rule-mapped standard with no rules of its own: its tag is "unknown" yet selects its rollups — low
```js
// repro/r4-standard-tag-only-on-rollups.js — ruleMappedStandard pack mapping only core rules (tag 'probe')
runDomRulesInPage(url, null, { packs: [pack] }, { tags: ['probe'] });             // throws INVALID_RUN_ONLY: no tag named "probe"
runDomRulesInPage(url, null, { packs: [pack] }, { tags: ['probe', 'wcag244'] });  // warns 'no tag named "probe"; ignored.' but reports probe-1.0-P1
```
- **Observed:** `knownSelectionNames` only collects tags from checks, so the standard's tag, which only its rollups carry, counts as unknown. Alone it throws. Beside another tag, the warning says "ignored", but the tag still selects and reports the standard's rollups.
- **Expected:** the docs say the standard's tag selects it. The warning should not say "ignored" for a tag that changed the result.
- **Fix:** add the rollups' tags (opt-in rollup tags at least) to the known tags in `knownSelectionNames` (build-core.js ~1170).

### SE-5. `runOnly.optInTags` is a recognised key that is silently dropped — low
```js
// repro/r5-runonly-optintags-silent.js
runDomRulesInPage(url, null, { packs: [samplePack] }, { optInTags: ['sample'] });
```
- **Observed:** this is a full scan of 134 checks with 0 sample rules and no warning. A misspelt key on its own throws, and that error message lists `optInTags` among the valid keys.
- **Expected:** either it unlocks like `engineOptions.optInRules`, or it is warned about or rejected and points to `engineOptions.optInRules`.
- **Cause:** `RUN_ONLY_KEYS` includes `'optInTags'`, and `resolveEffectiveRunOnly` then sets `selection.optInTags = []` (build-core.js, `RUN_ONLY_KEYS` and `resolveEffectiveRunOnly`).
- **Fix:** take it out of the public key list and the error message, and warn ("use engineOptions.optInRules").

## PLAUSIBLE / minor leads (not clearly bugs)
- **Catalog functions skip option validation.** `getRulesForRunOnly`, `getChecksForRunOnly` and `getRulesCatalog` don't validate options under `strictOptions` (repro/r6). With `wcagLevel: 'AA+'` and strict on, the scan throws `INVALID_ENGINE_OPTIONS`, while `getRulesForRunOnly` lists 1.4.3 and 1.4.6 with no warning. That is a list for a scan that cannot run. An unknown option is also accepted silently. The docs say only "honors it", so this is borderline.
- **Strict validation is inconsistent about whitespace.** Under strict, `wcagLevel: ' aA '` is accepted, but `wcagVersion: '2.1 '` throws, even though both are trimmed and accepted outside strict. `wcagLevel: null` is silently ignored outside strict but throws under strict. `wcagVersion: null` does the same, so it is at least consistent between the two.
- **Kelvin sign matching.** `'linK-name-present'` (KELVIN SIGN) selects `link-name-present`, and a custom rule `org-K` is selected by `org-k`, in every list and in `rules[key]` config. `ſ`, dotless `ı`, `İ` and full-width letters correctly don't match: they throw in include lists and warn in exclude lists. The Kelvin case comes from `String#toLowerCase` and is harmless, but an ASCII-only fold would be stricter.
- **A rollup id in `includeTestIds`.** `{ includeTestIds: ['wcag-2.4.4-…'] }` runs no rule (with a warning) but still reports the rollup, as `cantTell` with every child missing. `excludeTestIds` with a rollup id removes the rollup but leaves its rules.
- **Named rollup vs. tag level.** With an explicit `wcagLevel`, a rollup named by id escapes even a lower level that the selection's own tags imply (`{ includeRuleIds: [R146], tags: ['wcag2a'] }` plus `wcagLevel: 'AA'` reports 1.4.6). The docs sentence "a level the selection's own tags imply still gates a named rollup" reads as if it should still be gated. The wording is ambiguous.

## Improvements (not bugs)
- **Type of `wcagLevel`.** `EngineOptions.wcagLevel` is typed `'A'|'AA'|'AAA'|'a'|'aa'|'aaa'` (src/index.d.ts:84), but the docs say "any case". `'Aa'` works at runtime and fails type-checking.
- **`definePack` and invalid criteria.** It accepts a rule-mapped standard whose 2.2-based version maps a requirement to 4.1.1. The pack is only skipped at scan time ("WCAG 2.2 has no criterion 4.1.1"). `checkPack` or `definePack` could catch it earlier.
- **HTML report grammar.** It says "Partly checked: 1 of 2 checks were not selected". The singular case needs plural handling, in every locale.
- **Error swallowing.** `rollupCompositeResults` wraps everything in `try { … } catch {}` and returns `[]`. An internal error would empty `rulesResults` without a trace. A warning, or `strictOptions` rethrowing, would make such a regression visible.
- **Reusable property test.** The fuzz harness in this directory, which checks catalog-vs-scan parity and outcome invariants, would make a cheap property test in core's suite.
