'use strict';

/**
 * excludeSelectors as a string, in a real browser (#127). The string is a
 * selector list, cut only at the commas between selectors, so a comma
 * inside :not(), :is(), an attribute value or an escape stays in its
 * selector. What a scan leaves out is checked against the browser's own
 * matches() for the same selector.
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

const SELECTORS = [
  'img:not(.a, .b)',
  ':is(.a, .b)',
  ':where(.a, .b)',
  'img:not(.a, .b), .c',
  '[data-x=","]',
  '[data-x=","], .c',
  '.a\\,b',
  '.a, .b'
];

test(
  'an excludeSelectors string leaves out what the browser matches, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const page = await browser.newPage();
    t.after(() => page.close());
    await page.setContent(
      '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
        '<img src="data:," id="a" class="a"><img src="data:," id="b" class="b">' +
        '<img src="data:," id="c" class="c"><img src="data:," id="ab" class="a,b">' +
        '<img src="data:," id="x" data-x=","><img src="data:," id="keep" class="keep">' +
        '</main></body></html>'
    );
    await page.addScriptTag({ content: BUNDLE });

    for (const selector of SELECTORS) {
      for (const scope of ['global', 'rule']) {
        await t.test(`${JSON.stringify(selector)}, ${scope}`, async () => {
          const r = await page.evaluate(
            ({ selector, scope }) => {
              const warned = [];
              const { warn } = console;
              console.warn = (m) => warned.push(String(m));
              try {
                const eo =
                  scope === 'global'
                    ? { excludeSelectors: selector }
                    : { rules: { 'img-alt-present': { excludeSelectors: selector } } };
                const res = window.a11ycore.runa11yCoreInPage(null, null, eo, ['img-alt-present']);
                const reported = new Set(
                  res.checksResults[0].occurrences.map((o) => document.querySelector(o.selector))
                );
                const imgs = [...document.querySelectorAll('img')];
                return {
                  left: imgs.filter((el) => !reported.has(el)).map((el) => el.id),
                  matched: imgs.filter((el) => el.matches(selector)).map((el) => el.id),
                  warned
                };
              } finally {
                console.warn = warn;
              }
            },
            { selector, scope }
          );
          assert.deepEqual(r.left, r.matched);
          assert.deepEqual(r.warned, []);
        });
      }
    }
  }
);
