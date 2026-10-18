'use strict';

/**
 * moving-content-pausable in a real browser: the animations it reads are
 * the ones running when the scan started, before the engine moved them to
 * a fixed point, so a ten-second animation that started by itself is seen.
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

const RULE_ID = 'moving-content-pausable';
const BUNDLE = fs.readFileSync(path.join(__dirname, '../../../surea11y.browser.js'), 'utf8');

const PAGE = `<!doctype html><html lang="en"><head><title>t</title><style>
  @keyframes slide { from { transform: translateX(0) } to { transform: translateX(100px) } }
  #ticker { animation: slide 2s linear infinite; }
  #banner { animation: slide 10s linear 1; }
  #nudge { animation: slide 3s linear 1; }
  #hidden { animation: slide 2s linear infinite; display: none; }
  #twice { animation: slide 3s linear 2; }
</style></head><body>
  <p id="ticker">Breaking news</p>
  <p id="banner">Welcome</p>
  <p id="nudge">Look here</p>
  <p id="hidden">Not shown</p>
  <p id="twice">Twice over</p>
</body></html>`;

test(`${RULE_ID} in Chromium`, { skip }, async () => {
  const browser = await chromium.launch({ executablePath });
  try {
    const p = await browser.newPage();
    await p.setContent(PAGE);
    await p.addScriptTag({ content: BUNDLE });
    const r = await p.evaluate((id) => {
      const res = window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: id } }, null);
      const own = res.checksResults.find((c) => c.ruleId === id);
      return {
        outcome: own.outcome,
        codes: Object.fromEntries(
          own.occurrences.map((o) => [o.selector, o.data.details.reasonCode])
        ),
        names: own.occurrences.map((o) => o.data.details.animations[0].name),
        // The page's animations are back where they were after the scan.
        stillRunning: document.getAnimations().filter((a) => a.playState === 'running').length
      };
    }, RULE_ID);
    assert.equal(r.outcome, 'cantTell');
    assert.deepEqual(r.codes, {
      '#ticker': 'MOVING_CONTENT_LOOPS',
      '#banner': 'MOVING_CONTENT_OVER_5S',
      '#twice': 'MOVING_CONTENT_OVER_5S'
    });
    assert.deepEqual(r.names, ['slide', 'slide', 'slide']);
    assert.equal(r.stillRunning, 4);
  } finally {
    await browser.close();
  }
});

test(`${RULE_ID}: without animations it is notApplicable`, () => {
  const { runa11yCoreOnHtml } = require('../../../src/testing.js');
  const result = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><p>Still</p></body></html>',
    { runOnly: [RULE_ID] }
  );
  assert.equal(result.checksResults.find((c) => c.ruleId === RULE_ID).outcome, 'notApplicable');
});
