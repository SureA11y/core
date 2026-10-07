# SARIF report

`--sarif <path>` writes a [SARIF 2.1.0](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html) log — the standard format GitHub Code Scanning (and other SARIF-consuming dashboards) expect — instead of, or alongside, `--json`'s raw engine result.

```sh
surea11y scan ./dist/index.html --sarif results.sarif
```

See [`CI_INTEGRATIONS.md`](./CI_INTEGRATIONS.md) for a ready-to-paste GitHub Actions workflow that runs a scan and uploads `results.sarif` to the "Security" tab.

## Why a separate format from `--json`

`--json`'s raw result (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)) is this engine's own contract, versioned and stable per [`API_STABILITY.md`](./API_STABILITY.md). SARIF is a different, externally-defined contract purpose-built for code-scanning dashboards — a `checksResults[]` entry and a SARIF `result` don't map 1:1, so this is a real conversion, not a re-serialization.

## What becomes a SARIF result

Only `fail`/`cantTell` occurrences produce SARIF results (same "violations only" framing as [`REPORT.md`](./REPORT.md)'s HTML report).

A `notApplicable` check is not always empty: a rule may attach one occurrence explaining why it had nothing to judge, which the contrast rules do when no text had a computable background. Those never become results — a consumer treats every result as an alert, and "this was not evaluated" is not one — but they are not dropped either. They are carried as `note`-level entries in `runs[0].invocations[0].toolExecutionNotifications`, each naming the rule it came from via `associatedRule.id`:

```json
"invocations": [
  {
    "executionSuccessful": true,
    "toolExecutionNotifications": [
      {
        "level": "note",
        "message": { "text": "No eligible text had computable contrast (eligible text nodes: 13). See the contrast computability rule for details." },
        "associatedRule": { "id": "contrast-minimum" }
      }
    ]
  }
]
```

A rule that did not complete (it threw: `cantTell` with no occurrences and an `error`, see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)) judged nothing, so it is no result either. It is an `error`-level notification in the same list, `"The rule <id> did not complete: <error>"`, naming the rule in `associatedRule.id`, so the gap in coverage doesn't read as a pass.

That keeps a SARIF-only pipeline from reading silence as a clean bill of health: no contrast alerts can mean the page is fine, or that contrast was never computable, and only the notice separates the two. The block is emitted only when there is something to say, so a run with nothing to report has no `invocations` key at all.

| Engine outcome | SARIF `level` | Meaning |
|---|---|---|
| `fail` | `error` | Deterministic violation — the CI-gating case. |
| `cantTell` | `warning` | Needs human review — surfaced, but shouldn't block a build on its own. |

Every rule that ran (regardless of whether it produced a result) is listed once in `runs[0].tool.driver.rules`, with `defaultConfiguration.level` set from the rule's `type`: `automatic` (fail-capable) → `error`, `manual` (capped at `cantTell`) → `warning`.

## Field mapping

