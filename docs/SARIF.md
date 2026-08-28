# SARIF report

`--sarif <path>` writes a [SARIF 2.1.0](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html) log — the standard format GitHub Code Scanning (and other SARIF-consuming dashboards) expect — instead of, or alongside, `--json`'s raw engine result.

```sh
surea11y scan ./dist/index.html --sarif results.sarif
```

See [`CI_INTEGRATIONS.md`](./CI_INTEGRATIONS.md) for a ready-to-paste GitHub Actions workflow that runs a scan and uploads `results.sarif` to the "Security" tab.

## Why a separate format from `--json`

`--json`'s raw result (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)) is this engine's own contract, versioned and stable per [`API_STABILITY.md`](./API_STABILITY.md). SARIF is a different, externally-defined contract purpose-built for code-scanning dashboards — a `checksResults[]` entry and a SARIF `result` don't map 1:1, so this is a real conversion, not a re-serialization.

## What becomes a SARIF result

Only `fail`/`cantTell` occurrences produce SARIF results — a `pass`/`notApplicable` check has no occurrences to report at all (same "violations only" framing as [`REPORT.md`](./REPORT.md)'s HTML report).

| Engine outcome | SARIF `level` | Meaning |
|---|---|---|
| `fail` | `error` | Deterministic violation — the CI-gating case. |
| `cantTell` | `warning` | Needs human review — surfaced, but shouldn't block a build on its own. |

Every rule that ran (regardless of whether it produced a result) is listed once in `runs[0].tool.driver.rules`, with `defaultConfiguration.level` set from the rule's `type`: `automatic` (fail-capable) → `error`, `manual` (capped at `cantTell`) → `warning`.

## Field mapping

| SARIF field | Source |
|---|---|
| `results[].ruleId` | `checksResults[i].ruleId` |
| `results[].message.text` | `occurrence.summary` + `occurrence.hint` |
| `results[].locations[].physicalLocation.artifactLocation.uri` | The scanned target — see "Locations" below. |
| `results[].locations[].logicalLocations[].fullyQualifiedName` | `occurrence.selector`, when present. |
| `results[].partialFingerprints["surea11y/violation/v1"]` | The same `ruleId + reasonCode + html` identity key used by [`BASELINE.md`](./BASELINE.md) (`computeBaselineKey`) — a stable, content-based fingerprint rather than a position-based one. |
| `results[].properties.severity` / `.confidence` | `checksResults[i].severity` / `.confidence` — informational, not part of SARIF's own schema. |
| `tool.driver.rules[].properties.tags` | `accessibility`, `automatic`/`manual`, and a `wcag-<SC>` tag per `meta.normativeMappings[].requirement`. |

## Locations

DOM-based scanning has no line/column to report, so `physicalLocation.artifactLocation.uri` is the scanned target itself, not a source-file position:

- **Local file scans**: a path relative to the current working directory (forward-slashed). If this matches a real file in your repository, GitHub Code Scanning can render the finding as an inline annotation.
- **URL scans**: the scanned URL itself. GitHub Code Scanning will still list the finding, but can't attach an inline annotation to a URL that isn't a file in the repository — this is inherent to how SARIF/Code Scanning associate findings with source, not a surea11y limitation. If you need inline annotations, scan the rendered HTML file (e.g. a build output artifact) rather than a live URL.

`occurrence.selector` is additionally carried as a `logicalLocations[].fullyQualifiedName`, so a consumer that reads logical locations still gets the "which element" signal even without a usable physical location.

## Combining with `--baseline`

A generic SARIF consumer has no "known, don't gate on this" concept of its own — the only faithful way to honor a baseline in SARIF output is to omit already-known `fail` occurrences entirely, rather than downgrade them to `warning`:

```sh
surea11y scan ./dist/index.html --baseline baseline.json --sarif results.sarif
```

`cantTell` occurrences are never filtered by a baseline — the baseline mechanism only ever tracks `fail` occurrences (matching `--write-baseline`, see [`BASELINE.md`](./BASELINE.md)).

## Combining with `--html`/`--json`

`--sarif`, `--html`, and `--json` are independent output flags — pass any combination in one run; each writes/prints its own report from the same single scan.
