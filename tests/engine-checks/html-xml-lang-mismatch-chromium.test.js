'use strict';

// html-xml-lang-mismatch in Chromium (#167): an xml:lang with no primary
// language subtag has no language to compare.

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

test('html-xml-lang-mismatch: an xml:lang with no language, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const outcome = async (attrs) => {
    await page.setContent(
      `<!doctype html><html ${attrs}><head><title>t</title></head><body><main>x</main></body></html>`
    );
    await page.addScriptTag({ content: BUNDLE });
    return page.evaluate(
      () =>
        window.a11ycore.runa11yCoreInPage(null, null, null, ['html-xml-lang-mismatch'])
          .checksResults[0].outcome
    );
  };
  assert.equal(await outcome('lang="en" xml:lang="x-foo"'), 'notApplicable');
  assert.equal(await outcome('lang="en" xml:lang="!!"'), 'notApplicable');
  assert.equal(await outcome('lang="en" xml:lang="fr"'), 'fail');
  assert.equal(await outcome('lang="en" xml:lang="en-GB"'), 'pass');
});
