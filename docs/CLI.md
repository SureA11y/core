# CLI

`surea11y` ships a small CLI (`bin/core.js`) for ad hoc scans and CI, on top of the library API described in [`INTEGRATION.md`](./INTEGRATION.md).

```sh
npx @surea11y/core scan ./index.html
npx @surea11y/core scan https://example.com/
```

## What it can and can't scan

The CLI reads **static HTML only** — a local file, or the raw response of an HTTP(S) GET request — and never executes page JavaScript. That means client-rendered content (anything your framework injects after page load) won't be captured, and geometry-dependent rules like `target-size-minimum` will report `notApplicable` (no real CSS layout — see [`LIMITATIONS.md`](./LIMITATIONS.md)). If you need either of those, drive a real browser yourself and use `runa11yCoreInPage` directly — see [`INTEGRATION.md`](./INTEGRATION.md) Pattern 2. The CLI is the fast path for static/server-rendered pages and CI; the library is what you reach for beyond that.

## Options

| Flag | Meaning |
|---|---|
| `--json` | Print the raw result object (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)) instead of a human-readable summary. |
| `--locale <locale>` | Output text locale (default `en`) — see [`I18N.md`](./I18N.md). |
| `--rules <ids>` | Comma-separated rule IDs — only run these. |
| `--exclude-rules <ids>` | Comma-separated rule IDs — never run these. |
| `--tags <tags>` | Comma-separated tags — e.g. `--tags wcag2a,wcag2aa` to target a conformance level (see [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md)). |
| `--context <selector>` | Scope the scan to one CSS-selected subtree. |
| `--write-baseline <path>` | Write every current `fail` occurrence to `<path>`; never fails the build. See [`BASELINE.md`](./BASELINE.md). |
| `--baseline <path>` | Gate only on occurrences not already recorded in `<path>`. See [`BASELINE.md`](./BASELINE.md). |
| `--html <path>` | Write a self-contained, browsable HTML report to `<path>`. See [`REPORT.md`](./REPORT.md). |
| `--sarif <path>` | Write a SARIF 2.1.0 report to `<path>` (e.g. for GitHub Code Scanning). See [`SARIF.md`](./SARIF.md). |
| `-h`, `--help` | Show usage. |
| `-v`, `--version` | Show the installed version. |

These map directly onto `engineOptions`/`runOnly` (see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md)) — `--rules`/`--exclude-rules` become `engineOptions.rules.include`/`.exclude`, `--tags` becomes `engineOptions.tags.include`.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Scan completed, no `fail` outcomes. |
| `1` | Scan completed, at least one `fail` outcome — the CI-gating case. |
| `2` | Usage error, or the scan itself couldn't run (bad path/URL, network failure, missing `jsdom`). |

`cantTell` outcomes never affect the exit code — they're printed as a "needs human review" summary, consistent with the manual/`cantTell` mental model in [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md#should-i-treat-canttell-as-a-failure). If you need `cantTell`-aware gating, use `--json` and inspect `checksResults` yourself, or call the library directly (see [`INTEGRATION.md`](./INTEGRATION.md#ci-gating-a-build-on-the-result)).

With `--baseline`, exit code `1` means at least one *new* (not-yet-baselined) `fail` occurrence, not any `fail` occurrence — see [`BASELINE.md`](./BASELINE.md).

## Baseline / allowlist

For an existing, imperfect site, gating on every `fail` on day one is often an adoption blocker. `--write-baseline`/`--baseline` let you accept the current state once and gate CI only on genuinely new violations from then on:

```sh
surea11y scan ./dist/index.html --write-baseline baseline.json   # once, commit the file
surea11y scan ./dist/index.html --baseline baseline.json         # in CI, from then on
```

See [`BASELINE.md`](./BASELINE.md) for the matching semantics, file format, and known limitations.

## HTML report

For a browsable view of a scan's results — hero summary, WCAG rollup grouped by conformance level, and a searchable/filterable occurrence table — rather than raw JSON or a terminal summary:

```sh
surea11y scan ./dist/index.html --html report.html
```

Open `report.html` directly from disk; no server, no external assets. Works alongside any other output mode. See [`REPORT.md`](./REPORT.md).

## SARIF report

For GitHub Code Scanning or another SARIF-consuming dashboard:

```sh
surea11y scan ./dist/index.html --sarif results.sarif
```

Works alongside any other output mode, and alongside `--baseline` (already-known `fail` occurrences are omitted from the SARIF output rather than re-reported). See [`SARIF.md`](./SARIF.md).

## In CI

```sh
npx @surea11y/core scan ./dist/index.html || exit 1
```

Or, since the exit code already reflects pass/fail, just let the command's own exit code propagate — most CI systems fail the step automatically on a non-zero exit. See [`CI_INTEGRATIONS.md`](./CI_INTEGRATIONS.md) for ready-to-paste GitHub Actions and Bitbucket Pipelines templates, including a SARIF-upload example.

## A note on dependencies

The CLI is the one part of this package that depends on `jsdom` — `require('@surea11y/core')` as a library never loads it (see [`SECURITY.md`](../SECURITY.md)). If you only ever use the library API directly against your own DOM (jsdom, a real browser, whatever you already have), you're not paying for `jsdom` a second time.
