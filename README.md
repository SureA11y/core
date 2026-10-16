# @surea11y/core

<a href="https://www.npmjs.com/package/@surea11y/core"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/SureA11y/core/main/docs/assets/brand-tag-dark.svg"><img alt="surea11y core" src="https://raw.githubusercontent.com/SureA11y/core/main/docs/assets/brand-tag-light.svg"></picture></a>
[![Test](https://github.com/SureA11y/core/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/SureA11y/core/actions/workflows/test.yml)
[![npm](https://img.shields.io/npm/v/@surea11y/core?style=flat-square&label=npm&labelColor=101413&color=3A4441)](https://www.npmjs.com/package/@surea11y/core)
[![node](https://img.shields.io/node/v/@surea11y/core?style=flat-square&label=node&labelColor=101413&color=3A4441)](package.json)
[![license](https://img.shields.io/badge/license-MPL--2.0-3A4441?style=flat-square&labelColor=101413)](LICENSE)

[Website](https://surea11y.dev/) · [Documentation](https://surea11y.dev/getting-started/) · [Rules](https://surea11y.dev/rules/)

> **Accessibility testing that tells you what it can't tell you.**

`@surea11y/core` is the WCAG accessibility testing engine behind the surea11y
family of packages. It checks web content for accessibility problems, and
reports separately the cases an automated check can't settle. It runs in
Node.js against a DOM you supply (such as jsdom) or inside a real browser
page, and returns deterministic, standards-traceable results that people,
scripts and other tools can read. The integrations for Playwright, Cypress,
Puppeteer, Selenium, WebdriverIO, Jest/Vitest and the command line are
separate packages built on this engine: see
[Which package do I need?](#which-package-do-i-need).

What sets it apart is what it does with the cases automated testing can't
settle. It implements the W3C's open [Accessibility Conformance Testing (ACT)
Rules Format](https://www.w3.org/TR/act-rules-format/), verified against
ACT's own published test corpus rather than judged only against itself, and
it reports findings, non-findings, and (unusually) explicit uncertainty, so
results are auditable rather than reassuring.

*Sure* means certainty about what is known, and honesty about what isn't.

134 accessibility rules · 59 W3C ACT rules compared against W3C's test
corpus (942 reference cases) · zero runtime dependencies

Unlike browser extensions or cloud-based services, the engine is a library.
You install it, run it where your code runs, and receive structured results
that can be consumed by people, scripts or reporting tools.

## Contents

- [Which package do I need?](#which-package-do-i-need)
- [What you can build on it](#what-you-can-build-on-it)
- [What automated testing can and cannot do](#what-automated-testing-can-and-cannot-do)
- [What this engine does not detect](#what-this-engine-does-not-detect)
- [Principles](#principles)
- [Choosing the right execution model](#choosing-the-right-execution-model)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Understanding the Results](#understanding-the-results)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Security](#security)
- [Versioning & stability](#versioning--stability)
- [Maintainer](#maintainer)
- [License](#license)

## Which package do I need?

Most people don't install `@surea11y/core` directly. If you test with one of
the frameworks below, or want to scan HTML from a terminal, install its
package, which pulls in core for you. Install core itself to run the engine
on a DOM you already have, or to build a tool on it.

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
| **Build my own tool** on the engine (a CLI, an extension, a dashboard, a report generator) | `@surea11y/core`, with [`docs/BUILDING_ON_CORE.md`](./docs/BUILDING_ON_CORE.md) |

[Getting Started](https://surea11y.dev/getting-started/) on surea11y.dev
covers installation and usage for each of these. The rest of this README
covers `@surea11y/core` itself.

---

## What you can build on it

Core gives you checks and structured results; what you do with them is up to
your tool. For example:

- a test-runner or CI integration that fails only on new violations
  ([`docs/BASELINE.md`](./docs/BASELINE.md));
- a dashboard or report that shows fails, `cantTell` cases, and the WCAG or
  EN 301 549 requirement behind each;
- a browser extension that scans the page in front of you;
- an assistant that uses AI to explain findings and sort `cantTell` cases for
  a person to review, keeping the engine's outcomes apart from the model's
  suggestions;
- checks of your own organization's rules, through
  [packs](./docs/PACKS.md).

These are things you can build, not things core does for you.
[`docs/BUILDING_ON_CORE.md`](./docs/BUILDING_ON_CORE.md) shows how, and what
to watch for.

---

## What automated testing can and cannot do

Many WCAG requirements cannot be determined through automated testing alone and
require human judgement. surea11y's answer is to make that boundary explicit.
Each rule makes a single deterministic decision:

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

Every rule with a [W3C ACT Rules](https://www.w3.org/WAI/standards-guidelines/act/rules/)
counterpart runs against the test cases W3C publishes for it, the set W3C's
implementation listing scores: 942 examples across 59 rules. The engine fails
none of the examples ACT marks `passed` or `inapplicable`, so it reports no
false positives against that corpus. That is a result on those cases, not a
guarantee for every page. Where it cannot decide a case it returns
`cantTell`, which ACT permits for an automated implementation.

Twenty-five examples ACT marks `failed` go unflagged. Most are judgement calls,
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

Some things lie outside what a scan of the DOM can establish. For example,
the engine will not:

- confirm that alt text is *meaningful*, only that it is present
  (an alt attribute of `"image123.png"` passes the objective check);
- judge whether a color contrast choice is aesthetically appropriate,
  only whether it meets the applicable contrast ratio;
- determine whether an error message actually *explains* the problem,
  since that depends on validation logic a static scan can't see;
- detect a keyboard trap, or reflow and clipping at 400% zoom, since both
  require simulating real user interaction over time;
- see anything that only exists after a click or an async load.

Where a case comes down to judgement, such as whether a heading is
meaningful, the engine reports `cantTell` rather than guessing. Each of these
boundaries is a reasoned decision rather than an oversight:
[Known limitations](https://surea11y.dev/help/known-limitations/) lists them
in full with the reasoning for each (also in
[`docs/LIMITATIONS.md`](./docs/LIMITATIONS.md)). A `pass` from this engine, or
from any automated tool, is never a substitute for the manual review WCAG
itself requires.

## Principles

> Automate what can be determined objectively. Never pretend to automate
> what cannot.

- **Say only what can be established.** `fail` is reserved for objective,
  normative violations; an ambiguous case is reported as `cantTell` rather
  than dropped or guessed at. A shorter report is not a goal in itself.
- **Verify against an open standard.** Every rule with a W3C ACT Rules
  counterpart runs against ACT's published test cases, and the results are
  public ([Checked against the ACT corpus](#checked-against-the-act-corpus)).
- **Deterministic execution.** The same page, in the same state, with the
  same options gives the same result: the engine reads no clock and no
  randomness (`profileRules` timings aside).
- **Standards traceability.** Rules map to the WCAG success criteria they
  test and, through profiles, to standards built on WCAG such as EN 301 549.
- **Stable machine-readable output.** Rule ids and result fields are
  covered by semver ([`docs/API_STABILITY.md`](./docs/API_STABILITY.md)) and
  don't change with the language. Messages are translated (`en`, `fr`,
  `de`, `es` and `ja` today) without touching that data; see
  [`docs/I18N.md`](./docs/I18N.md) to use a language or contribute one.
- **Built to build on.** It runs in jsdom or any browser driver. Custom
  rules, packs, policies and rule selection are extension points, and every
  rule documents its WCAG mapping, applicability and expectation
  ([rule catalog](https://surea11y.dev/rules/),
  [`docs/RULE_EXAMPLES.md`](./docs/RULE_EXAMPLES.md)).

---

## Choosing the right execution model

The engine supports two complementary execution models. Choosing the
correct one is essential because it determines which parts of the page
the engine can inspect.

### Static HTML

`runDomRulesInPage()` analyses HTML without executing page JavaScript,
and so does the separate [`@surea11y/cli`](#cli) package, which wraps it
for the terminal.

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

It is still one moment of the page, in the state and at the viewport it was
in: the scan doesn't press keys, open menus or try other widths.

The function is browser-agnostic and can be executed through Puppeteer,
Playwright, Selenium, Cypress or any environment capable of evaluating
JavaScript inside the page.

For a detailed comparison of both execution models, see
`docs/LIMITATIONS.md` and `docs/INTEGRATION.md`.

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

TypeScript types ship with the package for every entry point, so there is
nothing more to install; the browser bundle's locale files
(`@surea11y/core/i18n/*`) only carry messages and have none.
`window.a11ycore`, the browser bundle's global, is left for your project to
declare, so it never conflicts with a declaration of your own:

```ts
declare global {
  interface Window { a11ycore: typeof import('@surea11y/core/browser'); }
}
```

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

### Library

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

`runa11yCoreInPage` is self-contained, so anything that can evaluate a
function inside the page can call it as shown: Puppeteer, Selenium,
Cypress, a browser extension. Playwright's `page.evaluate()` takes one
argument besides the function, so it needs a small wrapper; see
[`docs/INTEGRATION.md`](./docs/INTEGRATION.md#pattern-2--a-real-browser-via-puppeteer-or-playwright).
The scan sees the rendered page as it is at that moment, in that state.

#### Without a driver

For a page no automation framework drives (a manual check, a bookmarklet),
load the standalone bundle. It defines one global, `a11ycore`:

```html
<script src="node_modules/@surea11y/core/surea11y.browser.js"></script>
<script>
  const result = a11ycore.runa11yCoreInPage(location.href, null, {}, null);
</script>
```

The bundle carries English only. Other languages, packs, importing it from
a bundler, and what it leaves out are in
[`docs/INTEGRATION.md`](./docs/INTEGRATION.md#pattern-3--a-standalone-script-tag-no-driver-no-bundler).

### Choosing what to check

Name a WCAG version and level in `runOnly`, or pass a profile for a
standard built on WCAG:

```js
runDomRulesInPage(url, null, {}, { wcag: { version: '2.2', level: 'AA' } });
runDomRulesInPage(url, null, { profile: 'en301549-v3.2.1' }, null);
```

Either one only chooses which rules run; it does not certify conformance.
The profiles (`wcag22-aa`, `en301549-v4.1.1`, `en301549-v3.2.1`,
`section508`), best-practice rules, EN 301 549 clauses in results, and
finer selections are in
[`docs/ENGINE_OPTIONS.md`](./docs/ENGINE_OPTIONS.md#selecting-which-rules-run).

### Going further

- **Your own rules and standards.** A pack brings rules, an organisation's
  checklist or a standard from a package of its own, without a build of
  core. `npx -p @surea11y/core surea11y-pack new my-pack` starts one
  ([`docs/PACKS.md`](./docs/PACKS.md)).
- **Reports.** `@surea11y/core/report`, `/sarif`, `/junit` and `/earl` turn
  a result into an HTML report, SARIF for code scanning, JUnit XML for CI
  test views, and EARL for audit tooling
  ([`docs/REPORT.md`](./docs/REPORT.md)).
- **Only new violations.** `@surea11y/core/baseline` lets a build fail on
  new findings only ([`docs/BASELINE.md`](./docs/BASELINE.md)).
- **Strict options.** `engineOptions.strictOptions: true` throws
  `INVALID_ENGINE_OPTIONS` on an option the engine doesn't read or a value
  of the wrong type, instead of warning
  ([`docs/ENGINE_OPTIONS.md`](./docs/ENGINE_OPTIONS.md#catching-mistakes-in-the-options-strictoptions)).
- **A smaller result.** `engineOptions.output: { detail: 'findings' }` keeps
  whole only the results that report something; the reporters read it as a
  full one ([`docs/OUTPUT_SCHEMA.md`](./docs/OUTPUT_SCHEMA.md#top-level-result)).
- **WCAG data.** `@surea11y/core/wcag` lists every WCAG 2 success criterion
  (`WCAG_CRITERIA`) with its level in each version and the id its W3C pages
  use; `wcagCriteria()` and `wcagCriterion()` give a version's criteria with
  their titles.
- **Testing rules.** `@surea11y/core/testing` scans HTML in Node, as a pack's
  or a custom rule's tests need, and `@surea11y/core/eslint-plugin` holds
  rule code to the lint rules core's rules follow
  ([`docs/RULE_AUTHORING.md`](./docs/RULE_AUTHORING.md)).
- **A time limit.** Nothing inside a page can stop a scan once it has
  started; put the limit where you start it
  ([`docs/INTEGRATION.md`](./docs/INTEGRATION.md#a-time-limit-on-a-scan)).

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
          "summary": "This <img> has no alt attribute.",
          "hint": "Add an alt attribute that says what the image shows, or alt=\"\" if the image is purely decorative."
        }
      ]
    },
    {
      "ruleId": "link-name-quality",
      "outcome": "cantTell",
      "severity": "minor",
      "confidence": "medium",
      "occurrences": [
        {
          "selector": "html > body > a",
          "summary": "This link's name (\"click here\") is a generic phrase that doesn't say where it leads.",
          "hint": "Make the link text say where it leads or what it does, such as \"Download the 2026 pricing guide\" rather than \"Download\", or check that the text around it already makes that clear."
        }
      ]
    }
  ]
}
```

The second result illustrates the engine's conservative stance: it can
see that a link's name is a generic phrase, but whether the text around it
already makes the purpose clear requires human judgement, so it reports
`cantTell` instead of guessing.

Each occurrence answers four questions, whatever the outcome:

- **Which check?** (`ruleId`)
- **What was found?** (`summary`)
- **Where?** (`selector`)
- **What next?** (`hint`): a fix for a `fail`, what to check for a `cantTell`.

Read the outcome before counting: only `fail` is a violation, and a `pass` or
`notApplicable` can carry an occurrence that describes the scan.

The complete schema also includes confidence, severity, WCAG
traceability, composite rule results and other metadata intended for
reporting and automation.

For a complete field-by-field reference, see
[Output schema](https://surea11y.dev/results-reports/output-schema/)
(`docs/OUTPUT_SCHEMA.md` in the repository).

---

## Documentation

Full documentation is available at **[surea11y.dev](https://surea11y.dev/)**:
[getting started](https://surea11y.dev/getting-started/) for each integration,
the [rule catalog](https://surea11y.dev/rules/),
[configuration](https://surea11y.dev/configuration/),
[results and reports](https://surea11y.dev/results-reports/),
[WCAG conformance](https://surea11y.dev/conformance/), and
[help](https://surea11y.dev/help/).

The repository's own documentation, for building on the engine or
contributing to it, is listed by what you want to do in
[`docs/README.md`](./docs/README.md). The usual starting points:

- [`docs/BUILDING_ON_CORE.md`](./docs/BUILDING_ON_CORE.md): building a tool on the engine.
- [`docs/INTEGRATION.md`](./docs/INTEGRATION.md): running it with jsdom or a browser driver.
- [`docs/OUTPUT_SCHEMA.md`](./docs/OUTPUT_SCHEMA.md): every field of a result.
- [`docs/LIMITATIONS.md`](./docs/LIMITATIONS.md): what a scan can't establish.
- [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md): common questions and errors.

---

## Contributing

Contributions are welcome: bug fixes, documentation, translations, rules.
After cloning, `npm run build` regenerates the bundled runtime and
`npm test` runs the test suite.
[`CONTRIBUTING.md`](./CONTRIBUTING.md) has the workflow, the checks CI
runs, and how the repository is laid out.

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
pinned to a `^1.y.0` range is never broken by an upgrade within the `1.x` line,
though rule fixes in those releases can change what a scan finds.
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
