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

Pass `runOnly.tags` (or `engineOptions.tags.include`) with one of `wcag2a`, `wcag2aa`, `wcag2aaa`:

```js
runDomRulesInPage(url, null, {}, { tags: ['wcag2aa'] });
```

This does two things at once:
- **Filters atomic rules** to ones tagged at or under that level (a `wcag2aa`-tagged rule also carries `wcag2a`, since AA is cumulative on top of A — WCAG conformance is always defined this way).
- **Suppresses composites above the target level** — e.g. requesting `wcag2aa` will not return a `rulesResults` entry for an AAA-only SC's composite, even if some AAA-level atomic rules happen to be tagged loosely. This is `inferTargetLevelFromRunOnly`/`isAllowedByTargetLevel` in the runner — see `src/core/dom-runner.js` if you need the exact precedence logic.

Omit `tags` entirely (the default) and every rule at every level runs, with no composite suppression.

## What this engine cannot tell you

No automated tool — this one included — can certify full WCAG conformance. That's not a limitation specific to surea11y; it's inherent to WCAG itself; a meaningful fraction of Success Criteria require human judgment (is this alt text *accurate*, not just *present*; is this error message *understandable*) or dynamic testing this engine's static-DOM-scan architecture cannot do at all (keyboard-trap detection, real layout/reflow at zoom). See [`LIMITATIONS.md`](./LIMITATIONS.md) for the full, explicit list of what's out of scope and why.

What surea11y *can* give you, honestly:
- Every `fail` is a real, deterministic, normative violation — never a guess.
- Every `cantTell` is an explicit flag for human review, not a swallowed uncertainty.
- The facet coverage table tells you exactly which parts of which SCs have zero automated coverage, so you know where a `pass` is silent rather than exhaustive.

A composite `pass` across every SC at your target level means: *every automatable check for that level came back clean.* It is the automatable subset of conformance, stated precisely — not a substitute for the manual review WCAG itself requires.
