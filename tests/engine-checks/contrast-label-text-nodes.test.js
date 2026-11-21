'use strict';

// The contrast scan asks, for each text node, whether it names a disabled
// control through the <label> around it. Each answer walked the label for
// its control, or queried the document for what refers to its id, so a
// label holding many text nodes cost their number squared in jsdom: 2000
// took 35 s. The answer is now worked out once per label and scan
// (round 9, R9-7).

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

const spans = (n, word) =>
  Array.from({ length: n }, (_, i) => `<span>${word} ${i}</span> `).join('');

test('contrast-computable: a label with thousands of text nodes is scanned in linear time', () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><label id="choose">Choose <input type="checkbox">${spans(3000, 'word')}</label></main></body></html>`;
  const start = Date.now();
  const result = runa11yCoreOnHtml(html, { runOnly: ['contrast-computable'] });
  const ms = Date.now() - start;
  assert.equal(result.checksResults[0].outcome, 'pass');
  // About 75 s before the fix; about 6 s now, more on a busy machine, so the
  // bound only catches the old growth, not a slow runner.
  assert.ok(ms < 30000, `${ms} ms`);
});

test('contrast-minimum: the text of a label still follows its control, once per label', () => {
  // Light gray on white, 2.3:1. Exempt: the text of a label whose control
  // is disabled, and of a label a disabled widget names with
  // aria-labelledby. Judged: the text of a label whose control is enabled.
  const html = `<!doctype html><html lang="en"><head><title>t</title><style>label { color: #aaa; background: #fff }</style></head><body><main><h1>x</h1>
<label id="off">Off <input type="checkbox" disabled>${spans(3, 'off')}</label>
<label id="named">Named ${spans(3, 'named')}</label><div role="checkbox" aria-checked="false" aria-disabled="true" tabindex="0" aria-labelledby="named"></div>
<label id="on">On <input type="checkbox">${spans(3, 'on')}</label>
</main></body></html>`;
  const rule = runa11yCoreOnHtml(html, { runOnly: ['contrast-minimum'] }).checksResults[0];
  assert.equal(rule.outcome, 'fail');
  assert.deepEqual(
    rule.occurrences.map((o) => o.selector),
    ['#on', '#on > span:nth-of-type(1)', '#on > span:nth-of-type(2)', '#on > span:nth-of-type(3)']
  );
});
