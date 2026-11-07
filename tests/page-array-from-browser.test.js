'use strict';

// In Chromium, a page whose own script replaces Array.from (Prototype,
// MooTools) is scanned, through runa11yCoreInPage and the browser bundle,
// and gives what the same page gives with the built-in intact. A caller's
// rule that uses Array.from stops the scan there. The jsdom side is in
// page-array-from.test.js.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { chromium, executablePath, skip } = require('./helpers/chromium');
const main = require('../src/index.js');
const {
  PATCHES,
  pageHtml,
  DATA_RULE_SOURCE,
  ARRAY_FROM_RULE_SOURCE,
  customRule,
  stable
} = require('./helpers/replaced-builtins.js');

const RUNNER = main.runa11yCoreInPage.toString();
const BUNDLE = fs.readFileSync(path.join(__dirname, '..', 'surea11y.browser.js'), 'utf8');

// The clean page has the script element too, empty, so both pages have the
// same markup.
const CLEAN = pageHtml('');

test('a page whose script replaced Array.from, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function withPage(html, fn) {
    const page = await browser.newPage();
    try {
      await page.setContent(html);
      return await fn(page);
    } finally {
      await page.close();
    }
  }
  const runInPage = (engineOptions) => (page) =>
    page.evaluate(`(${RUNNER})(location.href, null, ${JSON.stringify(engineOptions)}, null)`);
  const runBundle = (page) =>
    page.addScriptTag({ content: BUNDLE }).then(() => page.evaluate(() => window.a11ycore.run({})));

  await t.test('scanned as the clean page is, by runa11yCoreInPage and the bundle', async () => {
    const optionSets = [
      {},
      { customRules: [customRule('acme-data', DATA_RULE_SOURCE)] },
      { profile: ['wcag22-aa', 'section508'] }
    ];
    for (const engineOptions of optionSets) {
      const expected = stable(await withPage(CLEAN, runInPage(engineOptions)));
      for (const [name, patch] of Object.entries(PATCHES)) {
        const got = stable(await withPage(pageHtml(patch), runInPage(engineOptions)));
        assert.deepEqual(got, expected, `${name}, ${JSON.stringify(engineOptions)}`);
      }
    }
    const expected = stable(await withPage(CLEAN, runBundle));
    for (const [name, patch] of Object.entries(PATCHES)) {
      const got = stable(await withPage(pageHtml(patch), runBundle));
      assert.deepEqual(got, expected, `bundle, ${name}`);
    }
  });

  await t.test('a caller rule that uses Array.from stops the scan', async () => {
    const engineOptions = { customRules: [customRule('acme-from', ARRAY_FROM_RULE_SOURCE)] };
    for (const [name, patch] of Object.entries(PATCHES)) {
      await withPage(pageHtml(patch), async (page) => {
        await assert.rejects(
          runInPage(engineOptions)(page),
          /PAGE_BUILTINS_BROKEN|\(Array\.from\)/,
          name
        );
      });
    }
    const clean = await withPage(CLEAN, runInPage(engineOptions));
    assert.equal(clean.checksResults.find((c) => c.ruleId === 'acme-from').outcome, 'pass');
  });
});
