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
