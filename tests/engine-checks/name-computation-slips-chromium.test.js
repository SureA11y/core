'use strict';

/**
 * Smaller name and focus slips (#156), each checked against Chromium:
 * - an embedded control gives its value to the name it is part of
 *   (accname 2C), so a button labelled by "Volume <slider
 *   aria-valuetext=seven>" is named "Volume seven" and button-name-present
 *   passes it;
 * - <label for=" x"> labels no id="x": HTML compares the two exactly;
 * - tabindex is read as HTML reads integers: "-1x" is -1 (out of the tab
 *   order), a leading no-break space makes it invalid;
 * - an SVG <a xlink:href> takes focus, so it is focusable content under
 *   aria-hidden.
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

test('name computation and focus slips, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function withPage(body, fn) {
    const page = await browser.newPage();
    try {
      await page.setContent(
        `<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>x</p>${body}</main></body></html>`
      );
      return await fn(page);
    } finally {
      await page.close();
    }
  }
  const nameOf = async (page, id) => {
    const cdp = await page.context().newCDPSession(page);
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const { result } = await cdp.send('Runtime.evaluate', {
      expression: `document.getElementById(${JSON.stringify(id)})`
    });
    const { node } = await cdp.send('DOM.describeNode', { objectId: result.objectId });
    const ax = nodes.find((n) => n.backendDOMNodeId === node.backendNodeId);
    return ax && ax.name ? ax.name.value : '';
  };
  const outcomeOf = async (page, ruleId) => {
    await page.addScriptTag({ content: BUNDLE });
    return page.evaluate(
      (id) => window.a11ycore.runa11yCoreInPage(null, null, {}, [id]).checksResults[0].outcome,
      ruleId
    );
  };

  await t.test('an embedded slider gives its aria-valuetext', async () => {
    await withPage(
      '<span id="l">Volume <span role="slider" aria-valuenow="7" aria-valuetext="seven"></span></span><button id="t" aria-labelledby="l"></button>',
      async (page) => {
        assert.equal(await nameOf(page, 't'), 'Volume seven');
        assert.equal(await outcomeOf(page, 'button-name-present'), 'pass');
      }
    );
  });

  await t.test('<label for=" x"> labels nothing', async () => {
    await withPage('<label for=" x">Name</label><input id="x">', async (page) => {
      assert.equal(await nameOf(page, 'x'), '');
      assert.equal(await outcomeOf(page, 'form-control-programmatic-label-present'), 'fail');
    });
  });

  // [markup inside aria-hidden, whether Tab reaches it, the rule's outcome]
  for (const [inner, tabbable, outcome] of [
    ['<button id="f" tabindex="-1x">b</button>', false, 'pass'],
    ['<div id="f" tabindex="0x">d</div>', true, 'fail'],
    ['<div id="f" tabindex=" 0">d</div>', false, 'pass'],
    [
      '<svg width="50" height="20"><a id="f" xlink:href="/a"><text x="0" y="15">link</text></a></svg>',
      true,
      'fail'
    ]
  ]) {
    await t.test(`aria-hidden over ${inner}`, async () => {
      await withPage(`<input id="s"><div aria-hidden="true">${inner}</div>`, async (page) => {
        await page.focus('#s');
        await page.keyboard.press('Tab');
        const reached = await page.evaluate(() => document.activeElement.id === 'f');
        assert.equal(reached, tabbable, 'Chromium');
        assert.equal(await outcomeOf(page, 'aria-hidden-focus'), outcome);
      });
    });
  }
});
