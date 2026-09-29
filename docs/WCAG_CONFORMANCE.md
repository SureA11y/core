# WCAG conformance mapping guide

How individual rule results relate to a WCAG Success Criterion (SC), and what surea11y can and cannot tell you about overall conformance.

## The three layers

1. **Atomic rules** (`checksResults[]`) — one normative decision each, e.g. "does this `<img>` have an `alt` attribute." See [`RULE_CATALOG.md`](./RULE_CATALOG.md) for all 130.
2. **Facets** — a WCAG SC is usually bigger than any one rule can decide deterministically. Internally, each SC is broken into named "facets" (e.g. 1.1.1 Non-text Content has facets like `img-alt-attr-present`, `text-alternative-quality`, `decorative-null`) tracked in `src/coverage/wcag-facets.js`, each marked `full` (a rule decides it with high confidence), `partial` (a rule decides *part* of it — see each rule's own scope notes), or `manual` (no safe automated heuristic exists at all). Run `npm run coverage` to regenerate `coverage/coverage-report.md`, the per-SC facet breakdown.
3. **Composite (WCAG-SC rollup) rules** (`rulesResults[]`) — a generated aggregate of every atomic rule mapped to one SC, giving you one pass/fail/cantTell/notApplicable verdict per SC instead of having to roll up dozens of atomic results yourself. See [`RULE_CATALOG.md`](./RULE_CATALOG.md#composite-wcag-sc-rollup-rules-33) for the full list (e.g. `wcag-1.1.1-non-text-content` rolls up 22 atomic rules).

## How a composite's outcome is computed

Deterministic precedence, evaluated over that composite's atomic contributors:

| Condition | Composite outcome |
|---|---|
| Any contributor `fail` | `fail` |
| No `fail`, but any contributor `cantTell` **or** a listed contributor didn't run at all | `cantTell` |
| Every contributor `notApplicable` | `notApplicable` |
| Otherwise (all ran, none failed/cantTell, not all N/A) | `pass` |

This means: **a composite `pass` is a real, deterministic "every applicable automated check for this SC came back clean" — but it is not a WCAG conformance claim on its own.** If any facet of that SC has no automated coverage at all (see `coverage-report.md`), a composite `pass` is silent about that facet, not asserting it's fine. Cross-check the facet table before treating a composite `pass` as "SC fully verified."

A composite's `data.details.contributors` array (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#a-composite-result-rulesresultsi)) lists every atomic rule and its individual outcome — use this to see exactly which facet(s) drove a `fail`/`cantTell`, rather than treating the composite as a black box.

## Targeting a conformance level (A / AA / AAA)

Pass `runOnly.tags` (or `engineOptions.tags.include`) with the level tags you want:

```js
// WCAG 2.0 A and AA. Both tags are required: they are not cumulative.
runDomRulesInPage(url, null, {}, { tags: ['wcag2a', 'wcag2aa'] });
```

**Level tags do not nest, and this is the easiest thing to get wrong here.** A rule
carries one level tag per Success Criterion it maps to, and nothing more: a rule
mapped only to an AA criterion is tagged `wcag2aa` and *not* `wcag2a`. Asking for
`{ tags: ['wcag2aa'] }` on its own therefore runs the 10 rules mapped to a 2.0 AA
criterion, not the ~100 that make up an A + AA target. List every level you mean.
`engineOptions.profile` (`wcag22-aa`, `en301549-v4.1.1`, `en301549-v3.2.1`, `section508`, `rgaa-4.1.2`) does
this for you; see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#conformance-profiles).

The same applies across WCAG versions — a criterion introduced in 2.1 or 2.2 carries
only its own origin tag — so a full conformance target is a union of tag sets. See
[`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#filtering-by-wcag-version-21-vs-22) for the
ready-made sets per version, including the one criterion WCAG 2.2 removed rather than
added.

**The removed criterion is handled for you.** Every run resolves a target WCAG version
(`engineOptions.wcagVersion`, else whatever your version tags imply, else `2.2`) and
reports it back as `engine.wcagVersion`. Under a 2.2 target, a rule mapped only to SC
4.1.1 Parsing cannot report `fail` — it runs, reports its occurrences, and comes back
`cantTell` with a `wcagVersionScope` field explaining the coercion. So a default scan
never gates on a criterion WCAG 2.2 does not contain, and a 2.0/2.1 scan still gets a
real 4.1.1 verdict.

Composites, unlike atomic rules, *are* filtered cumulatively. The runner reads the
highest level named in `tags` and drops every composite above it, so requesting
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

## RGAA

RGAA (Référentiel général d’amélioration de l’accessibilité) is the French standard. Unlike EN 301 549 it does not restate WCAG criterion by criterion: its 106 criteria, in 13 themes, are its own, each checked by one or more tests (258 in all), and RGAA itself states which WCAG criteria each one relates to. The relation runs many to many. WCAG 1.1.1 alone relates to 19 RGAA criteria, across images, media, scripts and consultation.

The engine carries RGAA 4.1.2, the version in force, built on WCAG 2.1. Its criteria relate to every WCAG 2.1 Level A and AA criterion except 1.2.4 Captions (Live), which no RGAA 4.1.2 criterion references.

The table is public as `@surea11y/core/rgaa`, in RGAA's own French wording:

```js
const { RGAA_THEMES, RGAA_CRITERIA, RGAA_TESTS, rgaaCriteriaForSc } = require('@surea11y/core/rgaa');

RGAA_CRITERIA['4.1.2']['11.1'];
// { theme: 11, title: 'Chaque champ de formulaire a-t-il une étiquette ?',
//   wcagSc: ['1.3.1', '2.4.6', '3.3.2', '4.1.2'], techniques: ['G82', …], tests: ['11.1.1', '11.1.2', '11.1.3'] }
RGAA_TESTS['4.1.2']['11.1.1'].conditions;  // what the test enumerates, when it does
rgaaCriteriaForSc('1.1.1');               // [{ version: '4.1.2', criterion: '1.1', title: '…' }, …]
```

### RGAA tests on scan results

With `engineOptions.mappings: ['rgaa']`, every result names the RGAA tests its rule checks: `{ standard: "RGAA", version: "4.1.2", requirement: "1.1.1", title, criterion: "1.1", wcagSc: ["1.1.1"] }`, where `requirement` is the test, `title` its wording and `criterion` the criterion it belongs to. A composite names the tests of the rules that produced its outcome, among those RGAA relates to its criterion: the failing rules' tests when it fails, the undecided rules' when it is `cantTell`, the passing rules' when it passes, and none when it is `notApplicable`. Its catalog entry (`getRulesCatalog`) still lists the tests of every rule it groups. EN 301 549 clauses are not narrowed this way: a clause restates the composite's own criterion, whichever rule decided. SARIF tags them `rgaa-1.1.1`, JUnit adds `rgaa` properties, and the HTML report lists them under each criterion.

Because the relation is many to many, a rule's tests cannot be derived from its WCAG criteria the way an EN 301 549 clause is. They are stated rule by rule in `src/coverage/rgaa-rule-map.js`, under one rule: a rule maps to a test when its failure (or, for a manual rule, the question it raises) is direct evidence about what the test's official methodology checks, on the same kind of element. Covering one step of a test is enough; sharing a WCAG criterion is not. Each row says which step and why. The build rejects an unknown rule or test, and a test whose criterion RGAA relates to none of the rule's WCAG criteria. A rule with no WCAG mapping may map to any test, since RGAA checks some things WCAG leaves to best practice, such as heading hierarchy (9.1.1) and landmarks (9.2.1). A few links go against RGAA's correspondence on purpose: `<img ismap>` is what RGAA 1.1.4 looks for, although RGAA files 1.1.4 under WCAG 1.1.1 and the engine files the rule under 2.1.1. Such a row lists the test in `outsideCorrespondence` with the reason, the build refuses the link without one, and the entry is filed under the rule's own WCAG criteria. `RGAA_MAPPING.md` marks these tests "(exception)".

101 of the 137 rules map to at least one test, and together they reach 45 of the 106 criteria. [`RGAA_MAPPING.md`](./RGAA_MAPPING.md) lists every rule's tests with the reason, and every criterion with the rules that speak to it, including the 61 no rule reaches.

`profile: 'rgaa-4.1.2'` targets RGAA directly: it runs the WCAG 2.1 A and AA rules, every rule mapped to an RGAA test (including those with no WCAG mapping, such as `heading-order`), and the opt-in rules for RGAA's own requirements, tagged `rgaa`, which no other selection runs (see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#opt-in-rules)); it also switches on the RGAA mapping.

Five opt-in rules check RGAA requirements WCAG does not make, each deciding exactly what the RGAA test's procedure checks:

| Rule | RGAA | Fails when |
|---|---|---|
| `doctype-present` | 8.1.1–8.1.3 | the page has no doctype, or one that is neither HTML5 nor a W3C recommended doctype |
| `presentational-elements-absent` | 10.1.1 | the page uses an element RGAA lists (`<font>`, `<center>`, `<big>`, `<s>`, …; `<u>` too without the HTML5 doctype) |
| `presentational-attributes-absent` | 10.1.2 | an HTML element carries an attribute RGAA lists (`align`, `bgcolor`, `border`, …), with RGAA's exceptions for `size`, `width` and `height` |
| `optgroup-label-present` | 11.8.2 | an `<optgroup>` in a `<select>` has no label, or an empty one |
| `label-for-target-valid` | 11.1.2 | a `<label for>` matches no id, an empty one, or an element that cannot be labelled |

They follow RGAA's lists as written, so `width` on an `<iframe>` and `size` on an `<input>` are reported, and `<s>` is, although HTML5 keeps it.

Under the profile, `rulesResults` also gets one rollup per RGAA criterion a rule is linked to, next to the WCAG ones: `rgaa-4.1.2-9.1` groups the heading rules, `rgaa-4.1.2-8.1` the doctype rule. Each has RGAA's wording as its title, `meta.standard: "RGAA"` and `data.details.criterion`, and follows the same outcome rules as a WCAG rollup, naming the RGAA tests of the rules that decided it. Some RGAA findings belong to no WCAG rollup at all (heading order, the doctype, presentational markup), so these rollups are the only place a consumer reading `rulesResults` alone sees them. Like RGAA-only rules they are opt-in: no default, WCAG or EN 301 549 run produces them, and `getRulesCatalog()` lists them only under options that ask for RGAA. Every check result also carries `rollupIds`, the rollups that group it in that run, so a finding with none can be spotted.

A test on a result means the rule checks part of it, never that the test is conforme: a `pass` is not an RGAA verdict, and most tests need a human. **The mapping has not yet been reviewed by an RGAA auditor.** Every row still to check carries a review mark with a priority and the question to answer; [`RGAA_TO_REVIEW.md`](./RGAA_TO_REVIEW.md) lists them, highest priority first, along with tests some unlinked rules might be linked to. Corrections go in `src/coverage/rgaa-rule-map.js`, and `npm run rgaa-mapping-doc` regenerates both pages.

The table is generated from the criteria file DINUM publishes (`RGAA/criteres.json` in <https://github.com/DISIC/accessibilite.numerique.gouv.fr>, under Licence Ouverte 2.0), kept byte for byte in `scripts/data/rgaa/` with its provenance. Only the Markdown is removed: glossary links keep their words, and code spans lose their backticks. `npm run rgaa-map` regenerates `src/coverage/rgaa-map.js`, and a test fails if the committed file differs from what the source gives.

## Adding another standard

EN 301 549 is the first entry in a registry, `src/coverage/standards.js`, and nothing else in the engine names it. Every other standard goes the same way:

1. Put its table in `src/coverage/<name>-map.js`, taken from the published text, with a function that returns a rule's entries given the rule's id and WCAG criteria. Each entry is `{ standard, version, requirement, title, wcagSc }`, where `wcagSc` lists the WCAG criteria that requirement corresponds to. A standard that restates WCAG one criterion at a time, as EN 301 549 does, derives its entries from the criteria; one organised differently can look the rule up by id.
2. Add an entry to `NORMATIVE_STANDARDS`: its `key` (what `engineOptions.mappings` accepts, and the SARIF tag prefix and JUnit property name), its `standard` (the name its entries carry and the report shows), its `versions`, any conformance profiles it brings, and that function.

The build then adds its entries to every rule and composite, `engineOptions.mappings` accepts its key and versions, its profiles select rules and switch its entries on, and SARIF, JUnit and the HTML report show them. `tests/coverage/standards.test.js` holds every registered standard to that contract. What stays per standard is its own table, its tests, and a public export if tools need the reverse view (as `@surea11y/core/en301549` does).

## What this engine cannot tell you

No automated tool — this one included — can certify full WCAG conformance. That's not a limitation specific to surea11y; it's inherent to WCAG itself; a meaningful fraction of Success Criteria require human judgment (is this alt text *accurate*, not just *present*; is this error message *understandable*) or dynamic testing this engine's static-DOM-scan architecture cannot do at all (keyboard-trap detection, real layout/reflow at zoom). See [`LIMITATIONS.md`](./LIMITATIONS.md) for the full, explicit list of what's out of scope and why.

What surea11y *can* give you, honestly:
- Every `fail` is a real, deterministic, normative violation of the standard and version you targeted — never a guess. By default that standard is WCAG: a rule for a requirement only another standard makes (an RGAA-only rule, say) is opt-in and runs only when you target that standard ([`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#opt-in-rules)), so a WCAG scan never fails a page for something WCAG does not require.
- Every `cantTell` is an explicit flag for human review, not a swallowed uncertainty.
- The facet coverage table tells you exactly which parts of which SCs have zero automated coverage, so you know where a `pass` is silent rather than exhaustive.

A composite `pass` across every SC at your target level means: *every automatable check for that level came back clean.* It is the automatable subset of conformance, stated precisely — not a substitute for the manual review WCAG itself requires.
