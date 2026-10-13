# Criteria for the checks a scan selects

A design note, in the form of an entry in [`DESIGN_CHALLENGES.md`](./DESIGN_CHALLENGES.md): the decision as it stands, why it is questioned, what changes, and what was decided. Once the change ships, the entry moves to that file's Decided section and this file goes.

## Decision as it stands (1.11.1)

A criterion's rollup (`rulesResults`) is reported only when the selection itself selects the rollup. `rollupCompositeResults` (`src/core/dom-runner.js`) runs every composite through `ruleMatchesRunOnly`, the level gate and `rollupInProfileVersion`. A rollup passes when:

- a WCAG target (`runOnly.wcag`) or a version/level tag (`wcag2aa`) includes its criterion,
- a profile's tags or its standard's own tag select it, or
- its own id is included.

A criterion tag (`wcag244`) is not among them: no rollup carries one, so `tags: ['wcag244']` runs the checks of 2.4.4 and reports no criterion either. A selection that names atomic checks gets none of these. `runOnly: { includeRuleIds: ['link-name-present'] }` on a page with an unnamed link returns:

```
checksResults: link-name-present: fail, rollupIds: []
rulesResults:  []
```

`link-name-present` belongs to `wcag-2.4.4-link-purpose-in-context` and `wcag-4.1.2-name`, and the scan reports neither. A tool that reports by criterion shows nothing for this scan. The same holds for:

- a pack checklist profile that picks rules by id (`'city-quick': { tags: [], rules: [...] }` in `ENGINE_OPTIONS.md`),
- `engineOptions.rules.include`, and
- a binding that turns its own tags into rule ids.

## Why it's questioned

The scan ran a check that tests a criterion and found a failure, but the result says nothing about that criterion. `rollupIds: []` tells the reader that "the findings appear in no rollup". That is true of the result, but it is not true of the rule. Nothing about the verdict is in doubt: core already has the right one for a criterion only some of whose checks ran.

**The counter-argument:** a rollup over a subset of its checks could read as a judgement of the whole criterion. It cannot pass, though. With any member not run, the existing precedence gives `cantTell`, which is the "partly checked" a reader needs. Only a failing check can make it `fail`, and a failure of one part is a failure of the criterion. So the rollup never claims more than the checks that ran.

## The change

### Reporting rule

After the rollups the selection selects, core adds the rollup of every criterion that at least one check **named on its own** that ran belongs to (decision 8). A check is named on its own when the selection names it:

