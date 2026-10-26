# RULE_TEST_AUTHORING.md — Repo-derived rule test authoring

Tests in this repo use:
- `node:test`
- `node:assert`
- `assertRule` helper
- `runa11yCoreOnHtml` helper (JSDOM)

The two helpers are core's published test API, `@surea11y/core/testing` (`src/testing.js`,
typed in `src/testing.d.ts`); `tests/helpers/` re-exports them for core's own tests. A pack's
tests import them from the package, with `jsdom` installed as a dev dependency:

```js
const { runa11yCoreOnHtml, assertRule } = require('@surea11y/core/testing');

const result = runa11yCoreOnHtml(html, {
  engineOptions: { packs: [pack] },
  runOnly: { includeRuleIds: [RULE_ID] }
});
```

Every scan runs through both entry points (the in-page runner and the Node runner) and fails
when they disagree, so a rule that reads a variable from outside `runInPage` fails its test. Both run in jsdom, though: their agreeing says nothing about a browser. A rule that reads the layout, focus or rendering also needs the browser tests in [`RULE_AUTHORING.md` §12](./RULE_AUTHORING.md#12-real-world-patterns-required-for-rules-that-read-the-layout).
See [`PACKS.md`](./PACKS.md#7-test-lint-and-document-it) for a pack's tests.

Canonical imports in core:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');
```

Canonical execution:

```js
const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
```

Common helper used in tests to validate surfaced elements via occurrence HTML snippet:

```js
function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}
```

Start a new rule's test from [`RULE_TEMPLATE.test.js`](./RULE_TEMPLATE.test.js). Beyond its own
test file, a core rule is held by tests that read every rule:

- `tests/reason-codes-docs.test.js`: the header's `@reason-codes` lists exactly the rule's codes
  in `scripts/data/finding-ids.json` (`npm run finding-ids` updates it), each with an outcome, a
  meaning and a basis ([`RULE_AUTHORING.md`](./RULE_AUTHORING.md) §10.1).
- `tests/how-to-check.test.js`: every code the header lists as `cantTell` has steps in
  `meta.review`, and every locale of `src/i18n/review/` has every key (§8.6).
- `npm run fixtures:markers:check` and `npm run fixtures:check`: the scenario page's markers
  match what the rule reports, and the fixture index is current (§11).

A rule that leans tests each lean in its own file: a case that leans, its `toward` and `whyKey`,
and for a conditional lean a case of the same code with none (§8.5).

A core rule's test checks the rule, by default and under core's own profiles (`wcag22-aa`, `section508`, EN 301 549's). It names no profile's standard (its key, its profiles, its rollups): which of a standard's requirements a core rule checks is that standard's decision, tested in its profile. How core treats a profile's standard (mappings, opt-in rules, rollups, variants) is tested against the sample profile in `tests/fixtures/profiles/sample/`, built into a copy of the engine by `tests/helpers/sampleEngine.js`, in `tests/sample-profile/`. That a profile never changes a rule's outcome is checked for every rule and every profile in `tests/profile-outcomes.test.js`, so a rule's test need not loop over profiles to show it. `tests/profile-boundary.test.js` fails on a rule test that names a profile's standard.
