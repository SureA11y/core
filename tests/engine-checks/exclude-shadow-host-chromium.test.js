'use strict';

/**
 * Excluding a shadow host, in a real browser (#129). What sits in the
 * host's shadow tree descends from it (a shadow-including descendant), so
 * an exclude of the host leaves it out of every rule: the contrast rules
 * too, which ask isExcluded about each text's element, however deep the
 * text sits and whether the exclude is global or for the rule alone.
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

const SHADOW = '<p style="color:#bbb">Faint text</p><button></button>';
const PAGES = {
  'in the shadow root of the excluded host': `<div id="widget"></div><script>document.getElementById('widget').attachShadow({ mode: 'open' }).innerHTML = ${JSON.stringify(SHADOW)};</script>`,
  'two shadow roots deep': `<div id="widget"></div><script>const r = document.getElementById('widget').attachShadow({ mode: 'open' }); r.innerHTML = '<span id="inner"></span>'; r.getElementById('inner').attachShadow({ mode: 'open' }).innerHTML = ${JSON.stringify(SHADOW)};</script>`,
  'in a host inside the excluded element': `<section id="widget"><div id="host"></div></section><script>document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML = ${JSON.stringify(SHADOW)};</script>`
};
const RULES = ['contrast-minimum', 'contrast-enhanced', 'button-name-present'];
const JUDGED = {
  'button-name-present': 'fail',
  'contrast-enhanced': 'fail',
  'contrast-minimum': 'fail'
};
const LEFT_OUT = {
  'button-name-present': 'notApplicable',
  'contrast-enhanced': 'pass',
  'contrast-minimum': 'pass'
};

test('an excluded shadow host takes its shadow tree with it, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(body, engineOptions) {
    const p = await browser.newPage();
    try {
      await p.setContent(
        '<!doctype html><html lang="en"><head><title>t</title><style>html{background:#fff}</style></head>' +
          `<body><main><p>Body text</p>${body}</main></body></html>`
      );
      await p.addScriptTag({ content: BUNDLE });
      return await p.evaluate(
        ({ eo, ids }) =>
          Object.fromEntries(
            window.a11ycore
              .runa11yCoreInPage(null, null, eo, ids)
              .checksResults.map((c) => [c.ruleId, c.outcome])
          ),
        { eo: engineOptions, ids: RULES }
      );
    } finally {
      await p.close();
    }
  }

  for (const [name, body] of Object.entries(PAGES)) {
    await t.test(`text ${name}`, async () => {
      assert.deepEqual(await scan(body, {}), JUDGED, 'judged without the exclude');
      assert.deepEqual(await scan(body, { excludeSelectors: ['#widget'] }), LEFT_OUT);
      const ruleScoped = {
        rules: Object.fromEntries(RULES.map((id) => [id, { excludeSelectors: ['#widget'] }]))
      };
      assert.deepEqual(await scan(body, ruleScoped), LEFT_OUT);
    });
  }
});
