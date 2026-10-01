# ACME: a second profile to stress the profile model

RGAA is the profile the structure grew around, so it fits by construction. ACME is a made-up "company standard" written to stress that structure: each of its requirements touches something RGAA never needed. The aim is not a useful standard. It is a list of findings: what holds, what breaks, what is awkward, each with a proposed fix.

ACME must never ship. It lives on the `acme-profile-stress-test` branch only (see [Where it lives](#where-it-lives)).

## The standard

**ACME Accessibility Standard (AAS)**, two versions:

| | AAS 1.0 | AAS 2.0 |
|---|---|---|
| Built on | WCAG 2.1 A and AA | WCAG 2.2 A and AA |
| Profiles | `acme-1.0` | `acme-2.0` |
| Messages | English, Spanish | English, Spanish |

### Part A: WCAG, renumbered

`AAS-A.<sc>` restates each WCAG A/AA criterion, as EN 301 549 does (`AAS-A.1.4.3` = WCAG 1.4.3). Its entries derive from a rule's WCAG criteria.

### Part B: ACME's own requirements

| Id | Requirement | How it is checked |
|---|---|---|
| AAS-B1 | Pointer targets are at least 44×44 CSS px (2.0); 24×24 (1.0) | Own rule `acme-target-size`, a stricter, versioned variant of core's `target-size-minimum` |
| AAS-B2 | All text, large text included, reaches 4.5:1 | Own rule `acme-contrast-uniform`, built on `helpers.contrast` |
| AAS-B3 | Every page links to the accessibility statement | Own rule `acme-statement-link`; the accepted link texts and URL pattern come from configuration |
| AAS-B4 | Headings are in order and the page has landmarks | Core's best-practice rules `heading-order` and `region`, mapped by id |
| AAS-B5 | Pages have a skip link | RGAA's opt-in rule `skip-link-present`, mapped by id |
| AAS-B6 | WCAG 3.3.8 does not apply (AAS 2.0 waives it for internal tools) | Core's rule for 3.3.8, `password-paste-enabled`, must not run under `acme-2.0` |

AAS-B gets one rollup per requirement, so B4 groups two core rules and B1 one ACME rule.

## What each part stresses

Each row is a hypothesis to confirm or refute by building it. "Expect" is my guess from reading the code today.

| # | Stress | Exercised by | Expect |
|---|---|---|---|
| 1 | **Creating a profile from scratch.** | `npm run profile:new` | Holds: ACME was created with the scaffold, and its tests and the boundary check pass before anything is filled in. |
| 2 | **Two versions of one profile.** A rule that behaves differently per version (44 vs 24 px). | AAS-B1 | Breaks. A rule cannot tell which profile or version is running it: `ctx` carries neither. Workarounds (two rules, or `ctx.config`) are awkward. |
| 3 | **A stricter variant of a core rule.** | AAS-B1 | Holds, at a cost. A rule cannot call another rule, and the target-size logic is not a helper, so it is copied (as `contrast-minimum-rgaa` copied `contrast-minimum`). |
| 4 | **A variant built only from documented helpers.** | AAS-B2 | Holds. The test that `helpers.contrast` is now fully documented, including `sharedCache`. |
| 5 | **Configuration for a profile.** Link texts and URL pattern differ per company. | AAS-B3 | Partly holds. `engineOptions.rules[ruleId]` reaches the rule as `ctx.config`, but there is no profile-level configuration, no default, and no documented schema. |
| 6 | **Mandatory best-practice rules.** | AAS-B4 | Holds. Mapping them by id makes `mappedRules` select them, as RGAA does for `heading-order`. |
| 7 | **Depending on another profile.** | AAS-B5 | Unclear. Naming `skip-link-present` by id may lift RGAA's opt-in gate, which would silently tie ACME to RGAA. Nothing declares the dependency or checks it. |
| 8 | **Waiving a WCAG criterion.** | AAS-B6 | Breaks. A profile can only add rules (tags plus mapped ids); it cannot exclude one. |
| 8b | **Superseding a core rule.** Under `acme-2.0`, core's `target-size-minimum` (24 px) runs next to `acme-target-size` (44 px), so one small target is reported twice, by two rules with two thresholds. | AAS-B1 | Breaks, same cause as 8: no way to say "this rule replaces that one in this profile". |
| 9 | **A hybrid mapping.** Part A derives entries from WCAG criteria, Part B maps rule by rule. | Parts A and B | Breaks or misreports. `ruleMapped` is one flag per standard, which decides how rollups name entries. ACME needs it per requirement. |
| 10 | **A profile with fewer languages.** | Messages | Holds, noisily. `i18n:sync` seeds de, fr and ja with English, so they count as untranslated forever. Nothing lets a profile declare its locales. |
| 11 | **Two profiles side by side.** | ACME and RGAA together | Mostly holds. Expected checks: `optInRules: 'all'` unlocks both; a WCAG profile runs neither; each report section stays separate; registry order is stable. |
| 12 | **A rule id defined twice.** A negative test: ACME defines a rule id RGAA already has. | Build | Breaks silently. The build rejects duplicate rollup ids but not duplicate rule ids across rule folders. |
| 13 | **A dictionary key defined twice.** A negative test. | Build | Holds. `scripts/lib/dictionaries.js` refuses it. |
| 14 | **The boundary check on a second profile.** | Everything | Holds, or shows which rules in the contract were written with RGAA in mind. |

## Where it lives

In `profiles/acme/`, created with `npm run profile:new -- acme --name ACME`, like any profile. It is never merged: it would be built into the engine and shipped. What it leads to (the scaffold, fixes to core, documentation) is committed separately and can go to `working-progress` without it.

Profiles stay in this repository for now, organized so that one could move out later. ACME tests that organization; whether profiles are later published separately (a profile package added at run time, or a package built on top of core) is a later decision, which these findings feed.

## Plan

One stress point per step, each recording its finding below:

1. The scaffold, `npm run profile:new` (foundation). Done.
2. ACME's entry and Part A, two versions. Done: stress points 1, 9, 11 and 14.
3. AAS-B4 and B5: mapped core and RGAA rules (6, 7). Done.
4. AAS-B2: the contrast variant (4). Measured rather than built: see F8.
5. AAS-B1: the versioned target-size variant (2, 3, 8b). Waits on F8.
6. AAS-B3: the configurable statement link (5), with a version difference (2). Done.
7. AAS-B6: the waiver (8).
8. Messages in two languages (10), and the negative tests (12, 13).

Each step either fixes what it finds in core, when the fix is small and clearly right, or records it with a proposed fix to decide.

## Findings

| # | Finding | Severity | Proposed fix | Status |
|---|---|---|---|---|
| F1 | A profile's own files may not require core, so a standard that restates WCAG cannot read WCAG's criteria at run time. EN 301 549 never hit this: it lives inside core. ACME generates its own copy (`scripts/generate-part-a.js`, which may read core's tables) and commits it, as RGAA does with its source data. | Low | Accept the generated copy as the pattern, or publish WCAG's criteria as an entry point (`@surea11y/core/wcag`) that a profile's files may require. | Open |
| F2 | Core's WCAG table describes WCAG 2.2 only: 4.1.1 has no level and is titled "Parsing (Obsolete and removed)". A standard built on 2.1 must special-case it (the generator does; RGAA's test excludes only AAA, which keeps it by accident). | Low | Give the table each criterion's level and title per WCAG version, or a `criteriaOf(wcagVersion)` that both RGAA and ACME use. | Open |
| F3 | `ruleMapped` is one flag per standard. ACME needs it for Part B, so on a `notApplicable` WCAG rollup its Part A requirement is not named, while EN 301 549, which restates WCAG the same way, names its clause. On a failing or passing rollup both agree. Pinned by a test in `tests/part-a.test.js`. | Medium: a report shows ACME and EN differently for the same thing | Decide per requirement, not per standard. Either (a) an entry field, such as `restatesCriterion: true`, which the runner keeps whatever decided (an additive field in results), or (b) a registry field naming which requirements are rule-mapped, such as a list of prefixes, embedded as data in the generated core. (b) changes no result shape. | Open, to decide |
| F4 | The scaffold's mapping (`requirements.js`, `rule-map.js`, `mappings.js`) is a copy each profile carries, so a fix to it reaches no existing profile, and RGAA has its own, richer one. | Medium, grows with each profile | Once a third profile needs it, publish the mapping code as a library profiles may require (`@surea11y/core/profile-kit`), and have RGAA and new profiles use it. | Open |
| F5 | Mapping another profile's opt-in rule in a profile's table is enough to run it under that profile: `acme-2.0` runs RGAA's `skip-link-present`. ACME now depends on RGAA, and nothing declares it. The build's table check would fail if RGAA went, but nothing says why, and the boundary check does not see it. Pinned by a test in `tests/part-b-mapped.test.js`. | Medium: a hidden coupling between two separable profiles | Either forbid it (a profile maps only core's rules and its own; the boundary check enforces it, and a rule both need moves to core), or declare it (`dependsOn: ['rgaa']` in the entry, checked by the build and the boundary check). The first keeps profiles independent, which is the point of the structure. | Open, to decide |
| F6 | A profile ran its standard's rollups for every version, not its own: under `acme-2.0` both `acme-1.0-B4` and `acme-2.0-B4` came out, since one tag selects them all. RGAA has one version, so it never showed. | High: wrong results under a two-version standard | The build embeds each profile's target (standard and version); under a standard's profile, the runner and the rule catalog keep that standard's rollups of the profile's version only. Other standards' rollups, and `optInRules`, are unchanged. | Fixed |
| F7 | Core's registry test required every entry to name a WCAG criterion, while the scaffold lets a requirement name none, as ACME's B4 does. A company's or a country's standard can make requirements WCAG does not. Behind it, JUnit dropped such an entry when the rule naming it had WCAG criteria: an empty list matched no criterion's suite. | Medium: silently missing from JUnit | An entry may have an empty `wcagSc` (ENTRY SHAPE says so); the test still requires what it lists to be real criteria; JUnit treats an empty list like a missing one and keeps the entry under every criterion of its rule, with a regression test. | Fixed |
| F8 | A variant of a core rule is a full copy. RGAA's `contrast-minimum-rgaa` is 569 lines against `contrast-minimum`'s 567, for about 3 lines of different logic (the bold-text threshold); the rest is the same code, which already drifted (a dead `helpers.computedStyle` branch removed from one copy only). ACME's B2 (4.5:1 for all text) and B1 (44 px targets) would each be another copy. A fix in core reaches none of the copies. | High: grows with every standard, and copies drift | Make the measuring logic reusable, in one of two ways. (a) A documented helper per family, for example `helpers.contrast.evaluateText({ largeTextRatio, boldLargeMinPx })` returning occurrences, which core's contrast rules and every variant call; a variant is then a short rule. (b) Derived rules as data: a profile declares `{ id: 'acme-contrast-uniform', from: 'contrast-minimum', config: { largeTextRatio: 4.5 } }`, and the core rule reads its thresholds from `ctx.config`; a variant then has no code at all. (b) is smaller for profile authors and needs core rules to declare which settings they accept. | Open, to decide. Steps 4 and 5 wait on it. |
| F9 | A rule cannot tell which version of its standard a run targets: `ctx` carries no standard or version. `acme-statement-link` reads `engineOptions.profile`, so its 2.0 footer requirement applies only when the run names `acme-2.0`; selected by tag or `optInRules`, it behaves as 1.0. A rule runs once per scan, so a run producing both versions' rollups gives them the same verdict. Tools that replay scenario pages without a profile (the fixture-marker record) see the 1.0 behaviour: one recorded disagreement. Pinned by tests. | High for any standard whose versions differ in a rule, which most do over time | Pass the target to the rule: `ctx.standard = { key, version }` when a standard's profile selected the run, documented in the rule contract. For a run that wants several versions at once, a rule whose behaviour differs by version declares it (`meta.versions`) and runs once per version. The first is small; the second is what makes multi-version runs right. | Open, to decide |
| F10 | Core's generated docs and records list every rule, a profile's included: a profile's rule changes `docs/RULE_CATALOG.md`, `docs/RULE_EXAMPLES.md` (or its gap baseline), the coverage report, the fixture index, the fixture-marker record and `scripts/data/finding-ids.json`, all core files, and even RGAA's `docs/RGAA_MAPPING.md`, which lists every rule in the engine. RGAA's 69 rules are spread through them too. Extracting a profile means splitting each. | Medium: the main obstacle to moving a profile out | Generators write per profile: core's docs list core's rules, and each profile gets its own catalog, examples and records under its folder (`profiles/<key>/docs/`), from the same generators run once per rules folder. | Open |
| F11 | A profile cannot choose its languages. ACME is in English and Spanish, but `i18n:sync` seeds German, French and Japanese with English, and `i18n:report` counts them untranslated (7 each) forever. | Low | Let a profile list its locales (`locales: ['en', 'es']` in its entry, or its i18n folder's files as the list); sync and the report then cover only those, and the engine falls back to English for the rest, as it does for a missing key. | Open |
| F12 | Core's own tests assumed RGAA is the only standard with opt-in rules: `optInRules: 'all'` had to unlock exactly `['rgaa']`, in the opt-in and JUnit tests, as the profile:new test assumed the list of profiles. Any second profile with rules broke them. | Medium: blocks adding any profile | Core's tests derive what they expect from the registry (every registered rule tag) and check RGAA's part only where they mean RGAA. Done for the three tests found; the boundary check could also run core's suite with a stand-in extra profile to catch new ones. | Fixed for the tests found |
