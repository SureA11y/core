'use strict';

// The HTML report leaves out control and bidi characters from rule and pack
// text, survives a stored rollup whose checksIds isn't a list, and shows a
// standard listed twice once; getMargins reads a cross-frame result.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../src/testing.js');
const { renderHtmlReport } = require('../src/report.js');
const { getMargins } = require('../src/index.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';

test('control and bidi characters are left out of the HTML report', () => {
  const result = runa11yCoreOnHtml(PAGE, {
    runOnly: ['acme-x'],
    engineOptions: {
      customRules: [
        {
          id: 'acme-x',
          meta: { title: 'Evil\u0000 ‮olleh title' },
          runInPage: (ctx) => ({
            outcome: 'fail',
            occurrences: [{ __node: ctx.document.body, summary: 'A\u0007 summary ⁦x⁩' }]
          })
        }
      ]
    },
    entryPointParity: false
  });
  const html = renderHtmlReport(result);
  const unshown = [0x0, 0x7, 0x202e, 0x2066, 0x2069];
  assert.ok(![...html].some((ch) => unshown.includes(ch.codePointAt(0))));
  assert.match(html, /A summary x/);
});

test('a stored rollup with a string checksIds, and a standard listed twice, render', () => {
  const result = runa11yCoreOnHtml(PAGE, { engineOptions: { profile: 'en301549-v3.2.1' } });
  const rulesResults = result.rulesResults.map((r, i) =>
    i === 0
      ? { ...r, data: { ...r.data, details: { ...r.data.details, checksIds: 'img-alt-present' } } }
      : r
  );
  assert.doesNotThrow(() => renderHtmlReport({ ...result, rulesResults }));
  const twice = { ...result, standards: result.standards.concat(result.standards) };
  const count = (html) => (html.match(/<h2>EN 301 549 rollup<\/h2>/g) || []).length;
  assert.equal(count(renderHtmlReport(twice)), count(renderHtmlReport(result)));
});

test('getMargins reads every frame of a cross-frame result', () => {
  const margin = { measure: 'm', unit: 'px', limit: 'min', threshold: 1, value: 2, headroom: 1 };
  const frame = (ruleId) => ({ checksResults: [{ ruleId, margin }] });
  const crossFrame = {
    topFrame: frame('a'),
    frames: [{ selector: '#ad', topFrame: frame('b'), frames: [] }]
  };
  assert.deepEqual(getMargins(crossFrame), [
    { ruleId: 'a', ...margin },
    { ruleId: 'b', ...margin, frame: ['#ad'] }
  ]);
  assert.deepEqual(getMargins(frame('a')), [{ ruleId: 'a', ...margin }]);
});
