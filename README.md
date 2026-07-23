# a11y-core

A deterministic accessibility rules engine that runs inside a real DOM — 123 rules, standards-traceable, safe by default. The library itself has zero runtime dependencies (see [`SECURITY.md`](./SECURITY.md)); a small CLI is also included for ad hoc scans and CI.

**Mission**: match or beat the reference engine, pa11y, and QualWeb on everything that can be automated — same-or-greater rule coverage, better performance, and no false positives. See [`docs/COMPARISON.md`](./docs/COMPARISON.md) for the evidence, not just the claim.

- `fail` is reserved for deterministic, high-confidence, normative violations — never a heuristic guess.
- Deterministic output: same input, same result, every time (no built-in clock, no randomness).
- Every rule is atomic (one normative decision), standards-traceable (mapped to a WCAG Success Criterion where one applies), and fully localized.

## Install

```sh
npm install a11y-core
```

## Quickstart

### CLI — fastest way to just try it

```sh
npx a11y-core scan ./index.html
npx a11y-core scan https://example.com/
```

Static HTML only (no page JavaScript execution) — see [`docs/CLI.md`](./docs/CLI.md) for every flag, exit codes, and when you need the library instead (client-rendered content, real-browser geometry).

### Library — for your own scripts, test suites, or browser-automation code

Two runner functions, depending on where you run it (see [`docs/INTEGRATION.md`](./docs/INTEGRATION.md) for the full explanation of the difference and more patterns):

```js
// Node + jsdom (no real browser needed)
const { JSDOM } = require('jsdom');
const { runDomRulesInPage } = require('a11y-core');

const dom = new JSDOM('<img src="logo.png">', { url: 'https://example.com/', pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;

const result = runDomRulesInPage('https://example.com/', null, {}, null);
console.log(result.checksResults.filter((r) => r.outcome === 'fail'));
// -> [{ ruleId: 'a11ycore-img-alt-present', outcome: 'fail', occurrences: [...] }]
```

```js
// Puppeteer / Playwright, against a real rendered page
const { runa11yCoreInPage } = require('a11y-core');

const result = await page.evaluate(runa11yCoreInPage, 'https://example.com/', null, {}, null);
```

## What you get back

```json
{
  "engine": { "tag": "a11ycore", "schemaVersion": "1.0.0" },
  "url": "https://example.com/",
  "checksResults": [
    {
      "ruleId": "a11ycore-img-alt-present",
      "outcome": "fail",
      "severity": "serious",
      "confidence": "high",
      "occurrences": [
        { "selector": "html > body > img", "html": "<img src=\"logo.png\">", "summary": "Missing alt attribute on <img>.", "hint": "Add an alt attribute (use alt=\"\" only for decorative images)." }
      ]
    }
  ],
  "rulesResults": []
}
```

Full field-by-field reference (what every field means, what `cantTell` vs `notApplicable` means, how composite WCAG-SC rollups work): [`docs/OUTPUT_SCHEMA.md`](./docs/OUTPUT_SCHEMA.md).

## Documentation

| Doc | What's in it |
|---|---|
| [`docs/OUTPUT_SCHEMA.md`](./docs/OUTPUT_SCHEMA.md) | The full result shape — every field, every outcome value, worked examples. Start here. |
| [`docs/CLI.md`](./docs/CLI.md) | The `a11y-core scan` command — flags, exit codes, what it can and can't scan. |
| [`docs/ENGINE_OPTIONS.md`](./docs/ENGINE_OPTIONS.md) | Every `engineOptions`/`runOnly` field: selecting rules, locale, shadow DOM, contrast mode, policy, and the common `runOnly` gotcha. |
| [`docs/INTEGRATION.md`](./docs/INTEGRATION.md) | Node/jsdom vs. real-browser (Puppeteer/Playwright) usage, CI gating, browser-extension context. |
| [`docs/BINDING_AUTHORS_GUIDE.md`](./docs/BINDING_AUTHORS_GUIDE.md) | Building a *new* framework binding (Puppeteer, Cypress, ...)? What the engine gives you for free vs. what every binding has to build itself, checked against what `a11y-core-playwright` actually needed. |
| [`docs/RULE_CATALOG.md`](./docs/RULE_CATALOG.md) | All 123 rules — id, WCAG SC, level, confidence, severity. Generated; run `npm run docs:rule-catalog` to refresh. |
| [`docs/WCAG_CONFORMANCE.md`](./docs/WCAG_CONFORMANCE.md) | How rule outcomes roll up to an SC-level / A-AA-AAA conformance picture, and what that picture does and doesn't claim. |
| [`docs/POLICY.md`](./docs/POLICY.md) | The `a11y`/`generic` policy contracts — what they control and how to customize. |
| [`docs/I18N.md`](./docs/I18N.md) | Current locale coverage and how to contribute a translation. |
| [`docs/LIMITATIONS.md`](./docs/LIMITATIONS.md) | What this engine cannot do, and why — stated upfront. |
| [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) | Common gotchas, FAQ. |
| [`docs/COMPARISON.md`](./docs/COMPARISON.md) | The evidence behind the "beats the reference engine/pa11y/QualWeb" claim. |
| [`docs/RULE_AUTHORING.md`](./docs/RULE_AUTHORING.md) | How to write a new rule — the exact module contract, a critical footgun to avoid, fixture requirements. |
| [`docs/RULE_TAXONOMY.md`](./docs/RULE_TAXONOMY.md) | How rules are categorized. |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | How to add/change a rule, commit conventions, required checks before a PR. |
| [`SECURITY.md`](./SECURITY.md) | Scope, threat model, how to report a vulnerability. |
| [`CHANGELOG.md`](./CHANGELOG.md) | What changed, release to release. |
| [`ROADMAP.md`](./ROADMAP.md) | The living project plan — mission, current state, full gap-analysis history, what's next. |

## Folder layout

```
bin/
  a11y-core.js       # CLI entry point (`npx a11y-core scan ...`) — see docs/CLI.md
src/
  index.js          # public entry point (re-exports src/core.js)
  core.js            # GENERATED — do not edit directly, see "Build" below
  checks/
    automatic/        # type: 'automatic' rules — can return `fail`
    manual/            # type: 'manual' rules — advisory, capped at `cantTell`
  core/               # shared runtime: dom-runner, dom-helpers, aria-helpers, contrast-helpers
  policy/             # policy contracts (a11y / generic)
  i18n/               # locale dictionaries (en.js, fr.js)
  coverage/           # WCAG facet definitions
  catalogs/           # composite (WCAG-SC rollup) rule definitions
scripts/
  build-core.js       # bundles src/checks/**, src/core/**, src/i18n/** into src/core.js
  cross-engine/        # the the reference engine diffing tool — see docs/cross-engine-diffing.design.md
docs/                 # everything in the table above
tests/
  fixtures/            # one *-all-scenarios.html scenario page per rule
  engine-checks/        # per-rule unit + fixture-coverage tests
```

## Build & test

```sh
npm run build   # regenerate src/core.js from source
npm test        # build + run the full test suite
```

## License

[MIT](./LICENSE)
