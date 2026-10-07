'use strict';

/**
 * label-in-name doesn't split a word at a soft hyphen, a zero-width space or
 * an apostrophe (#153). Chromium renders "Down&shy;load" and
 * "Down&#8203;load" exactly as wide as "Download": the character draws
 * nothing, so the visible label is the one word. "Don’t" and "Dont" are
 * the same word less its apostrophe. A different word still fails.
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

// [visible label, aria-label, the rule's outcome]
const CASES = [
  ['Down&shy;load', 'Download', 'pass'],
  ['Down&#8203;load', 'Download', 'pass'],
  ['Don’t save', 'Dont save', 'pass'],
  ['Don’t save', 'Do not save', 'fail']
];

test(
  'label-in-name keeps words whole across invisible characters, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    await t.test('the invisible characters draw nothing', async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          '<span id="a">Download</span><br><span id="b">Down&shy;load</span><br><span id="c">Down&#8203;load</span>'
        );
        const widths = await page.evaluate(() =>
          ['a', 'b', 'c'].map((id) => document.getElementById(id).getBoundingClientRect().width)
        );
        assert.equal(widths[1], widths[0]);
        assert.equal(widths[2], widths[0]);
      } finally {
        await page.close();
      }
    });

    for (const [label, name, outcome] of CASES) {
      await t.test(`${label} / "${name}"`, async () => {
        const page = await browser.newPage();
        try {
          await page.setContent(
            `<!doctype html><html lang="en"><head><title>t</title></head><body><main><button aria-label="${name}">${label}</button></main></body></html>`
          );
          await page.addScriptTag({ content: BUNDLE });
          const got = await page.evaluate(
            () =>
              window.a11ycore.runa11yCoreInPage(null, null, {}, ['label-in-name']).checksResults[0]
                .outcome
          );
          assert.equal(got, outcome);
        } finally {
          await page.close();
        }
      });
    }
  }
);
