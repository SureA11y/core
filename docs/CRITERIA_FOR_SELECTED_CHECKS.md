# Criteria for the checks a scan selects

A design note, in the form of an entry in [`DESIGN_CHALLENGES.md`](./DESIGN_CHALLENGES.md): the decision as it stands, why it is questioned, what changes, and what is still open. Once the change ships, the entry moves to that file's Decided section and this file goes.

## Decision as it stands (1.11.1)

A criterion's rollup (`rulesResults`) is reported only when the selection itself selects the rollup. `rollupCompositeResults` (`src/core/dom-runner.js`) runs every composite through `ruleMatchesRunOnly`, the level gate and `rollupInProfileVersion`. A rollup passes when:

- a WCAG target (`runOnly.wcag`) or a version/level tag (`wcag2aa`) includes its criterion,
- a profile's tags or its standard's own tag select it,
- a criterion tag selects it (`wcag244`), or
- its own id is included.

A selection that names atomic checks gets none of these. `runOnly: { includeRuleIds: ['link-name-present'] }` on a page with an unnamed link returns:

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

After the rollups the selection selects, core adds the rollup of every criterion that at least one check that ran belongs to. "Belongs to" uses the existing member lists, so the added rollups pick up:

- `rollupMembers`, so custom rules mapped to the criterion count,
- pack rules and pack variants that are listed in or mapped to the rollup, and
- overrides, which leave a rollup they no longer map to.

A rollup is added when all of these hold:

1. The selection did not already select it (so nothing is added twice, and nothing already reported changes).
2. One of its members is in `checksResults`.
3. The selection's excludes don't block it. That covers `excludeRuleIds` and `excludeTags`, and a profile's `rollupIds` exclusions, applied as `ruleMatchesRunOnly` applies them to the rollup today.
4. It passes the WCAG gates (below), if it is a WCAG rollup, or the standard gate (below), if it is a standard's own.

The verdict is `rollupCompositeResults`' as it is: any `fail` gives `fail`; else any `cantTell` gives `cantTell`; else any member that did not run gives `cantTell`, listed among the contributors as `missing`. The member order, metrics, severity, `customChecksIds` and the "deciding rules" filter on rule-mapped standards' `normativeMappings` all stay as they are. The only differences are the reason code and the contributor flag described below.

`rollupIds` on each check then names the added rollups, as it names every rollup that groups the check in the run. That is the one field of `checksResults` that changes, and it changes because `rulesResults` does.

Unchanged by construction: a scan that selects its criteria (a WCAG target or level tags, a profile selecting by tags, a criterion tag, a named rollup, a full scan, `bestPractices` alone) has every rollup of every check it ran already selected, so nothing is added. A test holds that for each of these.

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

A new rollup reason code: **`composite.rollup.cantTell.notSelected`**. It is used on an added rollup whose outcome comes from members that did not run, when at least one of those was not selected. "Not selected" means the selection does not select the member and no profile exclusion names it. If every missing member is missing for another reason (a skipped custom rule, a profile exclusion), the reason code stays `missingChild`.

Each such contributor keeps `outcome: "missing"`, so existing readers count it as they do today, and gains `notSelected: true`. Precedence is unchanged: any `fail` is `anyFail`, and any `cantTell` is `anyCantTell`. The only difference from today is the name of the cause when gaps alone decide.

Wording, translated in every shipped locale (`en`, `de`, `es`, `fr`, `ja`):

- the HTML report's rollup row: "Partly checked: {{count}} of {{total}} checks were not selected for this scan" (`report_rollup_notSelected`), beside the metrics breakdown, and
- `composite_rollup_summary` keeps interpolating the code, as it does for every rollup code.

Note that rollup reason codes are **not** translated today: `composite_rollup_summary` shows the raw code, and the report shows metrics, not the code. So "as the existing reason codes are" has no precedent here. The proposal is a translated report string for this case, plus the stable code for machines (see the open questions).

### Catalog

A caller recording what a scan checks must get the same answer as the scan. `getChecksForRunOnly` already lists the checks, and they don't change. For rollups:

