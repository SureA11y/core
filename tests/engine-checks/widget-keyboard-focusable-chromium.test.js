'use strict';

/**
 * widget-keyboard-focusable against what Chromium's Tab key does: a widget
 * the rule passes is reached by Tab, and one it asks about is not.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { chromium, executablePath, skip } = require('../helpers/chromium.js');

const { addBundle } = require('../helpers/browserBundle');
const RULE_ID = 'widget-keyboard-focusable';

// [markup with the widget as #w, whether Tab lands in #w, the outcome, its reason code]
const CASES = [
  ['<div id="w" role="button" tabindex="0">Save</div>', true, 'pass', null],
  ['<div id="w" role="button">Save</div>', false, 'cantTell', 'WIDGET_NOT_FOCUSABLE'],
  [
    '<div id="w" role="button" tabindex="-1">Save</div>',
    false,
    'cantTell',
    'WIDGET_NOT_IN_TAB_ORDER'
  ],
  [
    '<div id="w" role="button" tabindex="0" style="visibility:hidden">Save</div><div role="button" tabindex="0">Other</div>',
    false,
    'pass',
    null
  ],
  [
    '<div id="w" role="listbox" aria-label="Fruit"><div role="option" tabindex="0">Apple</div><div role="option" tabindex="-1">Pear</div></div>',
    true,
    'pass',
    null
  ],
  [
    '<div id="w" role="listbox" aria-label="Fruit"><div role="option" tabindex="-1">Apple</div></div>',
    false,
    'cantTell',
    'COMPOSITE_NO_TAB_STOP'
  ],
  [
    '<div id="w" role="combobox" aria-expanded="false"><input aria-label="City"></div>',
    true,
    'pass',
    null
  ]
];

test(`${RULE_ID} follows what Chromium's Tab key reaches`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [markup, tabbed, outcome, code] of CASES) {
    await t.test(markup, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${markup}</main></body></html>`
        );
        await page.keyboard.press('Tab');
        const inWidget = await page.evaluate(() => {
          const w = document.getElementById('w');
          const a = document.activeElement;
          return !!a && a !== document.body && (a === w || w.contains(a));
        });
        assert.equal(inWidget, tabbed, 'Tab reaches it in Chromium');

        await addBundle(page);
        const got = await page.evaluate((id) => {
          const r = window.a11ycore.runa11yCoreInPage(null, null, {}, [id]).checksResults[0];
          const occ = (r.occurrences || [])[0];
          return {
            outcome: r.outcome,
            code: (occ && occ.data && occ.data.details && occ.data.details.reasonCode) || null
          };
        }, RULE_ID);
        assert.deepEqual(got, { outcome, code });
      } finally {
        await page.close();
      }
    });
  }
});
