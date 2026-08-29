# EARL report

`@surea11y/core/earl` renders scan results as [EARL 1.0](https://www.w3.org/TR/EARL10-Schema/) in JSON-LD — the vocabulary the W3C publishes for stating "this tool tested this thing and got this result", and the format the [ACT Rules](https://act-rules.github.io/) community group accepts as an implementation report.

```js
const { renderEarlReport } = require('@surea11y/core/earl');

const report = renderEarlReport(result, {
  assertor: { name: 'surea11y', version: '1.7.0' },
  mode: 'earl:automatic'
});

fs.writeFileSync('earl.jsonld', JSON.stringify(report, null, 2));
```

## What it is for

Two audiences, and they want the same document for different reasons.

An **implementation report** tells the ACT Rules community group how this engine behaves against their test cases, which is what gets an engine listed alongside the other implementations. Listing is not endorsement and the W3C does not verify the data — the accurate phrasing is *"listed as an ACT implementation"*, never *"W3C certified"*.

A **consumer** gets an interchange format. EARL is what accessibility tooling reads when it has to combine results from more than one source — an automated scan and a manual audit, say, or several engines — because every assertion carries who asserted it and how. That is worth having whether or not anything is ever submitted anywhere.

## How it differs from the other reporters

[`SARIF.md`](./SARIF.md) and [`REPORT.md`](./REPORT.md) both carry **violations only**: a `pass` or `notApplicable` result has no occurrences, so there is nothing for them to show. EARL is the opposite. Every rule that ran becomes an assertion, `pass` and `inapplicable` included, because an implementation report is a claim about what the engine decided *everywhere*. A rule that stayed silent because it found nothing applicable is evidence, not noise — it is how a reader distinguishes "this engine checked and found nothing to check" from "this engine does not implement that rule at all".

## Shape

The graph groups by subject rather than being a flat list of assertions:

```json
{
  "@context": "https://www.w3.org/WAI/content-assets/wcag-act-rules/earl-context.json",
  "@graph": [
    {
      "@type": "TestSubject",
      "source": "https://example.test/",
      "assertions": [
        {
          "@type": "Assertion",
          "test": { "title": "img-alt-present", "isPartOf": ["WCAG2:non-text-content"] },
          "result": { "outcome": "earl:failed" },
          "assertedBy": {
            "@type": "Assertor",
            "name": "surea11y",
            "release": { "@type": "Version", "revision": "1.7.0" }
          },
          "mode": "earl:automatic"
        }
      ]
    }
  ]
}
```

- **`source`** is the scanned URL, or `about:blank` when a result carries none.
- **`test.title`** is the engine's own rule id. In ACT terms a rule is the *procedure* the implementation ran, which is exactly what a rule id names.
- **`test.isPartOf`** lists the Success Criteria that rule maps to, as `WCAG2:<criterion-id>`. Omitted entirely for a rule claiming no criterion — `aria-allowed-role` is the engine's one automatic rule in that position, and asserting an empty list would read as "maps to nothing we could find" rather than "deliberately maps to none".
- **`assertedBy`** and **`mode`** appear only when you supply them.

Criterion ids are derived from the criterion's own title (`Non-text Content` → `non-text-content`). `normativeMappings` also carries Understanding-document references and non-WCAG standards, which share `standard: "WCAG"` and a `requirement` with the real thing; a Success Criterion is the entry that states a conformance level and claims no other document type, and only those are read.

## Outcomes

| Engine | EARL |
|---|---|
| `pass` | `earl:passed` |
| `fail` | `earl:failed` |
| `cantTell` | `earl:cantTell` |
| `notApplicable` | `earl:inapplicable` |

`earl:untested` has no counterpart: a rule that did not run produces no result to assert on, so it contributes no assertion rather than an untested one.

**`cantTell` does not cost conformance credit.** ACT's own consistency rules allow an automated implementation to report "cannot tell" on some — though not all — examples and still count as consistent. What a partially consistent implementation may *not* do is produce a false positive: failing an example the rule says should pass, or that is inapplicable. That is the gate worth watching, and it is a property of the rules rather than of this reporter.

## Several results, one report

`renderEarlReport` takes an array as readily as a single result, because a report covering many pages is the normal case:

```js
renderEarlReport([homeResult, checkoutResult, searchResult], { assertor });
```

Results sharing a URL merge into one subject — a caller scanning the same page under different `engineOptions` is still describing one resource, and the context has no way to express two subjects with the same source. Where two results assert on the same rule for the same URL, the last one wins.

Output is deterministic: subjects sort by source, assertions by rule id, and the same inputs produce byte-identical output in any order. That is what makes a diff between two engine versions meaningful.

## Options

| Option | Meaning |
|---|---|
| `assertor` | `{ name, version }`. Defaults the name to `surea11y`; pass `null` to omit `assertedBy` entirely. |
| `mode` | An EARL test mode such as `'earl:automatic'`. Omitted when not supplied. |

## See also

- [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md) — the result this reads
- [`ACT_RULE_MAPPING.md`](./ACT_RULE_MAPPING.md) — which ACT rules the engine's rules correspond to
- [`API_STABILITY.md`](./API_STABILITY.md) — what is covered by semver
