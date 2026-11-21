'use strict';

/**
 * aria-hidden-focus is a 4.1.2 Name, Role, Value finding, not a 2.4.7 Focus
 * Visible one (#116): aria-hidden takes an element out of the accessibility
 * tree and changes nothing on screen. In Chromium, a button inside
 * aria-hidden is left out of the accessibility tree, and still draws its
 * focus ring when the keyboard reaches it; the rule fails it, under 4.1.2
 * only.
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

const CASES = [
  ['a button with aria-hidden', '<button id="t" aria-hidden="true">Close</button>'],
  ['a link inside aria-hidden', '<div aria-hidden="true"><a id="t" href="#x">Read more</a></div>']
];

test(
  'aria-hidden-focus: the focus ring shows, the element is out of the accessibility tree, and the finding is 4.1.2, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    for (const [description, markup] of CASES) {
      await t.test(description, async () => {
        const page = await browser.newPage();
        try {
          await page.setContent(
            `<!doctype html><html lang="en"><head><title>Hidden</title></head><body style="margin:40px"><main>${markup}</main></body></html>`
          );
          const box = await page.evaluate(() => {
            const r = document.getElementById('t').getBoundingClientRect();
            return { x: r.left - 8, y: r.top - 8, width: r.width + 16, height: r.height + 16 };
          });
          const cdp = await page.context().newCDPSession(page);
          const { nodes } = await cdp.send('Accessibility.getFullAXTree');
          const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
          const { nodeId } = await cdp.send('DOM.querySelector', {
            nodeId: root.nodeId,
            selector: '#t'
          });
          const { node } = await cdp.send('DOM.describeNode', { nodeId });
          const ax = nodes.find((n) => n.backendDOMNodeId === node.backendNodeId);
          // Left out of the accessibility tree. (Once focused, Chromium exposes
          // it anyway, repairing the page; other browsers need not.)
          assert.ok(!ax || ax.ignored, 'left out of the accessibility tree');

          const before = await page.screenshot({ clip: box });
          await page.keyboard.press('Tab');
          assert.equal(await page.evaluate(() => document.activeElement.id), 't');
          const after = await page.screenshot({ clip: box });
          assert.ok(!before.equals(after), 'the focus ring is drawn');

          await page.evaluate(BUNDLE);
          const r = await page.evaluate(() => {
            const res = window.a11ycore.runa11yCoreInPage(location.href, null, {}, null);
            const rollup = (id) => res.rulesResults.find((x) => x.ruleId === id);
            return {
              rule: res.checksResults.find((x) => x.ruleId === 'aria-hidden-focus').outcome,
              name: rollup('wcag-4.1.2-name').outcome,
              focusVisible: rollup('wcag-2.4.7-focus-visible').outcome
            };
          });
          assert.equal(r.rule, 'fail');
          assert.equal(r.name, 'fail');
          assert.notEqual(r.focusVisible, 'fail');
        } finally {
          await page.close();
        }
      });
    }
  }
);

// Chromium makes a scroll container whose content overflows, and that holds
// nothing in the tab order, a tab stop of its own: inside aria-hidden it is
// a focus stop screen readers don't announce (round 8, NA-9). One whose
// content fits, or that holds a button, is not one.
test(
  'aria-hidden-focus: a scrolling box Chromium puts in the tab order counts as focusable (round 8, NA-9)',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const run = async (inner) => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>T</title></head><body><main><button id="before">before</button><div aria-hidden="true">${inner}</div><button>after</button></main></body></html>`
        );
        await page.focus('#before');
        await page.keyboard.press('Tab');
        const tabbedTo = await page.evaluate(() => document.activeElement.id);
        await page.evaluate(BUNDLE);
        const res = await page.evaluate(async () => {
          const r = await window.a11ycore.runa11yCoreInPage(null, null, {}, [
            'aria-hidden-focus',
            'scrollable-region-focusable'
          ]);
          return r.checksResults.map((x) => ({
            ruleId: x.ruleId,
            outcome: x.outcome,
            codes: (x.occurrences || []).map((o) => o.data.details.reasonCode),
            summaries: (x.occurrences || []).map((o) => o.summary)
          }));
        });
        return { tabbedTo, res: Object.fromEntries(res.map((x) => [x.ruleId, x])) };
      } finally {
        await page.close();
      }
    };

    const scroller = await run(
      '<div id="sc" style="overflow:auto;height:30px"><p style="height:200px">long text</p></div>'
    );
    assert.equal(scroller.tabbedTo, 'sc', 'Chromium tabs to the scrolling box');
    assert.equal(scroller.res['aria-hidden-focus'].outcome, 'fail');
    assert.deepEqual(scroller.res['aria-hidden-focus'].codes, ['ariaHiddenContainsFocusable']);
    assert.ok(
      scroller.res['scrollable-region-focusable'].summaries.every(
        (s) => !/neither it nor anything inside it can take keyboard focus/.test(s)
      )
    );

    const fits = await run('<div id="sc" style="overflow:auto;height:300px"><p>short</p></div>');
    assert.notEqual(fits.tabbedTo, 'sc');
    assert.equal(fits.res['aria-hidden-focus'].outcome, 'pass');
  }
);
