# @surea11y/core

<a href="https://www.npmjs.com/package/@surea11y/core"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/SureA11y/core/main/docs/assets/brand-tag-dark.svg"><img alt="surea11y core" src="https://raw.githubusercontent.com/SureA11y/core/main/docs/assets/brand-tag-light.svg"></picture></a>
[![Test](https://github.com/SureA11y/core/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/SureA11y/core/actions/workflows/test.yml)
[![npm](https://img.shields.io/npm/v/@surea11y/core?style=flat-square&label=npm&labelColor=101413&color=3A4441)](https://www.npmjs.com/package/@surea11y/core)
[![node](https://img.shields.io/node/v/@surea11y/core?style=flat-square&label=node&labelColor=101413&color=3A4441)](package.json)
[![license](https://img.shields.io/badge/license-MPL--2.0-3A4441?style=flat-square&labelColor=101413)](LICENSE)

> **Accessibility testing that tells you what it can't tell you.**

surea11y is an accessibility engine for teams that need to know what automated
testing *can't* establish. It reports findings, non-findings, and — unusually —
explicit uncertainty, so results are auditable rather than reassuring.

*Sure* means certainty about what is known, and honesty about what isn't.

It runs against either static HTML or fully rendered browser pages, producing
deterministic, standards-traceable results suitable for local development,
automated testing and CI/CD pipelines.

Unlike browser extensions or cloud-based services, surea11y is a library-first
project. You install it, run it where your code runs, and receive structured
results that can be consumed by people, scripts or reporting tools.

## What automated testing can and cannot do

Automated tools are commonly reckoned to catch somewhere around a third of WCAG
issues. The remainder require human judgement. That ceiling is a property of
static analysis itself, not a gap in any particular tool.

surea11y's answer is to be explicit about which side of that line every result
falls on. Each rule makes a single deterministic decision:

- **`fail`** — a violation provable from the DOM. Reserved for objective,
  normative cases.
- **`pass`** — this rule's specific condition is met. Not a claim that the page
  is accessible.
- **`cantTell`** — a human has to decide this, and the result says what was
  ambiguous.
- **`notApplicable`** — the rule's precondition isn't present.

`cantTell` is the point of the project. An engine that quietly discards what it
cannot determine produces a shorter report and a false sense of coverage.

### Checked against the ACT corpus

Every rule with a [W3C ACT Rules](https://act-rules.github.io/) counterpart runs
against ACT's own published test cases: 798 examples across 58 rules. The engine
fails none of the examples ACT marks `passed` or `inapplicable`, so it reports no
false positives against that corpus. Where it cannot decide a case it returns
`cantTell`, which ACT permits for an automated implementation.

Thirty-one examples ACT marks `failed` go unflagged. Most are judgement calls,
such as whether a heading describes the content under it.
[`docs/ACT_RULE_MAPPING.md`](./docs/ACT_RULE_MAPPING.md) lists every one with the
reasoning, and `node scripts/act-testcase-check.js` reproduces the figures. They
cover the rules that have an ACT counterpart.

The [EARL implementation report](https://surea11y.github.io/act-report/act-report.jsonld)
records the outcome for every one of those cases, passes and inapplicable
results included, so a rule that stayed silent because nothing applied is
distinguishable from one that is not implemented. `node scripts/act-report.js`
regenerates it against the corpus as it stands rather than a snapshot, and a
scheduled job republishes it weekly and on release.

## What this engine does not detect

Keyboard traps, reflow and clipping at 400% zoom, anything that only exists
after a click or an async load, and judgement calls such as whether a heading is
meaningful — these lie outside what a static DOM scan can establish. Each is a
reasoned decision rather than an oversight.

[`docs/LIMITATIONS.md`](./docs/LIMITATIONS.md) lists them in full with the
reasoning for each. A `pass` from this engine — or from any automated tool — is
never a substitute for the manual review WCAG itself requires.

### Key principles

- **Deterministic execution.** The same input always produces the same
  output.
- **Conservative by design.** `fail` is reserved for objective,
  normative violations, minimizing false alarms.
- **Standards traceability.** Rules map to the applicable WCAG Success
  Criterion whenever appropriate.
- **Stable machine-readable output.** Rule identifiers remain stable
  regardless of language.
- **Framework independent.** Run inside jsdom or any browser
  automation framework.
- **Extensible.** Add custom rules, register policies and filter scans
  by rule IDs, tags or WCAG version.
- **Localized reporting.** Human-readable messages can be translated
  without affecting machine-readable data. Ships with `en`, `fr`, `de`,
  and `es` today — see [`docs/I18N.md`](./docs/I18N.md) to use one or
  contribute another.

---

## Choosing the right execution model

surea11y supports two complementary execution models. Choosing the
correct one is essential because it determines which parts of the page
the engine can inspect.

### Static HTML

The CLI (`scan file.html` or `scan https://example.com`) and
`runDomRulesInPage()` analyse HTML without executing page JavaScript.

This approach is ideal for:

- static websites;
- server-side rendered applications;
- generated documentation;
- pre-rendered HTML.

Because JavaScript is never executed, the engine cannot inspect content
added after page load. Likewise, rules requiring real layout information
cannot be evaluated and will report `notApplicable` instead of making
assumptions.

### Fully rendered browser

`runa11yCoreInPage()` executes directly inside a live browser page.

This allows the engine to inspect:

- client-rendered applications;
- hydrated pages;
- computed styles;
- runtime DOM changes;
- layout-dependent rules.

The function is browser-agnostic and can be executed through Puppeteer,
Playwright, Selenium, Cypress or any environment capable of evaluating
JavaScript inside the page.

For a detailed comparison of both execution models, see
`docs/LIMITATIONS.md` and `docs/INTEGRATION.md`.

---

## Which package do I need?

surea11y is a family of packages sharing one engine. Install the one that
matches how you test — each pulls in `@surea11y/core` for you.

| I want to… | Install |
|---|---|
| Add accessibility checks to **Playwright** tests | [`@surea11y/playwright`](https://github.com/SureA11y/playwright#readme) |
| …**Puppeteer** | [`@surea11y/puppeteer`](https://github.com/SureA11y/puppeteer#readme) |
| …**Selenium** | [`@surea11y/selenium`](https://github.com/SureA11y/selenium#readme) |
| …**Cypress** | [`@surea11y/cypress`](https://github.com/SureA11y/cypress#readme) |
| …**WebdriverIO** | [`@surea11y/webdriverio`](https://github.com/SureA11y/webdriverio#readme) |
| Assert in **Jest or Vitest** component tests | [`@surea11y/test-matchers`](https://github.com/SureA11y/test-matchers#readme) |
| Scan static HTML from a **terminal or CI pipeline** | [`@surea11y/cli`](https://github.com/SureA11y/cli#readme) |
| Run the engine against **a DOM I already have** | `@surea11y/core` (this package) |

The rest of this README covers `@surea11y/core` itself.

---

## Installation

Install the core package from npm:

```bash
npm install @surea11y/core
```

The core engine has **zero runtime dependencies**. Installing it pulls
nothing else into your tree, which keeps it lightweight and suitable for
embedding into your own tooling.

The engine needs a DOM to read, but it never creates one — you supply it,
whether that's jsdom, a Playwright page, or the live document in a
browser. That is why nothing is installed on your behalf.

---

## Quick Start

### CLI

The CLI ships as a separate package, [`@surea11y/cli`](https://www.npmjs.com/package/@surea11y/cli),
so that installing the engine never pulls a DOM implementation into
projects that already have one:

```bash
npx @surea11y/cli scan ./index.html
npx @surea11y/cli scan https://example.com/
```

The CLI analyses static HTML. It does not execute client-side
JavaScript, making it ideal for static sites and server-rendered
applications.

For available options, exit codes and advanced usage, see the
[CLI documentation](https://github.com/SureA11y/cli#readme).

---

### Library

surea11y exposes two entry points depending on where your code executes.

#### Node.js + jsdom

Use `runDomRulesInPage()` when your application already has a DOM
available through jsdom. jsdom is not a dependency of this package, so
install it alongside if you don't already have it:

```bash
npm install jsdom
```

```js
const { JSDOM } = require("jsdom");
const { runDomRulesInPage } = require("@surea11y/core");

const dom = new JSDOM('<img src="logo.png">', {
  url: "https://example.com/",
  pretendToBeVisual: true
});

global.window = dom.window;
global.document = dom.window.document;

const result = runDomRulesInPage(
  "https://example.com/", // pageUrl
  null,                   // contextSelector
  {},                     // engineOptions
  null                    // runOnly
);

console.log(
  result.checksResults.filter(r => r.outcome === "fail")
);
```

This approach is fast, simple and requires no browser installation. It
is best suited for static HTML and server-rendered pages.

---

#### Real browser execution

For client-rendered applications, execute the engine inside the page
itself.

```js
// Puppeteer
const { runa11yCoreInPage } = require("@surea11y/core");

const result = await page.evaluate(
  runa11yCoreInPage,
  "https://example.com/", // pageUrl
  null,                   // contextSelector
  {},                     // engineOptions
  null                    // runOnly
);
```

`runa11yCoreInPage` is self-contained (its whole rule catalog is
inlined), so it works unmodified with any framework capable of
evaluating a function inside the page — Puppeteer, Selenium, Cypress,
browser extensions and custom drivers can all call it exactly as
shown above. **Playwright is the one exception**: its `page.evaluate()`
only accepts a single argument alongside the function, so
`runa11yCoreInPage` needs a one-argument wrapper instead of four
positional arguments — see `docs/INTEGRATION.md` for the exact pattern.

This allows the engine to inspect the fully rendered DOM exactly as
users experience it.

For complete integration examples, see `docs/INTEGRATION.md`.

---

#### Standalone browser bundle

For a page that isn't driven by an automation framework at all — a manual
QA pass, a bookmarklet, a browser extension — the package also ships a
self-contained bundle that needs no `require`, no bundler, and no build
step:

```html
<script src="node_modules/@surea11y/core/surea11y.browser.js"></script>
<script>
  const result = a11ycore.runa11yCoreInPage(
    location.href, // pageUrl
    null,           // contextSelector
    {},             // engineOptions
    null            // runOnly
  );

  console.log(result.checksResults.filter(r => r.outcome === "fail"));
</script>
```

Loading `surea11y.browser.js` defines a single global, `a11ycore`, exposing
the same `runa11yCoreInPage` function described above — calling it runs a
real scan against the page it's loaded into and returns the same result
shape documented in [Understanding the Results](#understanding-the-results).

The bundle carries English only, to keep the download from growing with
every language added. For another language, load its file after the bundle:

```html
<script src="node_modules/@surea11y/core/surea11y.browser.js"></script>
<script src="node_modules/@surea11y/core/surea11y.i18n.fr.js"></script>
<script>
  const result = a11ycore.runa11yCoreInPage(location.href, null, { locale: "fr" }, null);
</script>
```

Ask for a language you haven't loaded and you get English rather than an
error, with `result.engine.locale` saying so. The npm package is
unaffected — `require("@surea11y/core")` has every locale built in. See
[`docs/I18N.md`](./docs/I18N.md).

`contextSelector`, `engineOptions`, and `runOnly` are the same three
arguments described throughout this README and `docs/ENGINE_OPTIONS.md` —
nothing about calling the engine changes just because it's loaded this
way. A scan scoped to one region, filtered to a specific WCAG level, with
a couple of known-noisy selectors excluded, looks like this:

```html
<script src="node_modules/@surea11y/core/surea11y.browser.js"></script>
<script>
  const result = a11ycore.runa11yCoreInPage(
    location.href,
    "#main",                                     // contextSelector: scan only this region
    {
      excludeSelectors: ["#cookie-banner", ".intercom-launcher"],
      contrast: { mode: "auditorAssist" }         // trade some false-positive protection for more findings
    },
    { tags: ["wcag2a", "wcag2aa"] }               // runOnly: WCAG 2.0 A/AA rules only
  );

  console.log(result.checksResults.filter(r => r.outcome === "fail"));
</script>
```

This bundle is generated from the same rule sources as the rest of the
engine (`npm run build` regenerates it alongside `src/core.js`), so its
behavior never drifts from the library's. It intentionally exposes only
`runa11yCoreInPage` — cross-frame scanning
(`runa11yCoreAcrossFrames`/`a11yCoreEnableFrameResponder`) requires the
embedded frame to also load the engine and opt in, which doesn't fit a
single dropped-in `<script>` tag; reach for the npm package directly if
you need that.

---

## Understanding the Results

Every scan returns a structured JSON document designed for both
developers and automated tooling.

A simplified example looks like this:

```json
{
  "engine": {
    "tag": "a11ycore",
    "schemaVersion": "1.0.0",
    "locale": { "requested": "en", "resolved": "en", "reason": "ok" }
  },
  "url": "https://example.com/",
  "checksResults": [
    {
      "ruleId": "img-alt-present",
      "outcome": "fail",
      "severity": "serious",
      "confidence": "high",
      "occurrences": [
        {
          "selector": "html > body > img",
          "summary": "Missing alt attribute on <img>.",
          "hint": "Add an alt attribute or use alt=\"\" for decorative images."
        }
      ]
    },
    {
      "ruleId": "link-name-quality-manual",
      "outcome": "cantTell",
      "severity": "minor",
      "confidence": "medium",
      "occurrences": [
        {
          "selector": "html > body > a:nth-child(3)",
          "summary": "Link text may not be descriptive enough out of context.",
          "hint": "Confirm the link text clearly describes its destination or purpose."
        }
      ]
    }
  ]
}
```

The second result illustrates the engine's conservative stance: it can
confirm a link has text, but whether that text is actually descriptive
requires human judgement, so it reports `cantTell` instead of guessing.

Each finding contains enough information to answer four questions:

- **What failed?** (`ruleId`)
- **Why did it fail?** (`summary`)
- **Where did it fail?** (`selector` and occurrences)
- **How can it be fixed?** (`hint`)

The complete schema also includes confidence, severity, WCAG
traceability, composite rule results and other metadata intended for
reporting and automation.

For a complete field-by-field reference, see `docs/OUTPUT_SCHEMA.md`.

---

## Documentation

The project documentation is organized by topic so you can start quickly
and progressively explore more advanced features.

| Document | Description |
|---|---|
| `docs/OUTPUT_SCHEMA.md` | Complete description of every field returned by the engine. |
| `docs/API_STABILITY.md` | Semver guarantees on the result shape, and the rule-ID deprecation policy. |
| `docs/BASELINE.md` | CI baseline/allowlist: gate builds only on new violations. |
| `docs/REPORT.md` | Self-contained HTML report: browsable summary, WCAG rollup, filterable occurrence table. |
| `docs/SARIF.md` | SARIF 2.1.0 report for GitHub Code Scanning and other SARIF dashboards. |
| `docs/EARL.md` | EARL 1.0 report in JSON-LD: the W3C interchange format, and the ACT implementation-report format. |
| `docs/CI_INTEGRATIONS.md` | GitHub Actions and Bitbucket Pipelines templates wrapping the CLI. |
| `docs/ENGINE_OPTIONS.md` | Configuration, filtering, policies and localization. |
| `docs/INTEGRATION.md` | Using surea11y with jsdom, Playwright, Puppeteer, Selenium, Cypress and other drivers. |
| `docs/BINDING_AUTHORS_GUIDE.md` | Building new framework integrations on top of the engine. |
| `docs/RULE_CATALOG.md` | Reference of every built-in accessibility rule. |
| `docs/WCAG_CONFORMANCE.md` | Understanding WCAG rollups and conformance reporting. |
| `docs/POLICY.md` | Built-in policy contracts and customization. |
| `docs/I18N.md` | Translation support and localization. |
| `docs/LIMITATIONS.md` | Structural limitations of automated accessibility testing. |
| `docs/TROUBLESHOOTING.md` | Frequently asked questions and common issues. |
| `docs/RULE_AUTHORING.md` | Writing custom accessibility rules. |
| `docs/RULE_HELPERS.md` | Reference for every `ctx.helpers` function available to a rule. |
| `docs/RULE_TAXONOMY.md` | Rule categorization model. |
| `docs/ACT_RULE_MAPPING.md` | Which ACT rules this engine implements, which it doesn't, and where the two differ by design. |
| `docs/DESIGN_CHALLENGES.md` | Open and settled design questions, each with the reasoning behind the call. |
| `docs/ARIA_DEPRECATION.md` | How deprecated ARIA roles and attributes are graded, and how to apply a later spec revision. |
| `CONTRIBUTING.md` | Contributing guidelines. |
| `GOVERNANCE.md` | Who decides what, and the license commitment. |
| `SUPPORT.md` | Where to ask, and what response to expect. |
| `SECURITY.md` | Security policy and vulnerability reporting. |
| `CHANGELOG.md` | Release history. |

---

## Philosophy

surea11y is built on a simple principle:

> Automate what can be determined objectively. Never pretend to automate
> what cannot.

Some WCAG requirements can be checked with complete confidence. Others
need human judgement, knowledge of context, or usability evaluation. A
single score or a pass/fail verdict flattens that difference; surea11y
reports it.

This is why `cantTell` and `notApplicable` exist as outcomes, and it
shapes every rule in the engine.

### What surea11y won't catch

Being explicit about the boundaries of automation is part of the same
philosophy. For example, surea11y will not:

- confirm that alt text is *meaningful*, only that it is present
  (an alt attribute of `"image123.png"` passes the objective check);
- judge whether a color contrast choice is aesthetically appropriate,
  only whether it meets the applicable contrast ratio;
- determine whether an error message actually *explains* the problem,
  since that depends on validation logic a static scan can't see;
- detect a keyboard focus trap or content clipped at 400% zoom, since
  both require simulating real user interaction over time, not just
  reading the DOM at one instant.

These are the cases where the engine reports `cantTell`, and where a
human reviewer's judgement remains necessary. See
`docs/LIMITATIONS.md` for the complete list of structural limitations.

---

## Project Structure

The repository is organised so that the accessibility engine, rule
implementations and supporting infrastructure remain clearly separated.

```text
surea11y.browser.js        # Generated standalone browser bundle (English)
surea11y.i18n.<locale>.js  # Generated per-locale side files for that bundle

src/
  index.js                 # Public API
  core.js                  # Generated runtime bundle
  baseline.js              # Baseline entry point (@surea11y/core/baseline)
  report.js                # HTML report entry point (@surea11y/core/report)
  sarif.js                 # SARIF entry point (@surea11y/core/sarif)
  earl.js                  # EARL entry point (@surea11y/core/earl)

  checks/
    automatic/             # Deterministic automated rules
    manual/                # Advisory rules (maximum outcome: cantTell)

  core/                    # Shared engine runtime
  policy/                  # Policy implementations
  i18n/                    # Localized messages (JSON, one file per locale)
  coverage/                # WCAG coverage definitions
  catalogs/                # Composite rule catalogs
  explain/                 # Occurrence grouping, internal

scripts/
  build-core.js            # Generates src/core.js
  build-browser.js         # Generates the browser bundle and its locale side files
  generate-*.js            # Generated docs and data tables (each supports --check)
  validate-*.js            # Rule module contract checks
  i18n-*.js                # Locale scaffolding, sync and coverage reporting

coverage/                  # Generated WCAG facet coverage report
docs/                      # Project documentation

tests/
  fixtures/                # Rule fixtures, plus the generated fixture index
  engine-checks/           # Per-rule tests
  core/ helpers/ i18n/     # Engine internals, shared test helpers, locale tests
```

Everything under `src/` other than the entry points above is internal — see
[`docs/API_STABILITY.md`](./docs/API_STABILITY.md) for what the `exports` map
actually promises.

This separation allows the engine to evolve independently from framework
integrations while keeping the rule authoring experience consistent.

---

## Building the Project

After cloning the repository, regenerate the bundled runtime:

```bash
npm run build
```

To execute the complete test suite:

```bash
npm test
```

The test suite validates rule behaviour, fixture coverage and overall
engine consistency to ensure deterministic results across releases.

---

## Contributing

Contributions are welcome.

Bug fix, documentation, or a new rule — the same principles apply:

- deterministic behaviour;
- objective rule evaluation;
- conservative outcome reporting;
- stable public APIs;
- standards traceability;
- comprehensive test coverage.

Before opening a pull request, please review `CONTRIBUTING.md` for the
complete development workflow and coding conventions.

---

## Security

Security issues should be reported responsibly.

Please refer to `SECURITY.md` for the project's security policy,
supported versions and the preferred disclosure process.

---

## Versioning & stability

`@surea11y/core` follows [semantic versioning](https://semver.org/). The result
shape is a written contract — see [`docs/API_STABILITY.md`](docs/API_STABILITY.md)
for exactly which fields are covered by semver, what triggers a patch/minor/major
bump, the release cadence, and the rule-ID deprecation policy.

In short: patch and minor releases are always backward-compatible, so a consumer
pinned to a `^1.y.0` range is never broken by an upgrade within the `1.x` line.
Correctness fixes ship as patches when ready; feature work is batched into
periodic minors; breaking changes are reserved for major versions and are rare by
design.

## Maintainer

surea11y is built and maintained by [Jorge Rumoroso](https://github.com/rumoroso).

Bug reports and rule proposals are welcome via
[issues](https://github.com/SureA11y/core/issues). For security disclosures see
[`SECURITY.md`](./SECURITY.md).

## License

This project is released under the Mozilla Public License 2.0 (MPL-2.0).

See the accompanying `LICENSE` file for the complete license text.

MPL-2.0 is file-level copyleft: it applies to `@surea11y/core`'s own source files, not to code that merely depends on it. A project that installs `@surea11y/core` as a normal package dependency and imports its public API — without copying or modifying this repository's source files — is unaffected by MPL-2.0 and may keep its own license (including a permissive one like MIT).
