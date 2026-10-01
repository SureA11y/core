# TEST_AUTHORING.md — Repo-derived rule test authoring

Tests in this repo use:
- `node:test`
- `node:assert`
- `assertRule` helper
- `runa11yCoreOnHtml` helper (JSDOM)

Canonical imports:

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

A core rule's test checks the rule, by default and under core's own profiles (`wcag22-aa`, `section508`, EN 301 549's). It names no profile's standard (its key, its profiles, its rollups): which of a standard's requirements a core rule checks is that standard's decision, tested in its profile. How core treats a profile's standard (mappings, opt-in rules, rollups, variants) is tested against the sample profile in `tests/fixtures/profiles/sample/`, built into a copy of the engine by `tests/helpers/sampleEngine.js`, in `tests/sample-profile/`. That a profile never changes a rule's outcome is checked for every rule and every profile in `tests/profile-outcomes.test.js`, so a rule's test need not loop over profiles to show it. `tests/profile-boundary.test.js` fails on a rule test that names a profile's standard.
