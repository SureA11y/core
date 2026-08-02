---
name: Bug report
about: A rule produced a wrong outcome, or the engine crashed/misbehaved
title: ""
labels: bug
---

**Before filing:** check `docs/TROUBLESHOOTING.md` and `docs/LIMITATIONS.md` first — a good number of "wrong outcome" reports turn out to be one of the documented, deliberate boundaries (hidden-content exclusion, jsdom's lack of a layout engine, static-HTML-vs-hydrated-DOM timing, etc.), not a bug.

## Rule ID(s) affected

<!-- e.g. img-alt-present -->

## Execution mode

- [ ] Static HTML via `runDomRulesInPage` / jsdom
- [ ] Real browser via `runa11yCoreInPage` (Puppeteer/Playwright/Selenium/Cypress/WebdriverIO — say which)
- [ ] CLI (`npx @surea11y/core scan ...`)

`@surea11y/core` version: <!-- from package.json / npm ls -->

## Minimal reproduction

<!-- The smallest HTML snippet that reproduces the issue. If it's a live page, a snippet extracted from it is far more useful than a URL alone — pages change. -->

```html

```

## Expected outcome vs. actual outcome

<!-- e.g. "expected fail, got pass" or "expected notApplicable, got cantTell" -->

## Why you believe this is wrong

<!-- What in the DOM/ARIA/HTML-AAM spec, or in a real assistive-technology's actual behavior, makes the current outcome incorrect? "It looks wrong" is a starting point, not sufficient on its own — see CONTRIBUTING.md's "Fixing a bug" section on verifying against a primary source before changing rule logic. -->
