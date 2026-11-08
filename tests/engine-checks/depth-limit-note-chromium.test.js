'use strict';

/**
 * In Chromium too, an element 200 or more deep is judged with every ancestor
 * it has: an image without alt 200, 300 or 500 elements deep fails, as one
 * near the root does, where the walk up from it used to stop at 200 and
 * make the fail a cantTell.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { chromium, executablePath, skip } = require('../helpers/chromium');
const { addBundle } = require('../helpers/browserBundle');

test('an image deep in the page without alt fails, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  for (const depth of [200, 300, 500]) {
    const page = await browser.newPage();
    const deep = '<div>'.repeat(depth) + '<img src="a.png">' + '</div>'.repeat(depth);
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${deep}</main></body></html>`
    );
    await addBundle(page);
    const check = await page.evaluate(() => {
      const c = window.a11ycore.runa11yCoreInPage(null, null, {}, ['img-alt-present'])
        .checksResults[0];
      return {
        outcome: c.outcome,
        occurrences: c.occurrences.length,
        error: c.error || null,
        limit: c.ancestorWalkLimit || null
      };
    });
    await page.close();
    assert.deepEqual(
      check,
      { outcome: 'fail', occurrences: 1, error: null, limit: null },
      `${depth}`
    );
  }
});