- by its id (`includeRuleIds`, `includeTestIds`, `rules.include`, or a profile's rule list),
- by a tag that is not a WCAG tag (a custom rule's, a pack's, a standard's),
- by `optInRules` or a standard profile's own tag, or
- as a best-practice rule.

A check brought in by a criterion tag is named for that criterion only. A check brought in by a rollup's id, a WCAG target, a version or level tag, or a WCAG profile adds no criterion, because the selection names its criteria there. "Belongs to" uses the existing member lists, so the added rollups pick up:

- `rollupMembers`, so custom rules mapped to the criterion count,
- pack rules and pack variants that are listed in or mapped to the rollup, and
- overrides, which leave a rollup they no longer map to.

A rollup is added when all of these hold:

1. The selection did not already select it (so nothing is added twice, and nothing already reported changes).
2. One of its members named on its own is in `checksResults`.
3. The selection's excludes don't block it. That covers `excludeRuleIds` and `excludeTags`, and a profile's `rollupIds` exclusions, applied as `ruleMatchesRunOnly` applies them to the rollup today.
4. It passes the WCAG gates (below), if it is a WCAG rollup, or the standard gate (below), if it is a standard's own.

The verdict is `rollupCompositeResults`' as it is: any `fail` gives `fail`; else any `cantTell` gives `cantTell`; else any member that did not run gives `cantTell`, listed among the contributors as `missing`. The member order, metrics, severity, `customChecksIds` and the "deciding rules" filter on rule-mapped standards' `normativeMappings` all stay as they are. The only differences are the reason code and the contributor flag described below.

`rollupIds` on each check then names the added rollups, as it names every rollup that groups the check in the run. That is the one field of `checksResults` that changes, and it changes because `rulesResults` does.

Unchanged by construction: a scan that selects its criteria (a WCAG target or level tags, a profile selecting by tags, a named rollup, a full scan, `bestPractices` alone) has no check named on its own outside the criteria it selects, so nothing is added. A test holds that for each of these, and the results of 92 such scans (core and the sample standard) were compared byte for byte before and after the change. The only scans whose results change are those the gap is about: checks named on their own, and criterion tags.

### Standards, profiles and packs, built in or external

A standard's own rollups (`meta.standard` set: one per requirement, grouping several rules) follow the same rule, and are added only when their standard is **in play**. That means either:

- the scan's applied profile targets that standard (`PROFILE_TARGETS`, for a built-in profile under `profiles/` or a pack's standard or checklist alike), or
- its rule tag is in the selection: among `tags` or `ownTags`, or unlocked by `optInRules`.

So a WCAG scan never shows the requirements of a standard nobody asked for, even when one of the standard's rules (a core rule it maps) ran. `rollupInProfileVersion` still keeps them to the profile's version.

External profiles (a pack's standard or checklist, or a profile registered in `profiles/`) reach the scan only through the catalog tables a pack engine is prepared with: `COMPOSITE_RULES`, `PROFILE_TARGETS`, `OPT_IN_OWNED`, `PROFILE_EXCLUDES` and `RULE_MAPPED_STANDARDS`. The new code reads only those tables, never a built-in list. A pack's profile therefore gets the behaviour in Node and in a page through `packScript` alike, and the sample profile (`tests/fixtures/profiles/sample/`) and a pack checklist are where the tests exercise it.

A checklist profile that selects rules by id (`tags: []` with `rules`) is the main external case the fix serves. It gets its WCAG criteria, gated by its `wcagVersion` when it names one, and its own items, since its standard is the profile's.

**Profile exclusions.** An excluded rule does not run, so it never causes a rollup to be added. A rollup whose criterion the profile waives is in its `rollupIds` exclusions and is never added. When a member of an added rollup is not run because the profile excludes it, it is reported `missing` as today. It is not reported as "not selected", so a criterion the profile narrows reads as narrowed, not as partly checked.

### Gates

- **WCAG version.** A WCAG rollup is added only if one of its criteria is in force in the run's version, `engine.wcagVersion`. That is `engineOptions.wcagVersion` when given, else the pack profile's `wcagVersion`, else the version the tags imply, else 2.2: the order the run already resolves. So `duplicate-id` alone under 2.2 adds no 4.1.1 rollup, and `target-size-minimum` under 2.1 adds no 2.5.8. Membership is `criterionInWcagTarget`, as `runOnly.wcag` uses it.
- **WCAG level.** When the selection gives a level (`runOnly.wcag.level`, or the level a version tag implies through `inferTargetLevelFromRunOnly`), a rollup above it is not added, as a target would leave it out. With no level given, every level is allowed.
- **Standard's rollups.** They have no WCAG level and are gated by "in play" above. A WCAG version only gates them through the profile's version.

### Reason code for "partly checked"

A new rollup reason code: **`composite.rollup.cantTell.notSelectedChild`**. It is used on an added rollup whose outcome comes from members that did not run, when at least one of those was not selected. "Not selected" means the selection does not select the member and no profile exclusion names it. If every missing member is missing for another reason (a skipped custom rule, a profile exclusion), the reason code stays `missingChild`.

Each such contributor keeps `outcome: "missing"`, so existing readers count it as they do today, and gains `notSelected: true`. Precedence is unchanged: any `fail` is `anyFail`, and any `cantTell` is `anyCantTell`. The only difference from today is the name of the cause when gaps alone decide.

Wording, translated in every shipped locale (`en`, `de`, `es`, `fr`, `ja`):

- the HTML report's rollup row: "Partly checked: {{count}} of {{total}} checks were not selected for this scan" (`report_rollup_notSelected`), beside the metrics breakdown, and
- `composite_rollup_summary` keeps interpolating the code, as it does for every rollup code.

Rollup reason codes are not translated today: `composite_rollup_summary` shows the raw code, and the report shows metrics, not the code. This case gets a translated report string, and machines get the stable code (decision 4).

### Catalog

A caller recording what a scan checks must get the same answer as the scan. `getChecksForRunOnly` already lists the checks, and they don't change. For rollups:

- **`getRulesForRunOnly` does not exist today.** `getRulesCatalog(engineOptions)` takes no `runOnly`, and lists every non-opt-in rollup whatever the selection, so it already disagrees with a scan that selects anything.
- A new `getRulesForRunOnly(runOnly, engineOptions)` lists exactly the rollups a scan with that selection reports, selected and added. It shares the selection-and-gate function with `rollupCompositeResults`, so they cannot drift apart. A test compares its ids with `rulesResults` across the cases below.
- `getRulesCatalog` keeps its meaning (every rollup the options make available).

### Exports

- **SARIF, EARL:** they read `checksResults` (outcomes and occurrences), never `rulesResults`, so they need nothing. Their output does not change.
- **JUnit:** suites are by criterion from the checks. The criterion's title and outcome come from `criterionOf(rulesResults)`, the worst of its composites. An added rollup reaches it like any other, and a partly checked one is `cantTell`, which JUnit reads as `cantTell`. A test asserts that for the link example.
- **HTML report:** it shows added rollups in its WCAG and standard tables like any other, and the "partly checked" line above.

## Tests

- **WCAG criteria:** `includeRuleIds: ['link-name-present']` gives 2.4.4 and 4.1.2-name as `fail` with `anyFail`. A passing check alone gives `cantTell` with `notSelectedChild`, and the contributors are flagged.
- **A pack's requirements under its profile:** an id-only checklist profile gets its items and its WCAG criteria. The sample standard's requirements are added under its profile, or with its tag unlocked, and not under a WCAG scan that ran a core rule it maps. Its version is the profile's.
- **Custom rules and variants:** a custom rule mapped to a criterion adds that criterion's rollup when selected alone. A pack variant counts in its base's rollup. An override that leaves a rollup does not add it.
- **Gates:** `duplicate-id` alone adds no 4.1.1 under 2.2 and adds it under `wcagVersion: '2.1'`. Level A tags beside a rule id do not add an AA criterion.
- **Profile exclusions:** an excluded rule's rollup is never added, and an excluded member reads `missing`, without the `notSelected` flag.
- **Unchanged scans:** a WCAG target, level tags, `wcag22-aa` and EN 301 549 profiles, a named rollup, a full scan and `bestPractices` give byte-identical `rulesResults` and `rollupIds` before and after. This is checked against results recorded from the current engine.
- **Rule list:** `getRulesForRunOnly` matches `rulesResults` for every case above.

Docs: `ENGINE_OPTIONS.md` (the selection section, and the custom rules, packs and profile paragraphs that say when a rollup is reported) and `OUTPUT_SCHEMA.md` (`rulesResults`, `rollupIds`, the contributor flag, the reason code, the worked example, whose `rulesResults: []` changes). `CHANGELOG.md` gets an entry under Unreleased > Fixed for the criteria, and one under Added for `getRulesForRunOnly`.

## Decisions

The questions the first draft left open, as decided:

1. **Catalog API:** add `getRulesForRunOnly(runOnly, engineOptions)`, the rollups twin of `getChecksForRunOnly`. It shares the selection-and-gate code with the scan. `getRulesCatalog` keeps its meaning.
2. **Release:** 1.12.0, with the rest of Unreleased. The new export, reason code and flag are additive, which the semver policy puts in a minor, and Unreleased already holds an Added entry. The missing criteria go under Unreleased > Fixed, and `getRulesForRunOnly` under Added.
3. **Name and shape:** the code is `composite.rollup.cantTell.notSelectedChild`, the counterpart of `missingChild`. Contributors keep `outcome: "missing"` and gain `notSelected: true`. There is no new metric: a `notSelectedCount` would be a subset of `missingCount`, and a reader adding up the metrics would count those checks twice.
4. **Translations:** only the new report line, `report_rollup_notSelected`, in every shipped locale. The other rollup codes stay as they are, so no existing result or report changes. Translating them all is a change of its own.
5. **Caller excludes:** a member the caller excluded (`excludeRuleIds`, `excludeTestIds`, `excludeTags`) is not selected. Only a profile's exclusions read as `missing`. In a rollup the selection already selects, an excluded member stays `missingChild`, as today.
6. **Standard in play:** a requested profile that did not apply (overridden by an include, so no `engine.profile`) does not put its standard in play, and `mappings` alone does not either, since it changes only what results name.
7. **Several versions without a profile:** a standard in play through its tag or `optInRules` gets the added requirements of every version, as tag-selected and unlock-all scans list them today. A profile picks one version.
8. **A check that belongs to two criteria, brought in by one of them:** only checks named on their own add criteria. A named rollup's checks add no other criterion, so naming `wcag-2.4.4-link-purpose-in-context` doesn't also report 4.1.2, although `link-name-present` checks both. A criterion tag (`wcag244`) names its checks for that criterion: it now reports 2.4.4, which no rollup carried before, and not 4.1.2.

## Follow-up: a level for a scan that names checks (`engineOptions.wcagLevel`)

### The gap

The criteria added for checks a scan names are gated by a level only when the selection gives one (`runOnly.wcag.level`, or the level its version/level tags imply). A caller that runs only some checks of what it means as a WCAG 2.2 AA scan sends the rule ids, with `engineOptions.wcagVersion` for the version, and so gives no level. `includeRuleIds: ['contrast-computable']` then reports 1.4.6 Contrast (Enhanced), AAA, as partly checked beside 1.4.3, because `contrast-computable` checks both.

A WCAG target can't give the level: beside `runOnly.wcag`, included rules and tags are added to the target's rules, so the scan would run every AA rule. Version/level tags beside the rule ids can, since the default `includeMode: 'and'` intersects them: `{ includeRuleIds: ['contrast-computable'], tags: wcagTags('2.2') }` runs only `contrast-computable` and reports 1.4.3 alone. That workaround falls short in three ways:

- A named rule with no WCAG tag (a best-practice rule such as `region`, a custom rule without WCAG tags) is silently left out of the run.
- A named rule that checks only AAA criteria is left out of the run, when the caller wanted it run and only its criteria left out.
- It logs a `console.info` for each version/level tag with no rules (`wcag22a`).

### The option

`engineOptions.wcagLevel`: `'A'`, `'AA'` or `'AAA'`, in any case. It is the level counterpart of `engineOptions.wcagVersion`:

- **It gates reporting, never what runs.** The selection decides what runs, as today. A check named on its own above the level still runs and reports its own result; only its criteria above the level are not added.
- **It applies to every WCAG rollup the level gate applies to today**, not only the added ones. `wcagLevel: 'AA'` on a full scan, a profile or a tag selection leaves the AAA criteria out of `rulesResults`, while their checks still run and report. This differs from `wcagVersion`, which never removes a rollup the selection selects: a 2.2 scan still reports 4.1.1, its rules coerced to `cantTell`.
- **Unchanged without it.** A scan without the option reports exactly what it reports now.
- **Validation as for `wcagVersion`.** Another value is ignored with a `console.warn` naming the level the run uses, and throws under `strictOptions`.
- **Everywhere the options go.** `getRulesForRunOnly` honors it, in Node, with packs and in the page.
- **A standard's own rollups** have no WCAG level and are not gated by it, as today.

### Decisions

9. **Precedence and conflicts.** An explicit `wcagLevel` wins over the level the selection implies (`runOnly.wcag.level`, version/level tags), as an explicit `wcagVersion` wins over the version they imply. A conflict doesn't warn: an explicit `wcagVersion` that differs from a `runOnly.wcag` target's version doesn't warn either, and `engine.wcagLevel` shows the level the criteria were gated by. A warning would also fire on every scan of a tool that sets the level once and lets its users pick tag sets. (The alternative, warning only when `runOnly.wcag.level` differs, is easy to add later if callers trip over it.)
10. **A rollup named by id** (`includeRuleIds: ['wcag-1.4.6-contrast-enhanced']` with `wcagLevel: 'AA'`) is reported as named: the caller asked for it explicitly, and the option says which criteria to add or keep, not to drop one the caller named. This differs from a level the selection's own tags imply, which gates a named rollup today and still does when `wcagLevel` is not given. A rollup brought in by a profile's rule list is named the same way.
11. **Recording.** `engine.wcagLevel` is present only when the option is given and valid, in its canonical spelling (`'AA'`), next to `engine.wcagVersion`. A level the selection implies is not recorded: it is in the selection the caller sent, and recording it would add a field to every scan with a WCAG target or level tags, which must stay unchanged. Unlike the version, a run has no level unless one is asked for.
12. **Pack profiles** don't give a level. A profile's tags already imply one, and a checklist profile that lists its rules can be given `wcagLevel` by its caller. A profile `wcagLevel` can be added later, as `wcagVersion` was, if a pack needs one.

The CHANGELOG entry goes under Unreleased > Added, beside `getRulesForRunOnly`: it is a new engine option, in the same 1.12.0.

## Found along the way

A profile that waives a criterion (`exclude: { criteria: ['2.4.4'] }`) puts the criterion's rollup id among the selection's `excludeRuleIds`. An excluded rollup id excludes every rule of the rollup, so `link-name-present`, which also checks 4.1.2, doesn't run under that profile. `PACKS.md` and `src/coverage/standards.js` say a rule that also checks a criterion the profile keeps still runs. This predates the change and is left for a fix of its own.
