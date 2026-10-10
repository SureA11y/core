# WCAG conformance mapping guide

How individual rule results relate to a WCAG Success Criterion (SC), and what surea11y can and cannot tell you about overall conformance.

## The three layers

1. **Atomic rules** (`checksResults[]`) — one normative decision each, e.g. "does this `<img>` have an `alt` attribute." See [`RULE_CATALOG.md`](./RULE_CATALOG.md) for every one.
2. **Facets** — a WCAG SC is usually bigger than any one rule can decide deterministically. Internally, each SC is broken into named "facets" (e.g. 1.1.1 Non-text Content has facets like `img-alt-attr-present`, `text-alternative-quality`, `decorative-null`) tracked in `src/coverage/wcag-facets.js`, each marked `full` (a rule decides it with high confidence), `partial` (a rule decides *part* of it — see each rule's own scope notes), or `manual` (no safe automated heuristic exists at all). Run `npm run coverage` to regenerate `coverage/coverage-report.md`, the per-SC facet breakdown.
3. **Composite (WCAG-SC rollup) rules** (`rulesResults[]`) — a generated aggregate of every atomic rule mapped to one SC, giving you one pass/fail/cantTell/notApplicable verdict per SC instead of having to roll up dozens of atomic results yourself. See the composite section of [`RULE_CATALOG.md`](./RULE_CATALOG.md) for the full list (e.g. `wcag-1.1.1-non-text-content` rolls up 22 atomic rules).

## How a composite's outcome is computed

Deterministic precedence, evaluated over that composite's atomic contributors:

| Condition | Composite outcome |
|---|---|
| Any contributor `fail` | `fail` |
| No `fail`, but any contributor `cantTell` **or** a listed contributor didn't run at all | `cantTell` |
| Every contributor `notApplicable` | `notApplicable` |
| Otherwise (all ran, none failed/cantTell, not all N/A) | `pass` |

This means: **a composite `pass` is a real, deterministic "every applicable automated check for this SC came back clean" — but it is not a WCAG conformance claim on its own.** If any facet of that SC has no automated coverage at all (see `coverage-report.md`), a composite `pass` is silent about that facet, not asserting it's fine. Cross-check the facet table before treating a composite `pass` as "SC fully verified."

A custom rule (`engineOptions.customRules`) that ran counts toward the composite of each criterion it maps to, through `meta.wcagSc` or a WCAG entry in `meta.normativeMappings`, as a built-in rule does: a failing custom rule fails the composite. The composite marks it `custom: true` among its contributors and lists it in `data.details.customChecksIds`, since custom rules are not checked against the specs as the built-in ones are. An override of a built-in counts where its own mapping says: in its built-in's place when it maps to that criterion, nowhere when it maps to none (with a warning).

A composite's `data.details.contributors` array (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#a-composite-result-rulesresultsi)) lists every atomic rule and its individual outcome — use this to see exactly which facet(s) drove a `fail`/`cantTell`, rather than treating the composite as a black box.

## Targeting a conformance level (A / AA / AAA)

Name the WCAG version and level in `runOnly.wcag`:

```js
// WCAG 2.2 Level A and AA:
runDomRulesInPage(url, null, {}, { wcag: { version: '2.2', level: 'AA' } });

// The same, and the best-practice rules, which test no WCAG criterion:
runDomRulesInPage(url, null, {}, { wcag: { version: '2.2', level: 'AA' }, bestPractices: true });
```

A target runs the rules for every criterion in force in that version at that level and
below, by the level each criterion has in that version (`WCAG_CRITERIA` in
`@surea11y/core/wcag`), so 4.1.1 Parsing is part of 2.0 and 2.1 targets and not of 2.2
ones. It also sets the run's WCAG version and the level of the rollups reported. See
[`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#selecting-by-wcag-target-runonlywcag).

Each entry of `WCAG_CRITERIA` also has the `id` W3C gives the criterion in WCAG 2.2
(`non-text-content`), taken from the Recommendation's source. Every WCAG mapping a rule
carries links its criterion's section in that version's Recommendation (`url`) and its
Understanding document (`understandingUrl`), for 2.1 and 2.2: the reporters use the
Understanding document as a rule's help link when the rule has none of its own.

### With tags

The same targets can be spelled with level tags, in `runOnly.tags` (or
`engineOptions.tags.include`):

```js
// WCAG 2.0 A and AA. Both tags are required: they are not cumulative.
runDomRulesInPage(url, null, {}, { tags: ['wcag2a', 'wcag2aa'] });
```

**Level tags do not nest, and this is the easiest thing to get wrong here.** A rule
carries one level tag per Success Criterion it maps to, and nothing more: a rule
mapped only to an AA criterion is tagged `wcag2aa` and *not* `wcag2a`. Asking for
`{ tags: ['wcag2aa'] }` on its own therefore runs the 9 rules mapped to a 2.0 AA
criterion, not the ~100 that make up an A + AA target. List every level you mean, or
use `runOnly.wcag`, which does not have the problem. `engineOptions.profile` (`wcag22-aa`,
`en301549-v4.1.1`, `en301549-v3.2.1`, `section508`) does it for you too; see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#conformance-profiles).

The same applies across WCAG versions — a criterion introduced in 2.1 or 2.2 carries
only its own origin tag — so a full conformance target is a union of tag sets. See
[`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#filtering-by-wcag-version-21-vs-22) for the
ready-made sets per version, including the one criterion WCAG 2.2 removed rather than
added.

**The removed criterion is handled for you.** Every run resolves a target WCAG version
(`engineOptions.wcagVersion`, else the version of `runOnly.wcag`, else whatever your
version tags imply, else `2.2`) and
reports it back as `engine.wcagVersion`. Under a 2.2 target, a rule mapped only to SC
4.1.1 Parsing cannot report `fail` — it runs, reports its occurrences, and comes back
`cantTell` with a `wcagVersionScope` field explaining the coercion. So a default scan
never gates on a criterion WCAG 2.2 does not contain, and a 2.0/2.1 scan still gets a
real 4.1.1 verdict.

Composites, unlike atomic rules, *are* filtered cumulatively. The runner reads the
level of `runOnly.wcag`, or the highest level named in `tags`, and drops every composite above it, so requesting
`['wcag2a', 'wcag2aa']` returns no `rulesResults` entry for an AAA-only SC. That is
`inferTargetLevelFromRunOnly`/`isAllowedByTargetLevel` in `src/core/dom-runner.js` if
you need the exact precedence.

Omit `tags` entirely (the default) and every rule at every level runs, with no composite
suppression.

## EN 301 549

Chapter 9 of EN 301 549 restates the WCAG Level A and AA Success Criteria as clauses numbered `9.` plus the criterion's own number: WCAG 1.4.3 is clause 9.1.4.3. When a scan asks for them, every atomic and composite result carries, after its WCAG entries in `meta.normativeMappings`, the clause for each of its criteria, once per version of the standard that includes that criterion. A scan asks with `engineOptions.mappings: ['en301549']` (both versions) or `['en301549:V3.2.1']` (one), or by targeting an EN 301 549 profile, which adds the version it names; by default results name WCAG only (see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#other-standards-mappings)):

| Version | Built on | Differs from the other in |
|---|---|---|
| V3.2.1 (2021-03) | WCAG 2.1 A and AA, 50 criteria | Includes 9.4.1.1 Parsing |
| V4.1.1 (2026-09) | WCAG 2.2 A and AA, 55 criteria | Adds 2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8; 9.4.1.1 is void |

Each clause entry also names the criterion it restates, as `wcagSc: ["1.4.3"]`, so a view grouped by criterion (JUnit's suites, the HTML report's rollup) puts it under the right one even on a rule mapped to several.

AAA criteria have no clause in either version. The table lives in `src/coverage/en301549-map.js`, taken from the ETSI text; rules never declare these entries themselves, the build derives them from each rule's WCAG mapping. A rule added through `engineOptions.customRules` keeps exactly the mappings it declares. The catalogs name the clauses under the same options: `getChecksCatalog({ mappings: ['en301549'] })` in each entry's `normativeMappings`, and composite entries returned by `getRulesCatalog({ mappings: ['en301549'] })` as `meta.standardMappings`, so the clauses a criterion maps to can be read without running a scan. Called with no options, they name WCAG only, as a result does.

The table is public as `@surea11y/core/en301549`, for tools that need the reverse view, such as which criteria a version requires that a scan did not cover:

```js
const { EN301549_CLAUSES, en301549ClausesForSc } = require('@surea11y/core/en301549');

Object.keys(EN301549_CLAUSES['V3.2.1']);  // the 50 WCAG 2.1 A and AA criteria V3.2.1 restates
en301549ClausesForSc('2.5.8');            // [{ version: 'V4.1.1', clause: '9.2.5.8', title: 'Target size (minimum)' }]
```

This is a correspondence between two published documents, not a conformance claim: a clause on a result says which EN 301 549 requirement that WCAG criterion is, nothing more. Which version a given law requires is outside the engine.

## Adding another standard

EN 301 549 is an entry in a registry, `src/coverage/standards.js`. The build, the runner, the rule catalog and the reporters read it, so a new standard goes the same way. Where its entry lives depends on the standard:

- A standard that restates WCAG one criterion at a time, as EN 301 549 does, only renumbers WCAG's verdicts. Its table goes in `src/coverage/<name>-map.js` and its entry in `NORMATIVE_STANDARDS`, next to EN 301 549's.
- A standard with verdicts of its own (requirements its own rules check, a national standard, say), or an organisation's checklist, is a **pack**: a package of its own outside core, which a scan takes in `engineOptions.packs` and whose entry joins the registry for that scan. `npx -p @surea11y/core surea11y-pack new <folder> --kind standard` writes one that works as generated; [`PACKS.md`](./PACKS.md) is the guide.
- A standard built into core itself would be a **profile**: a folder under `profiles/` holding its entry, its tables, and the scripts and tests that go with them, listed in `profiles/index.js` (`npm run profile:new -- <key>` creates one). Core ships none; see [`profiles/README.md`](../profiles/README.md).

Either way, the entry needs:

1. A table taken from the published text, with a function that returns a rule's entries given the rule's id and WCAG criteria. Each entry is `{ standard, version, requirement, title, wcagSc }`, where `wcagSc` lists the WCAG criteria that requirement corresponds to. A standard that restates WCAG derives its entries from the criteria. One organised differently looks the rule up by id, in a table of the rules it maps.
2. Its `key` (what `engineOptions.mappings` accepts, and the SARIF tag prefix and JUnit property name), its `standard` (the name its entries carry and the report shows), its `versions`, and that function as `mappingsFor`.

The rest is optional, and the comment at the top of the registry describes each field:

- `profiles`: named conformance targets. Each gives the WCAG tags it runs and the version it targets, and switches that version's mappings on. With `mappedRules: true` it also runs every rule the standard maps, which matters when the standard requires things WCAG leaves to best practice. With `exclude: { rules, criteria }` it leaves rules out: the rules it names, and the WCAG criteria a standard narrower than WCAG waives (their WCAG rollups, and every rule that checks nothing else). The build refuses an unknown rule or criterion, and a rule the profile both maps and excludes. A standard that replaces a WCAG check with a stricter one of its own excludes the WCAG rule and maps its own.
- `ruleTag`: a tag for rules that check requirements only this standard makes. Another standard may not map them or derive variants from them; the build refuses it, so standards stay independent of each other, and a rule two of them need belongs in core. These rules are opt-in (see [`RULE_AUTHORING.md`](./RULE_AUTHORING.md)), so a WCAG scan never runs them. Only the standard's own rules are: a core rule that carries a tag of the same name stays core's, and in the standard's profile the tag selects its own rules only. In a profile, they go in its `rules/` folder, which its `index.js` exports as `rulesDir`.
- `ruleMapped: true`: the entries come from each rule rather than from its WCAG criterion, so a WCAG rollup names only the entries of the rules that decided its outcome. A standard mapped that way for some requirements and restating WCAG for others lists the prefixes of the restating ones in `restatedPrefixes` (`['A.']`): a rollup names those whatever decided it, as it names EN 301 549's.
- `composites()`: rollups of the standard's own, such as one per requirement. They carry the rule tag, so only a run that asks for the standard produces them, and the HTML report shows them in a section of their own.
- `report`: the dictionary key of the note above that section (`noteKey`), and the language of the rollup titles when it is not the scan's (`titleLang`).
- `validate(rules)`: checks the standard's own tables against the rules that exist. The build fails on any problem it returns.

A standard built on a WCAG version reads that version from `@surea11y/core/wcag` (`src/wcag.js`) rather than keeping its own copy: `wcagCriteria('2.1', { levels: ['A', 'AA'] })` lists the criteria in force in 2.1 with their 2.1 titles and levels (4.1.1 Parsing is Level A there, and gone in 2.2), `wcagCriterion(sc, version)` looks one up, and `wcagTags('2.1')` gives the rule tags a profile on 2.1 A and AA selects, as EN 301 549's profiles do. It is the one core module a profile's own tables may require (see [`profiles/README.md`](../profiles/README.md#what-a-profile-may-use)).

`tests/coverage/standards.test.js` holds every registered standard to the contract. What stays per standard is its table, its tests, its rules, and a public export if tools need the reverse view, as `@surea11y/core/en301549` does.

A standard is registered in core or brought by a pack (see [`PACKS.md`](./PACKS.md)). At run time, a custom rule (`engineOptions.customRules`) can name any standard in its own `normativeMappings`, and the result keeps those entries as written, but only registered standards (core's and the scan's packs') get a profile, a `mappings` switch, opt-in rules, rollups, or a place in SARIF, JUnit and the HTML report.

## What this engine cannot tell you

No automated tool — this one included — can certify full WCAG conformance. That's not a limitation specific to surea11y; it's inherent to WCAG itself; a meaningful fraction of Success Criteria require human judgment (is this alt text *accurate*, not just *present*; is this error message *understandable*) or dynamic testing this engine's static-DOM-scan architecture cannot do at all (keyboard-trap detection, real layout/reflow at zoom). See [`LIMITATIONS.md`](./LIMITATIONS.md) for the full, explicit list of what's out of scope and why.

What surea11y *can* give you, honestly:
- Every `fail` is a real, deterministic, normative violation of the standard and version you targeted — never a guess. By default that standard is WCAG: a rule for a requirement only another standard makes (a rule for a national standard's own requirement, say) is opt-in and runs only when you target that standard ([`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#opt-in-rules)), so a WCAG scan never fails a page for something WCAG does not require. The one exception is a run that asks for every rule (`engineOptions.optInRules`): it targets no single standard, and says so in `engine.optInRules`.
- Every `cantTell` is an explicit flag for human review, not a swallowed uncertainty.
- The facet coverage table tells you exactly which parts of which SCs have zero automated coverage, so you know where a `pass` is silent rather than exhaustive.

A composite `pass` across every SC at your target level means: *every automatable check for that level came back clean.* It is the automatable subset of conformance, stated precisely — not a substitute for the manual review WCAG itself requires.
