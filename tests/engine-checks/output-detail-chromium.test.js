'use strict';

// output.detail: 'findings' in the browser bundle (#163): pass and
// notApplicable results are compact, a pass keeps its margin (text-spacing's
// closest text), and the
// verdicts and margins are those of the full result.

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

test('a compact result in Chromium keeps verdicts and margins', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><div style="white-space:nowrap;overflow:hidden;width:300px">Opening hours today</div><img src="data:,"></main></body></html>'
  );
  await page.addScriptTag({ content: BUNDLE });
  const got = await page.evaluate(() => {
    const run = (output) =>
      window.a11ycore.runa11yCoreInPage(null, null, output ? { output } : null);
    const full = run(null);
    const compact = run({ detail: 'findings' });
    const spacing = compact.checksResults.find((c) => c.ruleId === 'text-spacing-content-loss');
    return {
      detail: compact.engine.outputDetail,
      verdicts:
        JSON.stringify(compact.checksResults.map((c) => [c.ruleId, c.outcome])) ===
        JSON.stringify(full.checksResults.map((c) => [c.ruleId, c.outcome])),
      rollups:
        JSON.stringify(compact.rulesResults.map((r) => [r.ruleId, r.outcome])) ===
        JSON.stringify(full.rulesResults.map((r) => [r.ruleId, r.outcome])),
      margins:
        JSON.stringify(window.a11ycore.getMargins(compact)) ===
        JSON.stringify(window.a11ycore.getMargins(full)),
      spacing: Object.keys(spacing).sort(),
      failKept: !!compact.checksResults.find((c) => c.ruleId === 'img-alt-present').meta,
      smaller: JSON.stringify(compact).length < JSON.stringify(full).length / 2
    };
  });
  assert.deepEqual(got, {
    detail: 'findings',
    verdicts: true,
    rollups: true,
    margins: true,
    spacing: ['margin', 'outcome', 'ruleId', 'type'],
    failKept: true,
    smaller: true
  });
});

// A pack's rules aren't in the catalog a reader puts compact results back
// from, so a scan with packs registered in the page keeps every rule whole.
test('a compact result in Chromium with packs keeps every rule whole', { skip }, async (t) => {
  const { packScript } = require('../../src/pack.js');
  const sample = require('../fixtures/packs/sample.js');
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="data:,"></main></body></html>'
  );
  await page.addScriptTag({ content: BUNDLE });
  await page.addScriptTag({ content: packScript([sample]) });
  const name = `${sample.name}@${sample.version}`;
  const got = await page.evaluate((name) => {
    const r = window.a11ycore.runa11yCoreInPage(null, null, {
      packs: [name],
      profile: 'sample-1.0',
      output: { detail: 'findings' }
    });
    return {
      packs: r.engine.packs,
      detail: r.engine.outputDetail,
      bare: r.checksResults.filter((c) => !c.meta).map((c) => c.ruleId)
    };
  }, name);
  assert.deepEqual(got, { packs: [name], detail: 'findings', bare: [] });
});
