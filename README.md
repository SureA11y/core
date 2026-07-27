# surea11y

**surea11y runs automated accessibility tests against a real DOM** — 125 rules, standards-traceable, safe by default. Point it at a static HTML file or a URL, or run it inside a real rendered page — via Puppeteer, Playwright, Selenium, Cypress, or any other browser-automation driver — and it tells you exactly what fails a WCAG Success Criterion, where, and why — no browser extension, no dashboard sign-up, just a function call or a CLI command.

What makes it trustworthy enough to gate a build on:

- **No false alarms by design.** `fail` is reserved for deterministic, high-confidence, normative violations — never a heuristic guess. Where certainty isn't possible, the result says so (`cantTell`) instead of forcing a guess into a `pass`/`fail`.
- **Deterministic, every time.** Same input, same result — no built-in clock, no randomness, nothing that can make a CI run flaky.
- **Every rule is atomic and traceable.** One normative decision per rule, mapped to a WCAG Success Criterion where one applies, with a machine-readable rule ID and a human-readable hint for fixing it.
- **Zero runtime dependencies in the library itself** (see [`SECURITY.md`](./SECURITY.md)) — the CLI is the only part that pulls in `jsdom`, and only if you use it.
- **Runs anywhere your DOM does — jsdom or a real browser, each with real tradeoffs.** See "Static HTML vs. a live browser" below before picking one.
- **Fully localized output** (English, French, more on the way) without sacrificing stable, locale-independent rule IDs and machine-readable keys.
- **Extensible.** Register custom rules at scan time, filter by rule ID/tag/WCAG version, or scan several regions of a page in a single pass.

## Static HTML vs. a live browser

This is the decision that determines what content the engine can actually see — pick wrong and you'll get clean results on a page that isn't really accessible.

- **CLI (`scan ./file.html` / `scan <url>`) and jsdom (`runDomRulesInPage`) — no JavaScript execution, no real CSS layout engine.** These parse markup as text/fetch it as-is; a URL scan sees exactly what the server sent, not what the page looks like after client JS runs. Fine for static or server-rendered HTML. Blind to anything a client-side framework adds after load — SPA content, hydration-driven attribute changes, modals/dropdowns that only exist post-interaction. Layout-dependent rules (`target-size-minimum`, most notably) report `notApplicable` rather than guess, since jsdom has no real `getBoundingClientRect()`.
- **A real browser (`runa11yCoreInPage`, run inside a live page — Puppeteer/Playwright's `page.evaluate`, Selenium's `execute_script`, Cypress's in-browser test code, a browser extension, or any other driver that can run code in the page) — sees the fully rendered, post-JS, post-hydration DOM and real computed layout.** Required for client-rendered apps, and for accurate results on layout-dependent rules.

Full detail on both: [`docs/LIMITATIONS.md`](./docs/LIMITATIONS.md) (everything each mode structurally can't see) and [`docs/INTEGRATION.md`](./docs/INTEGRATION.md) (the two patterns, in depth, with working code).

## Install

```sh
npm install @surea11y/core
```

## Quickstart

### CLI — fastest way to just try it

```sh
npx @surea11y/core scan ./index.html
npx @surea11y/core scan https://example.com/
```

Static HTML only (no page JavaScript execution) — see [`docs/CLI.md`](./docs/CLI.md) for every flag, exit codes, and when you need the library instead (client-rendered content, real-browser geometry).

### Library — for your own scripts, test suites, or browser-automation code

Two runner functions, depending on where you run it (see [`docs/INTEGRATION.md`](./docs/INTEGRATION.md) for the full explanation of the difference and more patterns):

```js
// Node + jsdom (no real browser needed)
const { JSDOM } = require('jsdom');
const { runDomRulesInPage } = require('@surea11y/core');

const dom = new JSDOM('<img src="logo.png">', { url: 'https://example.com/', pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;

const result = runDomRulesInPage('https://example.com/', null, {}, null);
console.log(result.checksResults.filter((r) => r.outcome === 'fail'));
// -> [{ ruleId: 'img-alt-present', outcome: 'fail', occurrences: [...] }]
```

```js
// Puppeteer / Playwright, against a real rendered page
const { runa11yCoreInPage } = require('@surea11y/core');

const result = await page.evaluate(runa11yCoreInPage, 'https://example.com/', null, {}, null);
```

`runa11yCoreInPage` is fully self-contained (see [`docs/INTEGRATION.md`](./docs/INTEGRATION.md)), so it isn't Puppeteer/Playwright-specific — the same function works with Selenium's `execute_script`, runs natively in Cypress's in-browser test code, or in a browser extension content script. Puppeteer/Playwright are just the two shown here.

## What you get back

```json
{
  "engine": { "tag": "a11ycore", "schemaVersion": "1.0.0" },
  "url": "https://example.com/",
  "checksResults": [
    {
      "ruleId": "img-alt-present",
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
| [`docs/CLI.md`](./docs/CLI.md) | The `surea11y scan` command — flags, exit codes, what it can and can't scan. |
| [`docs/ENGINE_OPTIONS.md`](./docs/ENGINE_OPTIONS.md) | Every `engineOptions`/`runOnly` field: selecting rules, locale, shadow DOM, contrast mode, policy, and the common `runOnly` gotcha. |
| [`docs/INTEGRATION.md`](./docs/INTEGRATION.md) | Node/jsdom vs. real-browser (Puppeteer, Playwright, Selenium, Cypress, or any driver) usage, CI gating, browser-extension context. |
| [`docs/BINDING_AUTHORS_GUIDE.md`](./docs/BINDING_AUTHORS_GUIDE.md) | Building a *new* framework binding (Puppeteer, Cypress, ...)? What the engine gives you for free vs. what every binding has to build itself, checked against what `surea11y-playwright` actually needed. |
| [`docs/RULE_CATALOG.md`](./docs/RULE_CATALOG.md) | All 125 rules — id, WCAG SC, level, confidence, severity. Generated; run `npm run docs:rule-catalog` to refresh. |
| [`docs/WCAG_CONFORMANCE.md`](./docs/WCAG_CONFORMANCE.md) | How rule outcomes roll up to an SC-level / A-AA-AAA conformance picture, and what that picture does and doesn't claim. |
| [`docs/POLICY.md`](./docs/POLICY.md) | The `a11y`/`generic` policy contracts — what they control and how to customize. |
| [`docs/I18N.md`](./docs/I18N.md) | Current locale coverage and how to contribute a translation. |
| [`docs/LIMITATIONS.md`](./docs/LIMITATIONS.md) | What this engine cannot do, and why — stated upfront. |
| [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) | Common gotchas, FAQ. |
| [`docs/RULE_AUTHORING.md`](./docs/RULE_AUTHORING.md) | How to write a new rule — the exact module contract, a critical footgun to avoid, fixture requirements. |
| [`docs/RULE_TAXONOMY.md`](./docs/RULE_TAXONOMY.md) | How rules are categorized. |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | How to add/change a rule, commit conventions, required checks before a PR. |
| [`SECURITY.md`](./SECURITY.md) | Scope, threat model, how to report a vulnerability. |
| [`CHANGELOG.md`](./CHANGELOG.md) | What changed, release to release. |

## Folder layout

```
bin/
  core.js       # CLI entry point (`npx @surea11y/core scan ...`) — see docs/CLI.md
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
