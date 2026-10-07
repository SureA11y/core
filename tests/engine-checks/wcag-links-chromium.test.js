'use strict';

/**
 * WCAG criterion links from a scan in a real browser (#144): each WCAG
 * mapping on the result links its criterion and Understanding document,
 * and the reporters give the Understanding document as the help link of
 * a rule with none of its own.
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
const { renderSarifReport } = require('../../src/sarif.js');
const { renderHtmlReport } = require('../../src/report.js');

test(
  'a scan in Chromium carries criterion links, and the reporters use them',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const page = await browser.newPage();
    t.after(() => page.close());
    await page.setContent(
      '<!doctype html><html lang="en"><head><title>t</title><style>html{background:#fff}</style></head><body><main><img src="data:,"><p style="color:#bbb">Faint</p></main></body></html>'
    );
    await page.addScriptTag({ content: BUNDLE });
    const result = await page.evaluate(() =>
      window.a11ycore.runa11yCoreInPage('https://example.test/', null, {}, [
        'img-alt-present',
        'contrast-minimum'
      ])
    );

    const mapping = (id) =>
      result.checksResults
        .find((c) => c.ruleId === id)
        .meta.normativeMappings.find((m) => m.standard === 'WCAG');
    assert.equal(mapping('img-alt-present').url, 'https://www.w3.org/TR/WCAG22/#non-text-content');
    assert.equal(
      mapping('contrast-minimum').understandingUrl,
      'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html'
    );

    const helpUris = JSON.parse(renderSarifReport(result))
      .runs[0].tool.driver.rules.map((r) => r.helpUri)
      .sort();
    assert.deepEqual(helpUris, [
      'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html',
      'https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html'
    ]);
    assert.match(renderHtmlReport(result), />Understanding 1\.4\.3 Contrast \(Minimum\)<\/a>/);
  }
);
