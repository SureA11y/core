'use strict';

const test = require('node:test');
const { runa11yCoreOnHtml } = require('../tests/helpers/runa11yCoreOnHtml');
const { assertRule } = require('../tests/helpers/assertRule');

test('<rule-id>: no applicable elements => notApplicable', () => {
  const html = `
<!doctype html><html><body>
  <!-- TODO: page with no applicable targets -->
</body></html>
  `;

  const result = runa11yCoreOnHtml(html);

  assertRule(result, 'a11yCore-<rule-id>', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test('<rule-id>: failing case => fail with 1+ occurrences', () => {
  const html = `
<!doctype html><html><body>
  <!-- TODO: minimal failing fixture -->
</body></html>
  `;

  const result = runa11yCoreOnHtml(html);

  assertRule(result, 'a11yCore-<rule-id>', 'fail', {
    minOccurrences: 1
  });
});

test('<rule-id>: passing case => pass', () => {
  const html = `
<!doctype html><html><body>
  <!-- TODO: minimal passing fixture -->
</body></html>
  `;

  const result = runa11yCoreOnHtml(html);

  assertRule(result, 'a11yCore-<rule-id>', 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

// Optional: only include if the rule can produce cantTell deterministically.
/*
test('<rule-id>: manual judgment required => cantTell with 1+ occurrences', () => {
  const html = `
<!doctype html><html><body>
  <!-- TODO: fixture that requires human judgment per the standard -->
</body></html>
  `;

  const result = runa11yCoreOnHtml(html);

  assertRule(result, 'a11yCore-<rule-id>', 'cantTell', {
    minOccurrences: 1
  });
});
*/
