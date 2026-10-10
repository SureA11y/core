'use strict';

// text-spacing-content-loss quotes the text an element shows: not the
// contents of a <style> inside it (a CSS-in-JS rule rendered with the
// component), nor of a <script>.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let chromium = null;
try {
  ({ chromium } = require('playwright'));
} catch {}

const BUNDLE = fs.readFileSync(path.join(__dirname, '../../surea11y.browser.js'), 'utf8');

test(
  'text-spacing quotes the text an element shows',
  { skip: chromium ? false : 'playwright not installed' },
  async (t) => {
    const browser = await chromium.launch();
    t.after(() => browser.close());
    const page = await browser.newPage();
    await page.setContent(
      '<!doctype html><html lang="en"><head><title>t</title></head><body><main><article>' +
        '<div style="overflow:hidden;height:18px;width:200px;line-height:18px;font-size:16px">' +
        '<style>.css-1cfnwmw{width:18px;color:red}</style><script>var x = 1;</script>' +
        'Two words fit, but at 1.5 line height the second line is lost lost lost lost lost</div>' +
        '</article></main></body></html>'
    );
    await page.addScriptTag({ content: BUNDLE });
    const summaries = await page.evaluate(() =>
      window.a11ycore
        .runa11yCoreInPage(null, null, null, ['text-spacing-content-loss'])
        .checksResults[0].occurrences.map((o) => o.summary)
    );
    assert.ok(summaries.length > 0);
    assert.ok(
      summaries.every((s) => !/css-1cfnwmw|var x/.test(s)),
      summaries.join('\n')
    );
    assert.ok(
      summaries.some((s) => /"Two words fit/.test(s)),
      summaries.join('\n')
    );
  }
);
