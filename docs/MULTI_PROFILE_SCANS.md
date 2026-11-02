# Multi-profile scans and WAI-ARIA as a pack (proposal)

**Status:** §1, §2 and §4 are built in core for 1.15, §3 in `@surea11y/pack-wai-aria`; the WAI-ARIA inventory and its new rules ([§1](#1-wai-aria-leaves-core)) are still to come. What changed from the proposal while building it is said in each section.

It covers four changes that depend on each other:

1. [WAI-ARIA leaves core](#1-wai-aria-leaves-core): the opt-in verdicts of #345 come out; the ARIA rules stay.
2. [A pack can make a finding a failure](#2-a-pack-can-make-a-finding-a-failure): `outcome: 'fail'` in a rule map row.
3. [`@surea11y/pack-wai-aria`](#3-surea11ypack-wai-aria): WAI-ARIA 1.2 as a standard, like EN 301 549.
4. [Multi-profile scans](#4-multi-profile-scans): one scan, several profiles, WCAG among them or not.

None of it is a breaking change ([below](#no-breaking-changes)). [Order of work](#order-of-work) is at the end.

## No breaking changes

Everything here ships in minor releases. A scan, a pack or a reporter written against 1.14 gives the same result after it:

- **Removing the WAI-ARIA opt-in** removes nothing released: #345 is under `[Unreleased]` (1.14.2 is the latest release), so it leaves before 1.15 ships it.
- **`outcome: 'fail'`** is a new value a rule map row may use. A pack that uses it asks for `core: '^1.15.0'`; a pack that doesn't is judged as before.
- **Multi-profile scans** are asked for by a list, which no scan passes today. `profile: 'wcag22-aa'` gives exactly today's result: the same `outcome`s, rollups, `engine.profile` and gates. Only a list gets the new fields (`engine.profiles`, `engine.profilesNotRun`, the per-profile sections), and in a list's result `engine.profile` is still a string, the first profile listed, so code that reads it keeps working.
- **The rules core adds** come in minors, as rules do now, each with its own reason codes. The WAI-ARIA-only cases go in the pack, so a WCAG scan gains no findings for them.
- **Pack ids** keep today's rule: a pack's ids start with its namespace, and two packs in one scan can't share one (the first by name runs, the other is skipped), so two profiles can't have the same id.

## Why

A rule's WCAG outcome and its WAI-ARIA outcome can differ. An unnamed `role="grid"` breaks WAI-ARIA for certain ("Accessible Name Required: True"), but whether it fails 4.1.2 depends on what the page shows, so WCAG's answer is `cantTell` ([DESIGN_CHALLENGES.md](./DESIGN_CHALLENGES.md#eight-rules-reported-a-wcag-failure-where-only-wai-aria-was-broken-now-graded-case-by-case)). #345 answered that with a second verdict per finding, opt-in, with WAI-ARIA's requirements written into core.

That makes WAI-ARIA a special case inside core, where every other standard (EN 301 549, Section 508, a policy) is a profile, from core or from a pack. It also leaves no way to evaluate WAI-ARIA alone, or WAI-ARIA beside a pack's standard, and it gives WAI-ARIA rollups that read `pass` on a part of the rules: under a pack profile that runs `link-name-present` only, `wai-aria-name-required` passed, from one of the twenty or so rules that check it.

Treated as a standard of its own, in a pack, WAI-ARIA needs nothing special: the pack mechanism already judges core's findings by reason code, and already reads a requirement whose rules did not all run as `cantTell` (`missingCount`, `partial`). What is missing is running more than one standard at once, which is worth having for every standard, not only this one.

## 1. WAI-ARIA leaves core

**Removed** (unreleased, so no one depends on it):

- `engineOptions.verdicts`, and `engine.verdicts` in the result;
- `meta.verdicts` on the 30 rules, and its validation in `definePack`;
- `VERDICT_STANDARDS` and the eight `wai-aria-*` rollups;
- `failOnVerdicts` in SARIF and JUnit, the EARL assertion per standard, the chip on the HTML report's cards.

**Kept:** every ARIA rule, as a WCAG rule, with its reason codes and its WCAG outcomes as graded on 2026-11-02. Each one reports `fail` or `cantTell` under WCAG wherever it finds something; none reports `pass` for a WAI-ARIA violation, so a WCAG scan never hides one. The per-finding `verdicts` field is not removed outright: it becomes the per-profile verdict of [§4](#4-multi-profile-scans).

New ARIA rules (from the coverage inventory, see [pack-wai-aria](#3-surea11ypack-wai-aria)) are placed by their WCAG impact:

- a case that can fail a WCAG criterion goes in core, as WCAG `fail` or `cantTell`, like the rules there now;
- a case with no plausible WCAG impact goes in the pack, so a WCAG scan reports nothing new. An unnamed `table` is the main one: common, and usually no WCAG failure, so as a WCAG `cantTell` it would fill the review list of nearly every page.

A rule reaches WCAG `cantTell` only with a reason a person can act on. Each new rule is checked against a fixed set of pages before it lands: the WCAG `cantTell` count must not grow unless the rule says why it should.

## 2. A pack can make a finding a failure

A rule map row routes a rule's findings by reason code (`reasonCodes`) or by a stable field (`findings`), and today its `outcome` can only keep a finding's outcome or make a failing one a question (`'cantTell'`; `'ignore'` leaves it out). It can't make a `cantTell` a `fail`, which is the case WAI-ARIA needs.

**Added:** `outcome: 'fail'` in `reasonCodes` and `findings` entries, and the act `'fail'` in `meta.contributions`. It applies only to the codes or fields the row names, so a pack states each case it is certain of:

```js
'aria-role-name-present': {
  requirements: ['name-required'],
  reasonCodes: {
    name_missing: { outcome: 'fail' },      // certain under WAI-ARIA
    name_internals: { outcome: 'cantTell' }  // ElementInternals: no script can read it
  }
}
```

A finding made a failure this way is a failure of the pack's requirement only: the check result's own outcome, and every other profile's verdict, are unchanged. The contributor says so (`byReasonCode: true`, the rule's outcome in `checkOutcome`), as it does now for `'cantTell'`.

## 3. `@surea11y/pack-wai-aria`

A standard pack, built with `ruleMappedStandard`:

- **Requirements:** WAI-ARIA 1.2's author requirements, starting from the eight #345 has (name required, roles, required states, supported attributes, prohibited attributes, attribute values, owned elements, context roles), each with its title and URL. A requirement no rule checks in full is `partial: true`, so it never passes on part of what it asks.
- **Rule map:** core's ARIA rules, by reason code, with what #345's `meta.verdicts` says today (MUST and MUST NOT give `fail`, SHOULD and what script decides give `cantTell`, a code the spec states no author requirement for is left out).
- **Its own rules:** the WAI-ARIA cases with no WCAG impact (see [§1](#1-wai-aria-leaves-core)), starting with the name-required roles no rule covers: `table`, `tabpanel`, `treegrid`, `application`, `marquee`, and the DPUB and Graphics roles listed in [DESIGN_CHALLENGES.md](./DESIGN_CHALLENGES.md#five-aria-roles-that-require-an-accessible-name-have-no-rule-covering-them-at-all).
- **Profile:** `wai-aria-1.2`, which runs core's ARIA rules and the pack's, and nothing else.
- **Coverage:** a statement of which requirements its rules check in full, in part, or not at all, built from an inventory of WAI-ARIA 1.2 against what is automatable.

Chosen on its own, `wai-aria-1.2` is a scan like `en301549-v4.1.1`: a result per requirement, in place of the WCAG rollups.

The pack depends on core's reason codes, which [API_STABILITY.md](./API_STABILITY.md) already treats as a contract. A test in the pack fails when a code it maps no longer exists or a mapped rule gains a code the map doesn't place.

## 4. Multi-profile scans

`engineOptions.profile` takes a list as well as a name:

```js
{ profile: ['wcag22-aa', 'wai-aria-1.2'], packs: [waiAria] }
{ profile: ['en301549-v4.1.1', 'acme-policy'], packs: [en301549, acme] }
{ profile: ['acme-policy', 'wai-aria-1.2'], packs: [acme, waiAria] }
```

A single name, or a list of one, gives exactly the result it gives today.

### What runs

Each profile is scanned as a scan of it alone would be, in turn, on the same page, and the results are merged (`src/core/multi-profile.js`). Each profile's rollups are then exactly those of its own scan, a test holds it to that, and variants, overrides and a profile's own options (severity, excludes, its WCAG version) need nothing special: each profile's scan has its own. A rule only some of the profiles select is judged only by those.

The proposal was to run the union of the rules once. That is an optimisation, which changes no result: a rule two profiles run with the same code and settings gives the same findings twice. Until it is made, a scan of several profiles takes about as long as one scan per profile.

### What the result says

The check results are shared. Each finding carries a verdict per profile that judged it, `pass`, `fail`, `cantTell` or `notApplicable`, named by the profile's id:

```js
verdicts: { 'wcag22-aa': 'cantTell', 'wai-aria-1.2': 'fail' }
```

Each profile has a section of its own, named by its id and saying its standard and version: its rollups, its summary, its coverage. Every verdict is reported: a finding that fails one profile and is `cantTell` for another lists both, and it appears in the second profile's review list as well as in the first's failures.

### Counting

A scan of profiles A and B counts as a scan of one profile C with the rules of both:

- A check result's `outcome` is the worst of its verdicts: `fail`, then `cantTell`, then `pass`, then `notApplicable`. A reporter that reads `outcome` (SARIF, JUnit, the CLI, a lab tally) then counts C without knowing about profiles.
- A finding of a rule both profiles select counts once, whatever each makes of it.
- Findings of different rules count separately, a variant's and its base rule's among them, as they would in C.
- Any `fail`, under any profile, fails the scan.

### Versions and packs

- Each pack keeps its `core` range. A pack outside it is skipped, with the reason in `skippedPacks`, and the other profiles still run.
- A profile asked for and not run (its pack skipped, or no such profile) is listed in `engine.profilesNotRun`, with the reason. A scan that ran fewer profiles than it was asked to has counted less than C, so SARIF, JUnit and the CLI treat it as an error by default, with an option to allow it. This applies to a list only: a scan of one profile behaves as it does today.
- Two versions of one standard may run together, EN 301 549 V3.2.1 with V4.1.1, as may two standards built on different WCAG versions, `section508` (2.0) with `wcag22-aa`: useful while moving from one to the other, and nothing special to the mechanism.
- Profile ids can't collide: each starts with its pack's namespace, and two packs in one scan can't share one (the first by name runs, the other is skipped, as today). A profile of the skipped pack is in `engine.profilesNotRun`.
- `engine` records what produced the result: core's version, each pack's name and version, and each profile's id, standard and version, so a scan can be repeated and two results compared knowing whether they used the same standards.

### Open

- The exact shape of the per-profile sections, and how the HTML report and EARL show them.
- Options a profile sets that conflict with another's (`runOnly`, a policy's `allowedOutcomes`): run per profile where they decide what a rule finds, refuse where they can't be separated.
- How `getProfileWcagTarget`, `bestPractices` and `runOnly` combine with a list.

## Order of work

1. **Core:** remove the WAI-ARIA opt-in ([§1](#1-wai-aria-leaves-core)); add `outcome: 'fail'` ([§2](#2-a-pack-can-make-a-finding-a-failure)). Both before 1.15 is released.
2. **pack-wai-aria** as a single-profile standard ([§3](#3-surea11ypack-wai-aria)): useful on its own, and a real second standard to design §4 against.
3. **Core:** the WAI-ARIA 1.2 inventory, and its new rules where they belong (core or the pack).
4. **Core:** multi-profile scans ([§4](#4-multi-profile-scans)), with WCAG, EN 301 549 and WAI-ARIA as the cases it is built and tested on.
5. **Lab:** several profiles per scan, a tally and a filter per profile in the table, the groupings and Compare.
