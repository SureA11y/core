# Support

## Getting help

Open an issue: <https://github.com/SureA11y/core/issues>. Questions, bug reports and rule proposals all belong there rather than in private email — a public answer helps whoever hits the same thing next. Security reports are the exception, see [`SECURITY.md`](./SECURITY.md).

If the problem is specific to a framework binding (`@surea11y/playwright`, `@surea11y/puppeteer`, `@surea11y/selenium`, `@surea11y/webdriverio`, `@surea11y/cypress`, `@surea11y/test-matchers`), open the issue in that binding's own repository under the [SureA11y organization](https://github.com/SureA11y).

Include the engine version, the adapter you're using if any, and ideally a minimal HTML fixture that reproduces what you're seeing. Output is deterministic, so a fixture usually settles a question faster than a description of it.

## What to expect

This is a solo-maintained project. Issues are normally acknowledged within a week; a fix, where one is warranted, follows on its own schedule. There is no paid support tier and no service-level agreement.

Rule-correctness reports get priority. A case where the engine reports `fail` for something that isn't a violation, or `pass` for something that is, is treated as more urgent than a feature request — that accuracy is the point of the project.

## Supported versions

Fixes land on the latest published release of the current major line. Older lines are not backported.

[`docs/API_STABILITY.md`](./docs/API_STABILITY.md) documents which fields are covered by semver, what triggers a patch, minor or major bump, the release cadence, and the rule-ID deprecation policy.