| SARIF field | Source |
|---|---|
| `results[].ruleId` | `checksResults[i].ruleId` |
| `results[].message.text` | `occurrence.summary` + `occurrence.hint`. An occurrence with no summary (a custom rule's, say) uses the rule's title, or its id, since GitHub rejects a result with empty text. |
| `results[].locations[].physicalLocation.artifactLocation.uri` | The scanned target — see "Locations" below. |
| `results[].locations[].logicalLocations[].fullyQualifiedName` | `occurrence.selector`, when present. |
| `results[].partialFingerprints["surea11y/violation/v1"]` | The same `ruleId + reasonCode + html` identity key used by [`BASELINE.md`](./BASELINE.md) (`computeBaselineKey`) — a stable, content-based fingerprint rather than a position-based one, for consumers that read it. |
| `results[].partialFingerprints.primaryLocationLineHash` | A hash of that key, `<16 hex digits>:<n>`, where `n` counts a finding repeated on the page (the same broken component twice). GitHub Code Scanning matches alerts between uploads on this field alone. Its upload action computes one from the result's line when the field is missing, and a DOM finding has no line, so it stored an empty hash: alerts were matched by position, and fixing one finding could close another's alert. |
| `results[].properties.severity` / `.confidence` | `checksResults[i].severity` / `.confidence` — informational, not part of SARIF's own schema. |
| `tool.driver.rules[].properties.tags` | `accessibility`, `automatic`/`manual`, and a `wcag-<SC>` tag per WCAG Success Criterion in `meta.normativeMappings`. Understanding-document entries get no tag. Each EN 301 549 clause the result carries (only when the scan asked for them, see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#other-standards-mappings)) gets an `en301549-<clause>` tag, e.g. `en301549-9.1.1.1`: clause numbers are the same in every version that has them, so the tag carries no version. Then the rule's own `meta.tags` (a custom rule's included: `best-practice`, `images`, `acme-design-system`), without the engine's bookkeeping tags (`a11ycore`, `atomic`) and the criterion tags (`wcag111`) the `wcag-<SC>` tags already give. |
| `tool.driver.rules[].helpUri` | `meta.helpUrl`, the rule's help link, when it is an absolute `http(s)` URL; absent otherwise. |
| `tool.driver.version` | The `toolVersion` option, if given (a tool wrapping the engine passes its own); otherwise `engine.version`, the engine release that produced the result. `"0.0.0"` only for a result without one, from a release before 1.10.0. |
| `runs[0].automationDetails.id` | The `category` option, with a trailing `/` added if it has none (GitHub reads everything up to the last slash as the category). Absent when no category is given. See [Scanning at several viewport widths](#scanning-at-several-viewport-widths). |
| `runs[0].properties` | `wcagVersion`, `profile`, `optInRules` and `environment` from the result's `engine`: the conformance target the run used, so a dashboard can tell a WCAG 2.1 run from a 2.2 one, the opt-in rule tags it added beyond that target when it added any, and the conditions the page was rendered under (`layout`, `viewport`, `devicePixelRatio`, `colorScheme`, `fonts`; see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)). Omitted for results from engines that predate those fields. |

## Locations

DOM-based scanning has no line/column to report, so `physicalLocation.artifactLocation.uri` is the scanned target itself, not a source-file position:

- **Local file scans**: a file inside the current working directory is a path relative to it, forward-slashed, with each segment percent-encoded (`build%20out/index.html`). If this matches a real file in your repository, GitHub Code Scanning can render the finding as an inline annotation. A file outside the working directory is an absolute `file:` URL, not a relative path climbing out of the repository with `../`, which a consumer could not resolve.
- **URL scans**: the scanned URL itself. GitHub Code Scanning will still list the finding, but can't attach an inline annotation to a URL that isn't a file in the repository — this is inherent to how SARIF/Code Scanning associate findings with source, not a surea11y limitation. If you need inline annotations, scan the rendered HTML file (e.g. a build output artifact) rather than a live URL.

`occurrence.selector` is additionally carried as a `logicalLocations[].fullyQualifiedName`, so a consumer that reads logical locations still gets the "which element" signal even without a usable physical location.

## Scanning at several viewport widths

A layout-dependent rule can fail at one viewport width and pass at another (see [`LIMITATIONS.md`](./LIMITATIONS.md)), so a page scanned at two widths is two analyses, not one. Give each its own category:

```js
const { renderSarifReport } = require('@surea11y/core/sarif');

for (const width of [390, 1280]) {
  // ...scan the page at this width into `result`...
  fs.writeFileSync(`a11y-${width}.sarif`, renderSarifReport(result, { category: `a11y-${width}` }));
}
```

and upload each file separately. GitHub Code Scanning treats each category as its own analysis. Within one category, a later upload replaces the earlier one, and an alert missing from it is closed, so two widths uploaded under the same category would open and close a width-specific alert on every run. Since July 2025 GitHub also rejects a single SARIF file holding two runs from the same tool and category. `github/codeql-action/upload-sarif` has a `category` input that does the same job when the file carries none.

The finding's identity does not include the viewport, and does not need to: the same element with the same defect is the same finding at any width, and the category is what keeps the analyses apart. `runs[0].properties.environment` records the viewport each run used.

## Combining with `--baseline`

A generic SARIF consumer has no "known, don't gate on this" concept of its own — the only faithful way to honor a baseline in SARIF output is to omit already-known `fail` occurrences entirely, rather than downgrade them to `warning`:

```sh
surea11y scan ./dist/index.html --baseline baseline.json --sarif results.sarif
```

`cantTell` occurrences are never filtered by a baseline — the baseline mechanism only ever tracks `fail` occurrences (matching `--write-baseline`, see [`BASELINE.md`](./BASELINE.md)).

## Combining with `--html`/`--json`

`--sarif`, `--html`, and `--json` are independent output flags — pass any combination in one run; each writes/prints its own report from the same single scan.
