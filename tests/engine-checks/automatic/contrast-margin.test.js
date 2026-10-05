'use strict';

/**
 * contrast-minimum and contrast-enhanced report, as their margin, the text
 * that came closest to its required ratio while reaching it. Contrast is
 * computed from CSS, so this needs no browser. #767676 on white is the
 * lightest grey that reaches 4.5:1 (4.54:1); #949494 is about 3.03:1, enough
 * for large text under AA only.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml');

const PAGE = `<!doctype html><html lang="en"><head><title>t</title></head>
<body style="background:#fff;color:#000;font-size:16px">
  <p id="black">Black text on white</p>
  <p id="grey" style="color:#767676">Grey text that just reaches 4.5:1</p>
  <p id="large" style="color:#949494;font-size:32px">Large grey text</p>
</body></html>`;

function check(ruleId, html = PAGE) {
  const result = runa11yCoreOnHtml(html, { runOnly: { includeRuleIds: [ruleId] } });
  return result.checksResults.find((r) => r.ruleId === ruleId);
}

test('contrast-minimum: the closest pass is the margin, with its own threshold', () => {
  const r = check('contrast-minimum');
  assert.equal(r.outcome, 'pass');
  const m = r.margin;
  assert.equal(m.measure, 'contrast-ratio');
  assert.equal(m.unit, 'ratio');
  assert.equal(m.limit, 'min');
  assert.equal(m.selector, '#large', 'about 3.03 against 3 is closer than 4.54 against 4.5');
  assert.equal(m.threshold, 3);
  assert.deepEqual(m.context, { largeText: true });
  assert.ok(m.value >= 3 && m.value < 3.1, String(m.value));
  assert.equal(m.headroom, m.value - m.threshold, 'a ratio is not rounded');
  assert.equal(m.measuredCount, 3);
});

test('contrast-enhanced: a fail still names the closest text that reached 7:1', () => {
  const r = check('contrast-enhanced');
  assert.equal(r.outcome, 'fail');
  assert.equal(r.margin.selector, '#black');
  assert.equal(r.margin.threshold, 7);
  assert.equal(r.margin.value, 21);
  assert.equal(r.margin.headroom, 14);
});

test('contrast: no text reaching its ratio, no margin', () => {
  const r = check(
    'contrast-minimum',
    '<!doctype html><html lang="en"><head><title>t</title></head><body style="background:#fff"><p style="color:#aaa">Too light</p></body></html>'
  );
  assert.equal(r.outcome, 'fail');
  assert.equal(r.margin, undefined);
});
