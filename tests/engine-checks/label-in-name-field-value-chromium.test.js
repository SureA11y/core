'use strict';

/**
 * label-in-name reads a field's visible label without the field's value
 * (#114): the options of a <select> and the text of a <textarea> are what
 * the field holds, not label text, also where they sit inside the <label>.
 * Chromium leaves the field's own content out of the name it computes from
 * the label, so each case also checks that name.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  chromium = null;
}

function findExecutable() {
  if (!chromium) return null;
  const candidates = [];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  if (process.env.CHROMIUM_EXECUTABLE_PATH) candidates.push(process.env.CHROMIUM_EXECUTABLE_PATH);
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

const executablePath = findExecutable();
const skip = !chromium
  ? 'playwright not installed'
  : !executablePath
    ? 'no Chromium build found (set CHROMIUM_EXECUTABLE_PATH)'
    : false;

const BUNDLE = fs.readFileSync(path.join(__dirname, '../../surea11y.browser.js'), 'utf8');

// [description, the label's markup around the field #t, the field's
// aria-label, the label Chromium names #t by without one, what the rule
// reports on #t ('fail', or null for nothing)]
const CASES = [
  [
    'a select',
    'Quantity <select id="t"><option>1</option><option>2</option></select>',
    'Quantity',
    'Quantity',
    null
  ],
  [
    'a textarea with starting text',
    'Comments <textarea id="t">Hello there</textarea>',
    'Comments',
    'Comments',
    null
  ],
  [
    'a listbox select',
    'Colour <select id="t" size="3"><option>Red</option><option>Green</option><option>Blue</option></select>',
    'Colour',
    'Colour',
    null
  ],
  [
    'a select with an optgroup',
    'Car <select id="t"><optgroup label="Swedish"><option>Volvo</option></optgroup></select>',
    'Car',
    'Car',
    null
  ],
  [
    'a select named without its label',
    'Quantity <select id="t"><option>1</option><option>2</option></select>',
    'Qty',
    'Quantity',
    'fail'
  ],
  [
    'a textarea named without its label',
    'Comments <textarea id="t">Hello</textarea>',
    'Notes',
    'Comments',
    'fail'
  ]
];

const page = (markup) =>
  `<!doctype html><html lang="en"><head><title>Fields</title></head><body><main><label>${markup}</label></main></body></html>`;

test(
  "label-in-name leaves a field's value out of its visible label, in Chromium",
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    for (const [description, markup, ariaLabel, labelName, outcome] of CASES) {
      await t.test(description, async () => {
        const p = await browser.newPage();
        try {
          await p.setContent(page(markup));
          const cdp = await p.context().newCDPSession(p);
          const { nodes } = await cdp.send('Accessibility.getFullAXTree');
          const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
          const { nodeId } = await cdp.send('DOM.querySelector', {
            nodeId: root.nodeId,
            selector: '#t'
          });
          const { node } = await cdp.send('DOM.describeNode', { nodeId });
          const ax = nodes.find((n) => n.backendDOMNodeId === node.backendNodeId);
          assert.equal(ax.name.value.trim(), labelName);

          await p.evaluate((label) => {
            document.getElementById('t').setAttribute('aria-label', label);
          }, ariaLabel);
          await p.evaluate(BUNDLE);
          const r = await p.evaluate(() => {
            const res = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
              'label-in-name'
            ]);
            const c = res.checksResults.find((x) => x.ruleId === 'label-in-name');
            const o = (c.occurrences || []).find((x) => x.selector === '#t');
            return o
              ? { outcome: o.occurrenceOutcome || c.outcome, label: o.data.details.visibleLabel }
              : { outcome: null };
          });
          assert.equal(r.outcome, outcome);
          if (outcome) assert.equal(r.label, labelName);
        } finally {
          await p.close();
        }
      });
    }
  }
);
