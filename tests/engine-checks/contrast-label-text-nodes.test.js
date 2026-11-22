'use strict';

// The contrast scan asks, for each text node, whether it names a disabled
// control through the <label> around it. Each answer walked the label for
// its control, or queried the document for what refers to its id, so a
// label holding many text nodes cost their number squared in jsdom: 2000
// took 35 s. The answer is now worked out once per label and scan
// (round 9, R9-7).

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  runa11yCoreOnHtml,
  createDom,
  runa11yCoreOnDom
} = require('../helpers/runDomRulesOnHtml.js');

const spans = (n, word) =>
  Array.from({ length: n }, (_, i) => `<span>${word} ${i}</span> `).join('');

test('contrast-computable: a label with thousands of text nodes is scanned in linear time', () => {
  // Under jsdom each text's element costs a getComputedStyle that matches
  // the whole style sheet against it (about 1 ms), so a wall-clock bound
  // fails on a busy machine. The test compares the processor time of one
  // scan of 750 and of 3000 text nodes instead: four times the text takes
  // two to four times as long (fixed costs included), and the quadratic
  // walk this guards against (reading the label again for each text node)
  // took 14 to 16.
  function cpuMs(n) {
    const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><label id="choose">Choose <input type="checkbox">${spans(n, 'word')}</label></main></body></html>`;
    const dom = createDom(html);
    const start = process.cpuUsage();
    const result = runa11yCoreOnDom(dom, {
      runOnly: ['contrast-computable'],
      entryPointParity: false
    });
    const used = process.cpuUsage(start);
    dom.window.close();
    assert.equal(result.checksResults[0].outcome, 'pass');
    return (used.user + used.system) / 1000;
  }
  cpuMs(200); // warm up the engine and jsdom
  const small = cpuMs(750);
  const large = cpuMs(3000);
  assert.ok(large < small * 8, `${Math.round(small)} ms for 750, ${Math.round(large)} ms for 3000`);
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
