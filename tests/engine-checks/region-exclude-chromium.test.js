'use strict';

/**
 * region and excludeSelectors, in a real browser (#130). Excluded content
 * is not judged: an excluded cookie banner is no content outside a
 * landmark, and a reported gap stops at excluded content rather than
 * taking it in, whether the exclude is global or for the rule alone.
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
  [
    'an excluded banner',
    '<div id="banner"><p>Cookie text</p></div><main><p>Main</p></main>',
    ['#banner'],
    []
  ],
  [
    'an excluded banner beside stray text',
    '<div id="banner"><p>Cookie text</p></div><p id="stray">Stray</p><main><p>Main</p></main>',
    ['#banner'],
    ['stray']
  ],
  [
    'stray text around an excluded banner',
    '<div id="wrap"><p id="s1">Stray one</p><div id="banner"><p>Cookie</p></div><p id="s2">Stray two</p></div><main><p>Main</p></main>',
    ['#banner'],
    ['s1', 's2']
  ],
  [
    'content excluded by a descendant selector',
    '<div class="ad"><span>Ad</span></div><main><p>Main</p></main>',
    ['.ad span'],
    []
  ],
  [
    'nothing excluded',
    '<div id="banner"><p>Cookie text</p></div><main><p>Main</p></main>',
    [],
    ['banner']
  ]
];

test('region leaves out excluded content, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [name, body, selectors, reported] of CASES) {
    for (const scope of ['global', 'rule']) {
      await t.test(`${name}, ${scope}`, async () => {
        const p = await browser.newPage();
        try {
          await p.setContent(
            `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`
          );
          await p.addScriptTag({ content: BUNDLE });
          const ids = await p.evaluate(
            ({ selectors, scope }) => {
              const eo =
                scope === 'global'
                  ? { excludeSelectors: selectors }
                  : { rules: { region: { excludeSelectors: selectors } } };
              const c = window.a11ycore.runa11yCoreInPage(null, null, eo, ['region'])
                .checksResults[0];
              return c.occurrences.map((o) => document.querySelector(o.selector).id).sort();
            },
            { selectors, scope }
          );
          assert.deepEqual(ids, reported);
        } finally {
          await p.close();
        }
      });
    }
  }
});
