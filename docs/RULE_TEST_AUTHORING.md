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
