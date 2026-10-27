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

test('contrast-enhanced: text far past 7:1 is not close, so no margin', () => {
  // Black on white reaches 7:1 with 14 to spare: outside the rule's 10% band.
  const r = check('contrast-enhanced');
  assert.equal(r.outcome, 'fail');
  assert.equal(r.margin, undefined);
});

test('contrast-enhanced: a fail still names the closest text that reached 7:1', () => {
  // #595959 on white is about 7.005:1, within 10% of 7:1 (up to 7.7).
  const r = check(
    'contrast-enhanced',
    PAGE.replace('</body>', '<p id="dark" style="color:#595959">Dark grey text</p></body>')
  );
  assert.equal(r.outcome, 'fail');
  assert.equal(r.margin.selector, '#dark');
  assert.equal(r.margin.threshold, 7);
  assert.ok(r.margin.value >= 7 && r.margin.value < 7.01, String(r.margin.value));
  assert.equal(r.margin.measuredCount, 4);
});

test("contrast-minimum: the band is 10% of each text's own threshold", () => {
  const page = (color, size) =>
    `<!doctype html><html lang="en"><head><title>t</title></head><body style="background:#fff"><p style="color:${color};font-size:${size}">Grey</p></body></html>`;
  // #888 on white is about 3.54:1: past 3.3, the band's edge for large text.
  assert.equal(check('contrast-minimum', page('#888', '32px')).margin, undefined);
  // Against 4.5:1 the edge is 4.95: #717171 (about 4.88:1) is inside it,
  // #6f6f6f (about 5.02:1) is not.
  const inside = check('contrast-minimum', page('#717171', '16px')).margin;
  assert.ok(inside && inside.threshold === 4.5 && inside.value < 4.95, JSON.stringify(inside));
  assert.equal(check('contrast-minimum', page('#6f6f6f', '16px')).margin, undefined);
});

test('contrast: no text reaching its ratio, no margin', () => {
  const r = check(
    'contrast-minimum',
    '<!doctype html><html lang="en"><head><title>t</title></head><body style="background:#fff"><p style="color:#aaa">Too light</p></body></html>'
  );
  assert.equal(r.outcome, 'fail');
  assert.equal(r.margin, undefined);
});

test('contrast-minimum and -enhanced: text after the 50th failure still counts toward the margin', () => {
  // The rules stopped at their 50th failure, so the margin and measuredCount
  // depended on where that failure fell: 60 failures before a 4.54:1
  // paragraph gave no margin at all.
  const fails = '<p style="color:#aaa">Light grey text</p>'.repeat(60);
  const html = `<!doctype html><html lang="en"><head><title>t</title></head>
<body style="background:#fff;color:#000;font-size:16px">${fails}
  <p id="grey" style="color:#767676">Grey text that just reaches 4.5:1</p>
  <p id="black">Black text on white</p>
  <p id="dark" style="color:#595959">Dark grey text that just reaches 7:1</p>
</body></html>`;

  const minimum = check('contrast-minimum', html);
  assert.equal(minimum.outcome, 'fail');
  assert.equal(minimum.occurrences.length, 50, 'occurrences stay capped');
  assert.equal(minimum.margin.selector, '#grey');
  assert.equal(minimum.margin.measuredCount, 63);

  const enhanced = check('contrast-enhanced', html);
  assert.equal(enhanced.occurrences.length, 50);
  assert.equal(enhanced.margin.selector, '#dark', '#767676 misses 7:1, black is far past it');
  assert.equal(enhanced.margin.measuredCount, 63);
});
