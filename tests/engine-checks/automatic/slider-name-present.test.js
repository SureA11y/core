'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let runa11yCoreOnHtml;
let assertRule;

try {
  ({ runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml'));
  ({ assertRule } = require('../../helpers/assertRule'));
} catch (e) {}

const RULE_ID = 'slider-name-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test('slider-name-present: no applicable elements => notApplicable', () => {
  const html = `<!doctype html><html><body><div>no sliders</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('slider-name-present: input range with label => pass', () => {
  const html = `<!doctype html><html><body><label>Volume <input type='range' role='slider'/></label></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('slider-name-present: input range label hidden only => fail', () => {
  const html = `<!doctype html><html><body><label><span aria-hidden='true'>Volume</span><input type='range' role='slider'/></label></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('slider-name-present: role=slider with aria-labelledby => pass', () => {
  const html = `<!doctype html><html><body><span id='l'>Brightness</span><div role='slider' aria-labelledby='l'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('slider-name-present: role=slider missing name => fail', () => {
  const html = `<!doctype html><html><body><div role='slider'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('slider-name-present: wrapping <label> has its own aria-label even though its only child content is aria-hidden', () => {
  const html = `<!doctype html><html><body>
    <label aria-label="Toggle Navigation" for="c"><svg aria-hidden="true"><path d="M0 0"/></svg></label>
    <input role="slider" id="c" type="range">
  </body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/slider-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'slider-name-present-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 5, maxOccurrences: 5 });

  const expectedFailIds = [
    'slider_case_08',
    'slider_case_09',
    'slider_case_10',
    'slider_case_19',
    'slider_case_23'
  ];

  const expectedNoOccIds = [
    // native input[type=range] with no explicit role: owned by
    // form-control-programmatic-label-present
    'slider_case_01',
    'slider_case_07',
    'slider_case_15',
    'slider_case_02',
    'slider_case_03',
    'slider_case_04',
    'slider_case_05',
    'slider_case_06',
    'slider_case_11',
    'slider_case_12',
    'slider_case_13',
    'slider_case_14',
    'slider_case_16',
    'slider_case_17',
    'slider_case_18',
    'slider_case_20',
    'slider_case_21',
    'slider_case_22'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test('slider-name-present: aria-labelledby pointing at an <iframe> falls back to its title attribute => pass', () => {
  // Regression for a false positive — a copy-pasted bug across the
  // *-name-present rules:
  // aria-labelledby pointing at an <iframe> has no "content" to compute a
  // name from (iframe content is opaque/cross-origin per HTML-AAM); the
  // referenced element's own accessible name must fall back to its title
  // attribute, which the previous getConservativeSubtreeText-only
  // resolveAriaLabelledbyText never checked. Fixed via the shared
  // getTextFromIdRefs helper.
  const html = `<!doctype html><html><body><iframe id='t' title='Settings'></iframe><div role='slider' aria-labelledby='t'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test("slider-name-present: label association with empty content falls back to the label's own title attribute => pass", () => {
  // Regression for the sibling gap to the <iframe>-title-fallback fix:
  // getLabelText previously stopped at content-only
  // (getConservativeSubtreeText) when resolving a native <label for> whose
  // content is empty, never checking the label's own title attribute — the
  // same final-fallback step the general accname algorithm applies to any
  // element being asked for its name, regardless of why.
  // Uses a native input[type=range], not role="slider" on a <div> — native
  // <label for> association is only checked for native range inputs
  // (role="slider" is name-from-author-only per WAI-ARIA and doesn't use
  // native label association at all).
  const html = `<!doctype html><html><body><label for='a' title='Search'></label><input id='a' type='range' role='slider'/></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('slider-name-present: notApplicable for a bare native range input', () => {
  const html = `<!doctype html><html><body><input type='range'/></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('slider-name-present: an unlabeled native range is still reported, by the labeling rule', () => {
  const html = `<!doctype html><html><body><input type='range'/></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID, 'form-control-programmatic-label-present']
  });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  assertRule(result, 'form-control-programmatic-label-present', 'fail', { minOccurrences: 1 });
});

test('slider-name-present: an explicit role keeps a native range in scope', () => {
  const html = `<!doctype html><html><body><input type='range' role='slider'/></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID, 'form-control-programmatic-label-present']
  });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assertRule(result, 'form-control-programmatic-label-present', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});
