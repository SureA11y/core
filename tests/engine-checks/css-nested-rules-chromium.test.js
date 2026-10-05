'use strict';

/**
 * css-orientation-lock and css-focus-indicator-suppressed read every style
 * rule a page applies, wherever it sits: inside @layer, @supports, nested
 * @media, @container, a <style media>, or CSS nesting. css-orientation-lock
 * read only top-level @media, so a lock inside @layer (as every utility
 * framework writes it) passed; neither rule followed CSS nesting.
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

const LOCK = 'html{transform:rotate(90deg)}';
const PORTRAIT = '@media (orientation: portrait)';

test('CSS rules nested in at-rules and CSS nesting, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function outcome(head, ruleId) {
    const p = await browser.newPage({ viewport: { width: 400, height: 800 } });
    try {
      await p.setContent(
        `<!doctype html><html lang="en"><head><title>t</title>${head}</head>` +
          '<body><main><h1>T</h1><p>Text <a href="/">link</a></p></main></body></html>'
      );
      await p.addScriptTag({ content: BUNDLE });
      return await p.evaluate(
        (id) => window.a11ycore.runa11yCoreInPage(null, null, {}, [id]).checksResults[0].outcome,
        ruleId
      );
    } finally {
      await p.close();
    }
  }

  await t.test('css-orientation-lock finds a lock wherever it is nested', async () => {
    const locks = {
      '@layer': `<style>@layer base{${PORTRAIT}{${LOCK}}}</style>`,
      '@supports': `<style>@supports (display:grid){${PORTRAIT}{${LOCK}}}</style>`,
      'nested @media': `<style>@media screen{${PORTRAIT}{${LOCK}}}</style>`,
      '@container': `<style>body{container-type:inline-size}@container (min-width:1px){${PORTRAIT}{${LOCK}}}</style>`,
      'CSS nesting': `<style>html{${PORTRAIT}{transform:rotate(90deg)}}</style>`,
      '<style media>': `<style media="(orientation: portrait)">${LOCK}</style>`
    };
    for (const [name, head] of Object.entries(locks)) {
      assert.equal(await outcome(head, 'css-orientation-lock'), 'fail', name);
    }
    assert.equal(
      await outcome(
        `<style>@layer base{@media (min-width:1px){${LOCK}}}</style>`,
        'css-orientation-lock'
      ),
      'pass',
      'a rotation under no orientation condition is not a lock'
    );
  });

  await t.test('css-focus-indicator-suppressed follows CSS nesting', async () => {
    const suppressed = {
      '&:focus': '<style>a{&:focus{outline:none}}</style>',
      '&:focus in @layer': '<style>@layer x{a{&:focus{outline:none}}}</style>',
      'declarations in @media under a:focus':
        '<style>a:focus{@media (hover:hover){outline:none}}</style>'
    };
    for (const [name, head] of Object.entries(suppressed)) {
      assert.equal(await outcome(head, 'css-focus-indicator-suppressed'), 'cantTell', name);
    }
    assert.equal(
      await outcome(
        '<style>a{&:focus{outline:none;box-shadow:0 0 0 3px blue}}</style>',
        'css-focus-indicator-suppressed'
      ),
      'notApplicable',
      'a nested replacement indicator is credited'
    );
  });
});
