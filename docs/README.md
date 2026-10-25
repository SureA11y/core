# Documentation

The reference for `@surea11y/core`, by what you want to do. [surea11y.dev](https://surea11y.dev/) covers the same ground for people using the engine through one of its packages; these files are the detail behind it, and what contributors work from.

## Running the engine

| Document | What it covers |
|---|---|
| [`INTEGRATION.md`](./INTEGRATION.md) | Running it with jsdom, Playwright, Puppeteer, Selenium, Cypress, other drivers, or a plain `<script>` tag. |
| [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md) | Every option: choosing rules, conformance targets and profiles, policies, languages, packs. |
| [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md) | Every field of a result. |
| [`LEANS.md`](./LEANS.md) | Which way an undecided finding points: reading, using and trusting a lean. |
| [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md) | How rule results roll up to WCAG criteria, and what a criterion's `pass` does and doesn't claim. |
| [`LIMITATIONS.md`](./LIMITATIONS.md) | What a scan can't establish, and what to do about it. |
| [`LAYOUT_MEASUREMENT.md`](./LAYOUT_MEASUREMENT.md) | How the contrast and target-size rules measure a rendered page. |
| [`I18N.md`](./I18N.md) | Results in another language, and adding a language. |
| [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) | Common questions and errors. |
| [`PERFORMANCE.md`](./PERFORMANCE.md) | How long a scan takes, release by release, and how it is measured. |

## Reports and CI

| Document | What it covers |
|---|---|
| [`REPORT.md`](./REPORT.md) | A self-contained HTML report. |
| [`SARIF.md`](./SARIF.md) | SARIF 2.1.0, for GitHub Code Scanning and other SARIF dashboards. |
| [`JUNIT.md`](./JUNIT.md) | JUnit XML, for the test views of GitLab, Azure DevOps, Jenkins and CircleCI. |
| [`EARL.md`](./EARL.md) | EARL 1.0 in JSON-LD: the W3C interchange format and the ACT implementation-report format. |
| [`BASELINE.md`](./BASELINE.md) | Failing a build only on new violations. |
| [`CI_INTEGRATIONS.md`](./CI_INTEGRATIONS.md) | GitHub Actions and Bitbucket Pipelines templates around the CLI. |

## Building a tool on the engine

| Document | What it covers |
|---|---|
| [`BUILDING_ON_CORE.md`](./BUILDING_ON_CORE.md) | Start here: what to rely on, running scans, presenting results, comparing runs, extending. |
| [`API_STABILITY.md`](./API_STABILITY.md) | What semver covers: result fields, entry points, extension points, rule-id deprecation. |
| [`BINDING_AUTHORS_GUIDE.md`](./BINDING_AUTHORS_GUIDE.md) | Writing an integration for a test framework or browser driver. |
| [`POLICY.md`](./POLICY.md) | Policy contracts: which outcomes may reach a result. |

## Writing rules and packs

| Document | What it covers |
|---|---|
| [`PACKS.md`](./PACKS.md) | Your own rules, profiles, checklist or standard, from `surea11y-pack new` to publishing. |
| [`RULE_AUTHORING.md`](./RULE_AUTHORING.md) | The rule contract, in full. |
| [`RULE_TEMPLATE.md`](./RULE_TEMPLATE.md) | A rule to start from, with its test in [`RULE_TEST_TEMPLATE.md`](./RULE_TEST_TEMPLATE.md). |
| [`RULE_TEST_AUTHORING.md`](./RULE_TEST_AUTHORING.md) | Testing a rule. |
| [`RULE_HELPERS.md`](./RULE_HELPERS.md) | Every `ctx.helpers` function a rule can use. |
| [`RULE_TAXONOMY.md`](./RULE_TAXONOMY.md) | How rules are categorized and split. |
| [`RULE_CATALOG.md`](./RULE_CATALOG.md) | Every built-in rule (generated). |
| [`RULE_SETTINGS.md`](./RULE_SETTINGS.md) | The settings core's rules offer a pack's variants: defaults, values, what each changes (generated). |
| [`RULE_EXAMPLES.md`](./RULE_EXAMPLES.md) | Each rule's passed and failed examples, checked against its outcomes. |

## Standards and design records

| Document | What it covers |
|---|---|
| [`ACT_RULE_MAPPING.md`](./ACT_RULE_MAPPING.md) | Which W3C ACT rules the engine implements, how it scores on their test cases, and where it differs by design. |
| [`ARIA_DEPRECATION.md`](./ARIA_DEPRECATION.md) | How deprecated ARIA roles and attributes are graded. |
| [`DESIGN_CHALLENGES.md`](./DESIGN_CHALLENGES.md) | Open and settled design questions, each with the reasoning behind the call. |
| [`RELEASING.md`](./RELEASING.md) | The release checklist: version, changelog, finding identities, and publishing. |

Project policies are at the repository root: [`CONTRIBUTING.md`](../CONTRIBUTING.md), [`GOVERNANCE.md`](../GOVERNANCE.md), [`SUPPORT.md`](../SUPPORT.md), [`SECURITY.md`](../SECURITY.md) and [`CHANGELOG.md`](../CHANGELOG.md).
