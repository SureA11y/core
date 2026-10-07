'use strict';

/**
 * valid-lang's message for a well-formed tag that names no language (#147).
 * "qaa" (the private-use range) and "eng" fail, as decided, but they are
 * well formed, so the message says they name no known language rather than
 * calling them malformed; "en_US" is malformed and is still called that.
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

test(
  'valid-lang names a well-formed unknown tag for what it is, in Chromium',
  { skip },
  async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const page = await browser.newPage();
      await page.setContent(
        '<!doctype html><html lang="fr"><head><title>t</title></head><body>' +
          '<p id="q" lang="qaa">x</p><p id="e" lang="eng-GB">y</p><p id="m" lang="en_US">z</p>' +
          '</body></html>'
      );
      await page.addScriptTag({ content: BUNDLE });
      const summaries = await page.evaluate(() => {
        const r = window.a11ycore.runa11yCoreInPage(null, null, {}, ['valid-lang']);
        const check = r.checksResults.find((c) => c.ruleId === 'valid-lang');
        return Object.fromEntries(
          check.occurrences.map((o) => [
            /id="(\w)"/.exec(o.html)[1],
            [o.summary, o.data.details.reasonCode]
          ])
        );
      });
      assert.match(summaries.q[0], /is well formed, but "qaa" names no known language/);
      assert.match(summaries.e[0], /is well formed, but "eng" names no known language/);
      assert.match(summaries.m[0], /is not a syntactically valid language tag/);
      for (const id of ['q', 'e', 'm']) assert.equal(summaries[id][1], 'ELEMENT_LANG_INVALID');
    } finally {
      await browser.close();
    }
  }
);
