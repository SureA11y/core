'use strict';

/**
 * valid-lang reads the text an element's lang governs in the flat tree
 * (#154), checked against what Chromium renders: text in a host's shadow
 * root is shown and governed by the host's lang, and light-DOM text under a
 * shadow root without a slot is never shown, so it governs nothing.
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

// [label, the shadow root's markup, the host's light-DOM text, whether
// "secret" is rendered (the host, which holds nothing else, has a height),
// the rule's outcome]
const CASES = [
  ['text only in the shadow root', '<p>secret</p>', '', true, 'fail'],
  ['light text, shadow root without a slot', '<p></p>', 'secret', false, 'notApplicable'],
  ['light text, slotted', '<p><slot></slot></p>', 'secret', true, 'fail']
];

test('valid-lang reads governed text in the flat tree, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [label, shadow, light, rendered, outcome] of CASES) {
    await t.test(label, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title></head><body><main><div id="host" lang="xx">${light}</div></main></body></html>`
        );
        await page.evaluate((html) => {
          document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML = html;
        }, shadow);
        const shown = await page.evaluate(
          () => document.getElementById('host').getBoundingClientRect().height > 0
        );
        assert.equal(shown, rendered, 'Chromium');
        await page.addScriptTag({ content: BUNDLE });
        const got = await page.evaluate(
          () =>
            window.a11ycore.runa11yCoreInPage(null, null, {}, ['valid-lang']).checksResults[0]
              .outcome
        );
        assert.equal(got, outcome);
      } finally {
        await page.close();
      }
    });
  }
});
