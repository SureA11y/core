# Leans: which way an undecided finding points

A scan answers each rule with `pass`, `fail`, `notApplicable` or `cantTell`. A `cantTell` means the engine could not prove the answer from the page: a person has to check. Some of those findings still have evidence that points one way. The engine says so with a **lean**: the answer the evidence makes likely, without claiming it is proven.

This page is for three readers: people who read reports, people who build tools on SureA11y's results, and anyone deciding how far to trust a lean. The field itself is specified in [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#leans).

## For people reading a report

The HTML report lists the findings that need review in three groups:

| Group | What it means | What to do |
|---|---|---|
| **Likely fails: confirm** | The page's evidence points to a failure, but doesn't prove it. | Check these first: most will turn out to fail. Each says why it leans that way. |
| **Likely passes: confirm** | The evidence points to a pass. | Confirm them when you have time; most will turn out fine. |
| **Needs a person** | There is no evidence either way. Only a person can judge (whether alt text describes its image, whether a caption is complete). | Check each one. |

Each card has a "How to check" section: the steps to answer the question yourself, and what you see if it passes or fails. It is there for every finding that needs review, whether it leans or not.

A lean is still a question. "Likely fails" does not mean the page fails, and a reviewer who checks and finds it passes is right, not the lean. Each lean shows its reason ("The heading skips a level after the one before it"), and some add a caution saying what could make it wrong ("A layout table can also hold numbers").

## For people building tools

A lean is an optional field on a `cantTell` occurrence:

```json
{
  "occurrenceOutcome": "cantTell",
  "uncertainty": { "code": "judgement-required", "needed": "Whether the heading structure makes sense." },
  "lean": {
    "toward": "fail",
    "why": "The heading skips a level after the one before it.",
    "signals": [{ "signal": "heading-level-skipped", "value": true }],
    "i18n": { "whyKey": "headingOrder_lean_why" }
  }
}
```

- `toward` is `"pass"` or `"fail"`. There is no third value: when the engine can't tell which way, there is no lean.
- `why` and `caution` are already in the scan's locale; `i18n` holds their keys, to render them in another.
- `signals` are the facts the rule read, each a kebab-case name and a plain value. Show them, weigh them, or test against them.
- `measured`, once present, says how often this lean has been right against the ACT test cases: `{ "agreed": 47, "cases": 50 }`, with the `corpus` and the `coreVersion` that counted them. It appears only once the lean has been counted on at least five cases.

What a lean does not change:

- **The outcome.** It stays `cantTell`, and the rule's outcome is computed from the tiers as before. Anything that reads outcomes (EARL, baselines, WCAG rollups) sees no difference.
- **A finding's identity.** A lean is not part of the fingerprint: adding, changing or removing one doesn't open or close a baseline entry for a failure or a code-scanning alert. Only an entry marked `lean: 'fail'` (below) depends on it: it matches the finding while the finding leans fail.

Ways to use it:

- **Sort a review queue:** likely fails first, then likely passes, then the rest. `reviewGroupOf(check, occurrence)` gives each occurrence its group (`'fail'`, `'leanFail'`, `'leanPass'` or `'open'`), as the HTML report sorts them; `@surea11y/core/how-to-check` exports it for code that runs in a browser.
- **Gate CI on likely failures only.** `renderJunitReport(result, { leanFailAs: 'failure' })` reports a rule with a finding that leans fail as `<failure type="leanFail">`. `renderSarifReport(result, { leanFailAs: 'error' })` raises such a finding to `error`. Both are off by default, so a strict pipeline is unchanged. `leaningFailures(result)` lists the findings they gate on.
  - That includes the best-practice rules' findings, which lean fail without condition (see below): with `leanFailAs`, a skipped heading level is a failure. To gate only on the rules mapped to WCAG criteria, add `leanFailWcagOnly: true` (`leaningFailures(result, { wcagOnly: true })`).
  - Accept the likely failures a page already has, as a baseline accepts its failures: `buildBaselineEntries(result, { leanFail: true })` records them as entries marked `lean: 'fail'`, and JUnit and SARIF then gate only on new ones ([`BASELINE.md`](./BASELINE.md#findings-that-lean-fail)).
  - New leans arrive in minor releases (below), so a build gated on leans can turn red after an upgrade with nothing changed on the page. Pin the version, or record the leans the upgrade brings in the baseline.
- **Show the reason.** SARIF results carry it in `properties.lean`, and the HTML report shows it on each card and in the occurrence table.

Treat a lean as advice that can come and go. New leans arrive in minor releases, rule by rule, and one that measuring shows to be wrong too often is removed.

## How far to trust a lean

A lean has to earn its place. The rules are:

1. **Evidence, not intuition.** A rule leans only where it reads facts from the page (the DOM, computed styles, the boxes the browser draws) that make one answer clearly more likely. Each lean names those facts in `signals`, so anyone can see what it rests on.
2. **No lean on a coin toss.** Where the evidence is weak or mixed, there is no lean. Its absence is information too: this one needs a person.
3. **Nothing a person must judge.** Whether text means what it should, whether a caption is complete, whether an image needs a description: these never get a lean, however likely one answer seems.
4. **The cautions are stated.** A lean says what could make it wrong when that isn't obvious.
5. **Measured, then kept or removed.** Each lean is counted against cases whose answer is known: the W3C ACT rules' test cases, each of which says whether its page passes or fails. `scripts/measure-leans.js` scans them, and for each rule, reason code and direction counts the cases that show such a lean, once per case, and how many of them it agreed with (`fail` on a failed case, `pass` on a passed one; inapplicable cases are left out). The counts go to `scripts/data/lean-measures.json`, which the build embeds in the engine, so `measured` is on every lean of a rule, code and direction counted on at least five cases (`minCases` in the file): `{ "agreed": 9, "cases": 10, "corpus": "W3C ACT Task Force test cases, 2026-10-26", "coreVersion": "1.14.0" }`. A count of one or two cases says too little and would read as proven, so until a lean has been measured on enough cases, `measured` is absent; it is never estimated. One right in fewer than 80% of five or more cases is listed by the script, to be reconsidered or removed. Core's own fixtures are not counted: their markers say which tier the engine gives a case, not what a person would answer it.
6. **No confidence number.** The engine doesn't give a lean a probability it can't back. A count of right answers out of known cases is the only measure it reports.

Two kinds of finding lean without condition, and say so:

- **Best-practice findings that state a fact.** A best-practice rule (no WCAG criterion) never fails, by design. When what it reports is a fact read from the page (two `main` landmarks, a skipped heading level, a label pointing at nothing), it stays `cantTell` and leans `fail`: the fact is proven, the rule just doesn't fail scans over a best practice.
- **A criterion outside the target.** `duplicate-id` maps to WCAG 4.1.1, which WCAG 2.2 removed and which the 2023 errata to 2.0 and 2.1 count as satisfied for HTML and XML. Its findings lean `pass` for that criterion, with a caution that the duplicate still breaks what relies on it. Under a standard that keeps 4.1.1 (EN 301 549 V3.2.1), it fails and has no lean.

## Which rules lean

Each rule's entry in [`RULE_CATALOG.md`](./RULE_CATALOG.md) says, in its reason codes, which codes lean and when ("It leans fail: the page states it."). The full list of codes that can lean, and those that can't, is being built rule family by rule family; [`CHANGELOG.md`](../CHANGELOG.md) records each addition.

## For rule authors

When a rule's `cantTell` should carry a lean, and how to write one, is in [`RULE_AUTHORING.md`](./RULE_AUTHORING.md) §8.5.
