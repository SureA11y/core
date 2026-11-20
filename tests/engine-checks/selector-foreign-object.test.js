'use strict';

/**
 * jsdom's selector engine matches no camelCase SVG type selector followed by
 * a combinator: `svg > foreignObject > div` finds nothing there, though
 * Chromium finds the div. A path through such an element gives that step
 * an :nth-of-type, which both engines read, so a finding's selector inside
 * a <foreignObject> finds its element in jsdom and in Chromium.
 *
 * The Chromium test is skipped when Playwright or its Chromium build is not
 * installed. Set CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');
const { chromium, executablePath, skip } = require('../helpers/chromium');
const { addBundle } = require('../helpers/browserBundle');

// Buttons with no name inside a <foreignObject>, a <linearGradient> and a
// <clipPath>, one of them under a named <foreignObject>.
const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<svg><foreignObject width="10" height="10"><div><button></button></div></foreignObject>' +
  '<foreignObject width="10" height="10" aria-label="second"><button></button></foreignObject>' +
  '<g><foreignObject width="10" height="10"><p><button></button></p></foreignObject></g></svg>' +
  '</main></body></html>';

function selectors(result) {
  const check = result.checksResults.find((c) => c.ruleId === 'button-name-present');
  return check.occurrences.map((o) => o.selector);
}

test('a selector through a <foreignObject> finds its element in jsdom', () => {
  const found = selectors(runa11yCoreOnHtml(HTML, { runOnly: ['button-name-present'] }));
  assert.equal(found.length, 3);
  const { document } = new JSDOM(HTML).window;
  for (const selector of found) {
    const matched = document.querySelectorAll(selector);
    assert.equal(matched.length, 1, selector);
    assert.equal(matched[0].localName, 'button', selector);
  }
});

test('a selector through a <foreignObject> finds its element in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent(HTML);
  await addBundle(page);
  const counts = await page.evaluate(() => {
    const r = window.a11ycore.runa11yCoreInPage(null, null, {}, ['button-name-present']);
    return r.checksResults[0].occurrences.map((o) => [
      o.selector,
      document.querySelectorAll(o.selector).length
    ]);
  });
  await page.close();
  assert.equal(counts.length, 3);
  for (const [selector, n] of counts) assert.equal(n, 1, selector);
});
