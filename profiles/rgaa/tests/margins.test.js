'use strict';

/**
 * RGAA's rules that measure a contrast against a threshold report a margin
 * (OUTPUT_SCHEMA.md, check result): the closest element that still reached
 * it. contrast-minimum-rgaa runs in jsdom, since contrast is computed from
 * CSS; focus-indicator-contrast and link-state-colors-review need a browser
 * to put focus and states on the page.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { runa11yCoreOnHtml } = require('../../../tests/helpers/runDomRulesOnHtml.js');

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
const BUNDLE = fs.readFileSync(require.resolve('@surea11y/core/browser'), 'utf8');

test('contrast-minimum-rgaa: the closest passing text is the margin', () => {
  const html =
    '<!doctype html><html lang="fr"><head><title>t</title></head><body style="background:#fff;color:#000">' +
    '<p id="black">Texte noir</p><p id="grey" style="color:#767676">Texte gris</p></body></html>';
  const result = runa11yCoreOnHtml(html, {
    runOnly: { includeRuleIds: ['contrast-minimum-rgaa'] }
  });
  const r = result.checksResults.find((c) => c.ruleId === 'contrast-minimum-rgaa');
  assert.equal(r.outcome, 'pass');
  assert.equal(r.margin.measure, 'contrast-ratio');
  assert.equal(r.margin.selector, '#grey');
  assert.equal(r.margin.threshold, 4.5);
});

test('RGAA focus and link-state margins in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  async function margin(ruleId, body) {
    const p = await browser.newPage();
    try {
      await p.setContent(
        `<!doctype html><html lang="fr"><head><title>t</title><style>body{color:#000;background:#fff}</style></head><body><main>${body}</main></body></html>`
      );
      await p.addScriptTag({ content: BUNDLE });
      return await p.evaluate((id) => {
        const r = window.a11ycore.runa11yCoreInPage(null, null, {}, { includeRuleIds: [id] });
        const c = r.checksResults.find((x) => x.ruleId === id);
        return { outcome: c.outcome, margin: c.margin };
      }, ruleId);
    } finally {
      await p.close();
    }
  }

  await t.test('focus-indicator-contrast: the indicator closest to 3:1', async () => {
    const { outcome, margin: m } = await margin(
      'focus-indicator-contrast',
      '<style>button{outline:none;border:2px solid #fff;background:#fff;color:#000} #dark:focus-visible{outline:3px solid #000;outline-offset:2px} #grey:focus-visible{outline:3px solid #767676;outline-offset:2px}</style>' +
        '<button id="dark">Un</button> <button id="grey">Deux</button>'
    );
    assert.equal(outcome, 'pass');
    assert.equal(m.selector, '#grey');
    assert.equal(m.threshold, 3);
    assert.ok(m.value >= 3 && m.value < 5, String(m.value));
    assert.equal(m.context.property.startsWith('outline'), true, m.context.property);
  });

  await t.test('link-state-colors-review: the state closest to 3:1', async () => {
    const { outcome, margin: m } = await margin(
      'link-state-colors-review',
      '<style>a{color:#4a90e2;text-decoration:none} a:hover{color:#5a5a5a}</style>' +
        '<p>Lisez <a id="l" href="/x">la notice</a> avant.</p>'
    );
    assert.equal(outcome, 'pass');
    assert.equal(m.selector, '#l');
    assert.equal(m.context.state, 'hover');
    assert.ok(m.value >= 3, String(m.value));
  });
});
