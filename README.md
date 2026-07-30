# @surea11y/core

> **Reliable accessibility testing for real web applications.**

surea11y is an accessibility engine designed to help development teams
identify objective accessibility issues early in the software lifecycle.
It runs against either static HTML or fully rendered browser pages,
producing deterministic, standards-traceable results that are suitable
for local development, automated testing and CI/CD pipelines.

Unlike browser extensions or cloud-based services, surea11y is a
library-first project. You install it, run it where your code runs, and
receive structured results that can be consumed by people, scripts or
reporting tools.

## Why surea11y?

Accessibility automation is only valuable if developers can trust its
results.

surea11y is built around a conservative philosophy: **never report
certainty when certainty cannot be established objectively.**

Instead of relying on heuristics that may generate false positives, each
rule makes a single deterministic decision. If a violation can be
proven, the outcome is `fail`. If human judgement is required, the
engine reports `cantTell` instead of guessing.

This makes the engine predictable, reproducible and suitable for
automated quality gates.

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
  without affecting machine-readable data.

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

## Installation

Install the core package from npm:

```bash
npm install @surea11y/core
```

The core engine has no runtime dependencies — requiring the library
itself never loads `jsdom`. Only the bundled CLI loads it, and only
when you actually run a scan, keeping the library lightweight and
suitable for embedding into your own tooling.

---

## Quick Start

### CLI

The CLI is the fastest way to analyse a page without writing any code.

```bash
npx @surea11y/core scan ./index.html
npx @surea11y/core scan https://example.com/
```

The CLI analyses static HTML. It does not execute client-side
JavaScript, making it ideal for static sites and server-rendered
applications.

For available options, exit codes and advanced usage, see `docs/CLI.md`.

---

### Library

surea11y exposes two entry points depending on where your code executes.

#### Node.js + jsdom

Use `runDomRulesInPage()` when your application already has a DOM
available through jsdom.

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

## Understanding the Results

Every scan returns a structured JSON document designed for both
developers and automated tooling.

A simplified example looks like this:

```json
{
  "engine": {
    "tag": "a11ycore",
    "schemaVersion": "1.0.0"
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
confirm a link has text, but whether that text is genuinely descriptive
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
| `docs/CLI.md` | CLI commands, options, exit codes and examples. |
| `docs/BASELINE.md` | CI baseline/allowlist: gate builds only on new violations. |
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
| `docs/RULE_TAXONOMY.md` | Rule categorization model. |
| `CONTRIBUTING.md` | Contributing guidelines. |
| `SECURITY.md` | Security policy and vulnerability reporting. |
| `CHANGELOG.md` | Release history. |

---

## Philosophy

surea11y is built on a simple principle:

> Automate what can be determined objectively. Never pretend to automate
> what cannot.

Accessibility is not something that can be reduced to a single score or
a binary pass/fail result. Some WCAG requirements can be evaluated with
complete confidence, while others require human judgement, knowledge of
context or usability evaluation.

Rather than hiding that distinction, surea11y makes it explicit.

That philosophy influences every rule in the engine and is the reason
outcomes such as `cantTell` and `notApplicable` exist. They communicate
uncertainty honestly instead of encouraging misleading conclusions.

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

The objective of the project is not to replace accessibility experts. It
is to remove repetitive verification work, provide reliable automated
feedback to developers and help teams integrate accessibility into their
normal development process.

---

## Project Structure

The repository is organised so that the accessibility engine, rule
implementations and supporting infrastructure remain clearly separated.

```text
bin/
  core.js                  # CLI entry point

src/
  index.js                 # Public API
  core.js                  # Generated runtime bundle

  checks/
    automatic/             # Deterministic automated rules
    manual/                # Advisory rules (maximum outcome: cantTell)

  core/                    # Shared engine runtime
  policy/                  # Policy implementations
  i18n/                    # Localized messages
  coverage/                # WCAG coverage definitions
  catalogs/                # Composite rule catalogs

scripts/
  build-core.js            # Generates the runtime bundle

docs/                      # Project documentation

tests/
  fixtures/                # Rule fixtures
  engine-checks/           # Engine and rule tests
```

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

Whether you are fixing a bug, improving documentation or implementing a
new accessibility rule, please keep the project's core principles in
mind:

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

## License

This project is released under the MIT License.

See the accompanying `LICENSE` file for the complete license text.

---

## Final Notes

surea11y was created with a simple goal: make accessibility testing
trustworthy enough to become part of everyday software engineering.

It does not attempt to replace manual accessibility reviews, usability
testing or expert judgement. Instead, it focuses on providing reliable
automated verification for the parts of accessibility that can be
evaluated objectively.

By combining deterministic rules, standards traceability, stable
machine-readable output and honest reporting of uncertainty, surea11y
enables teams to detect accessibility issues earlier, reduce regressions
and build more accessible products with confidence.

Accessibility is not a checkbox performed before release. It is an
engineering practice that benefits from continuous feedback, and
surea11y is designed to become one of those feedback loops.
