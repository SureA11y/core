# TEST_TEMPLATE.md — Copy/Paste (repo-faithful)

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-your-rule-id';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no matching elements`, () => {
  const html = `<!doctype html><html><body><p>None</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when requirement satisfied`, () => {
  const html = `<!doctype html><html><body>
    <!-- passing markup -->
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail/cantTell when triggered`, () => {
  const html = `<!doctype html><html><body>
    <!-- failing or manual-review markup -->
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  // automatic:
  // assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  // manual:
  // assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
});
```
