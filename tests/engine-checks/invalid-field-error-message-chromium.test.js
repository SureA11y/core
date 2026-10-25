'use strict';

/**
 * invalid-field-error-message in Chromium: a message hidden by a style
 * sheet fails, while one collapsed by its box or visually hidden is not
 * failed, since the page doesn't state it is hidden.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { chromium, executablePath, skip } = require('../helpers/chromium.js');

const { addBundle } = require('../helpers/browserBundle');
const RULE_ID = 'invalid-field-error-message';

const STYLE =
  '<style>.error { display: none; } .invisible { visibility: hidden; } .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }</style>';

// [the message element, the outcome, its reason code]
const CASES = [
  ['<p id="e">Enter an email address.</p>', 'pass', null],
  ['<p id="e" class="error">Enter an email address.</p>', 'cantTell', 'ERROR_MESSAGE_HIDDEN'],
  ['<p id="e" class="invisible">Enter an email address.</p>', 'cantTell', 'ERROR_MESSAGE_HIDDEN'],
  ['<p id="e" class="sr-only">Enter an email address.</p>', 'pass', null],
  [
    '<p id="e"><span class="error">Enter an email address.</span></p>',
    'cantTell',
    'ERROR_MESSAGE_EMPTY'
  ]
];

test(`${RULE_ID} reads style sheets in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [message, outcome, code] of CASES) {
    await t.test(message, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title>${STYLE}</head><body><main><label for="f">Email</label><input id="f" aria-invalid="true" aria-errormessage="e">${message}</main></body></html>`
        );
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