- **`getRulesForRunOnly` does not exist today.** `getRulesCatalog(engineOptions)` takes no `runOnly`, and lists every non-opt-in rollup whatever the selection, so it already disagrees with a scan that selects anything.
- The proposal is a new `getRulesForRunOnly(runOnly, engineOptions)` that lists exactly the rollups a scan with that selection reports, selected and added. It shares the selection-and-gate function with `rollupCompositeResults`, so they cannot drift apart. A test compares its ids with `rulesResults` across the cases below.
- `getRulesCatalog` keeps its meaning (every rollup the options make available).

### Exports

- **SARIF, EARL:** they read `checksResults` (outcomes and occurrences), never `rulesResults`, so they need nothing. Their output does not change.
- **JUnit:** suites are by criterion from the checks. The criterion's title and outcome come from `criterionOf(rulesResults)`, the worst of its composites. An added rollup reaches it like any other, and a partly checked one is `cantTell`, which JUnit reads as `cantTell`. A test asserts that for the link example.
- **HTML report:** it shows added rollups in its WCAG and standard tables like any other, and the "partly checked" line above.

## Tests

- **WCAG criteria:** `includeRuleIds: ['link-name-present']` gives 2.4.4 and 4.1.2-name as `fail` with `anyFail`. A passing check alone gives `cantTell` with `notSelected`, and the contributors are flagged.
- **A pack's requirements under its profile:** an id-only checklist profile gets its items and its WCAG criteria. The sample standard's requirements are added under its profile, or with its tag unlocked, and not under a WCAG scan that ran a core rule it maps. Its version is the profile's.
- **Custom rules and variants:** a custom rule mapped to a criterion adds that criterion's rollup when selected alone. A pack variant counts in its base's rollup. An override that leaves a rollup does not add it.
- **Gates:** `duplicate-id` alone adds no 4.1.1 under 2.2 and adds it under `wcagVersion: '2.1'`. Level A tags beside a rule id do not add an AA criterion.
- **Profile exclusions:** an excluded rule's rollup is never added, and an excluded member reads `missing`, not `notSelected`.
- **Unchanged scans:** a WCAG target, level tags, `wcag22-aa` and EN 301 549 profiles, a named rollup, a full scan and `bestPractices` give byte-identical `rulesResults` and `rollupIds` before and after. This is checked against results recorded from the current engine.
- **Rule list:** `getRulesForRunOnly` matches `rulesResults` for every case above.

Docs: `ENGINE_OPTIONS.md` (the selection section, and the custom rules, packs and profile paragraphs that say when a rollup is reported) and `OUTPUT_SCHEMA.md` (`rulesResults`, `rollupIds`, the contributor flag, the reason code, the worked example, whose `rulesResults: []` changes). A `CHANGELOG.md` entry goes under Unreleased > Fixed.

## Open questions

1. **Catalog API.** Adding `getRulesForRunOnly` is a new export, which `API_STABILITY.md` puts in a minor. Options:
   - (a) add it anyway, as part of the fix,
   - (b) give `getRulesCatalog` an optional second `runOnly` argument (also additive), or
   - (c) leave the catalog alone in this patch and add the function in 1.12.

   I'd take (a): requirement 5 can't be met otherwise.
2. **Release.** Unreleased already holds an **Added** entry (a pack profile's `wcagVersion`). With it, the next release is by this repository's policy a minor, not 1.11.2. Should this fix ship alone as 1.11.2 (cut from `v1.11.1`), or go out with that change?
3. **Reason code name and shape.** `notSelected` (proposed) or `partlyChecked`? And do you want a contributor flag (`notSelected: true`, proposed) plus a `metrics.notSelectedCount`, or the flag only?
4. **Translating reason codes.** Should all rollup reason codes get translated labels (`composite_rollup_reason.*`), or only the new "partly checked" line (proposed)?
5. **Caller excludes.** A member the caller excluded (`excludeRuleIds`) is "not selected" under this proposal. Only a profile's exclusions read as `missing`. Agree?
6. **A requested profile that did not apply** (overridden by an include) does not put its standard in play, since `engine.profile` is absent. `mappings: [<key>]` alone doesn't either: it names requirements and changes nothing else. Agree?
7. **Opt-in unlocked with no profile:** a standard with two versions gets the added rollups of both versions, as an unlock-all scan lists both today. Keep it that way?
