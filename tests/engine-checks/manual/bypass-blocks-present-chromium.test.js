'use strict';

/**
 * bypass-blocks-present in a real browser: a heading drawn wholly above the
 * top of the page, or left of its start, is never on screen, since no
 * scrolling reaches there (ACT 047fe0, Failed Example 2, hides its heading
 * at top: -999px). jsdom lays nothing out, so only a browser shows it.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

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

const { addBundle } = require('../../helpers/browserBundle');

const RULE_ID = 'bypass-blocks-present';

function page(heading, dir = 'ltr') {
  return `<!doctype html><html lang="en" dir="${dir}"><head><title>t</title></head><body>
    <nav><a href="/1">Chapter 1</a> <a href="/2">Chapter 2</a></nav>
    <div>${heading}<p>Unity succeeds division.</p></div></body></html>`;
}

test(
  `${RULE_ID} in Chromium: a heading no scrolling reaches is no way past repeated content`,
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    async function outcome(html) {
      const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
      try {
        const p = await context.newPage();
        await p.setContent(html);
        await addBundle(p);
        return await p.evaluate(async (rule) => {
          const r = await window.a11ycore.runa11yCoreInPage(null, null, {}, [rule]);
          return r.checksResults.find((c) => c.ruleId === rule).outcome;
        }, RULE_ID);
      } finally {
        await context.close();
      }
    }

    for (const [label, heading, dir] of [
      ['above the top of the page', '<h1 style="position:absolute;top:-999px">Chapter 1</h1>'],
      ['left of the page start', '<h1 style="position:absolute;left:-2000px">Chapter 1</h1>']
    ]) {
      await t.test(`${label}: cantTell`, async () => {
        assert.equal(await outcome(page(heading, dir)), 'cantTell');
      });
    }

    for (const [label, heading, dir] of [
      ['on the page', '<h1>Chapter 1</h1>'],
      [
        'partly above the top, the rest on screen',
        '<h1 style="position:absolute;top:-10px;font-size:40px">Chapter 1</h1>'
      ],
      // A right-to-left page scrolls left of its start.
      [
        'left of the start of a right-to-left page',
        '<h1 style="position:absolute;left:-2000px">Chapter 1</h1>',
        'rtl'
      ]
    ]) {
      await t.test(`${label}: pass`, async () => {
        assert.equal(await outcome(page(heading, dir)), 'pass');
      });
    }
  }
);
