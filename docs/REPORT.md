# HTML report

A self-contained HTML report you can open in a browser after a scan — no server, no external assets, no network requests. Built for QA/manual testers who want a browsable view of a scan's results rather than raw JSON or a terminal summary.

```sh
surea11y scan ./dist/index.html --html report.html
```

Open `report.html` directly from disk. Works alongside any other output mode — `--html` doesn't replace `--json`/the default summary, it's an additional artifact written to the given path.

## What it shows

- **Hero**: one plain-language headline ("N of M applicable checks passed") plus a stacked bar and legend (icon + label + count — status is never color-only) broken down by outcome (`fail`/`cantTell`/`pass`/`notApplicable`).
- **Worth reviewing**: one card per rule with `fail`/`cantTell` occurrences (not one per occurrence — a rule with many identical occurrences is one thing worth attention, not many), each showing severity, WCAG SC chip(s), a representative occurrence, and the total occurrence count. Capped at the 24 highest-priority rules with an overflow note past that.
- **WCAG rollup**: grouped by conformance level (A / AA / AAA), sourced directly from the engine's own `rulesResults[]` composite rollups (`docs/WCAG_CONFORMANCE.md`) — one row per Success Criterion (with the EN 301 549 clause that restates it, where there is one and the scan asked for EN 301 549 clauses), its outcome, a pass/fail/needs-review/n/a breakdown, and which atomic rules contributed. This is real engine data, not an invented grouping — the same rollup you'd get from the raw JSON's `rulesResults`.
- **Full technical data** (collapsed by default): a scorecard (tiles per outcome) and a searchable, filterable (by outcome), paginated table of every individual occurrence across the whole scan.

The meta bar under the header carries the rule count, occurrence count, engine tag, schema version, the WCAG version the scan targeted and the `engineOptions.profile` it used (when there was one), and the locale the scan resolved to. Locale fallback is per-string and invisible in the text itself, so a report requested in a language the engine does not carry reads as an ordinary English one — the chip names the requested locale alongside the resolved one when the two differ. See [`I18N.md`](./I18N.md).

The whole page is written in the locale the scan resolved to: headings, table columns, outcome and severity names, the headline, the pager, and the date format, all from the `report_*` keys in the same dictionaries as the findings. `<html lang>` names that locale. The outcome codes in the occurrence filters (`fail`, `cantTell`, …) stay as they are, because they are the values a reader searches for in the JSON result.

One case keeps English labels: a scan in a language the engine does not ship, run with a caller-supplied `engineOptions.messages` dictionary. That dictionary is not part of the result, so the report cannot read labels from it; its findings are then marked with their own language (`lang="nl"`, for instance), so a screen reader still reads them with the right voice.

## Library usage

```js
const { renderHtmlReport } = require('@surea11y/core/report');
const { runDomRulesInPage } = require('@surea11y/core');

const result = runDomRulesInPage(url, null, {}, null);
const html = renderHtmlReport(result, { title: 'My scan report' });
require('fs').writeFileSync('report.html', html);
```

`renderHtmlReport(result, options)` is a pure function — it returns a string, it never touches the filesystem itself (the CLI's `--html` flag does the writing). `options.title` is optional (defaults to `"surea11y scan report"`).

## Scope

This is a single-scan report — one point-in-time snapshot, not a dashboard tracking results across many scans over time. Tracking results across many runs is a separate, larger concern and isn't part of this tool: keep the JSON from each scan and diff it yourself, or feed SARIF to a dashboard that already does history ([`SARIF.md`](./SARIF.md)).
