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
const { addBundle } = require('../../helpers/browserBundle');

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
    await addBundle(p);
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

// Motion nothing shows is left out: keyframes that change nothing, or only
// a custom property, and an element not drawn while it runs (clipped to
// nothing, no size with its overflow clipped, wholly left of the page).
// Where the animation can bring it into view (a marquee sliding through
// its box, a fade from opacity 0, a slide from off the page) it is asked
// about as before.
const UNSEEN_PAGE = `<!doctype html><html lang="en"><head><title>t</title><style>
  @property --x { syntax: "<number>"; inherits: false; initial-value: 0 }
  @keyframes custom { to { --x: 1 } }
  @keyframes same { from { transform: none } to { transform: none } }
  @keyframes slide { from { transform: translateX(0) } to { transform: translateX(100px) } }
  @keyframes marquee { from { transform: translateX(300px) } to { transform: translateX(-300px) } }
  @keyframes enter { from { transform: translateX(0) } to { transform: translateX(10500px) } }
  @keyframes fade { from { opacity: 0 } to { opacity: 1 } }
  .loop { animation-duration: 2s; animation-iteration-count: infinite; }
  #custom { animation-name: custom; }
  #same { animation-name: same; }
  #nosize { animation-name: slide; width: 0; height: 0; overflow: hidden; }
  #offleft { animation-name: slide; position: absolute; left: -9999px; }
  #sronly { animation-name: slide; position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  #flat { height: 0; overflow: hidden; }
  #inflat { animation-name: slide; }
  #box { width: 200px; overflow: hidden; }
  #marquee { animation-name: marquee; white-space: nowrap; }
  #fade { animation-name: fade; }
  #enter { animation-name: enter; position: absolute; left: -10000px; top: 0; }
</style></head><body>
  <p class="loop" id="custom">Custom</p>
  <p class="loop" id="same">Same</p>
  <div class="loop" id="nosize">No size</div>
  <p class="loop" id="offleft">Off the page</p>
  <p class="loop" id="sronly">Screen reader only</p>
  <div id="flat"><p class="loop" id="inflat">In a flat box</p></div>
  <div id="box"><p class="loop" id="marquee">News ticker</p></div>
  <p class="loop" id="fade">Fades in</p>
  <p class="loop" id="enter">Slides in</p>
</body></html>`;

test(
  `${RULE_ID}: leaves out motion nothing shows, in Chromium (round 9, V9-14)`,
  { skip },
  async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const p = await browser.newPage();
      await p.setContent(UNSEEN_PAGE);
      await addBundle(p);
      const selectors = await p.evaluate((id) => {
        const res = window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: id } }, null);
        return res.checksResults.find((c) => c.ruleId === id).occurrences.map((o) => o.selector);
      }, RULE_ID);
      assert.deepEqual(selectors.sort(), ['#enter', '#fade', '#marquee']);
    } finally {
      await browser.close();
    }
  }
);

test(`${RULE_ID}: without animations it is notApplicable`, () => {
  const { runa11yCoreOnHtml } = require('../../../src/testing.js');
  const result = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><p>Still</p></body></html>',
    { runOnly: [RULE_ID] }
  );
  assert.equal(result.checksResults.find((c) => c.ruleId === RULE_ID).outcome, 'notApplicable');
});
