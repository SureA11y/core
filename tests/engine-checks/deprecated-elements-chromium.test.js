'use strict';

/**
 * deprecated-elements-not-used in a real browser: the fail lean on a
 * <marquee> holds however the engine is added to the page. Injected as an
 * inline script, the engine's own bundle is page script that mentions
 * marquees; it is not a script that stops one.
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

const BUNDLE = path.join(__dirname, '../../surea11y.browser.js');
const RULE_ID = 'deprecated-elements-not-used';

test(
  `${RULE_ID} in Chromium: the bundle injected inline keeps the marquee's fail lean`,
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const p = await browser.newPage();
    await p.setContent(
      '<!doctype html><html lang="en"><head><title>t</title></head><body><main><marquee>Sale</marquee></main></body></html>'
    );
    await p.addScriptTag({ content: fs.readFileSync(BUNDLE, 'utf8') });
    const lean = await p.evaluate(async (rule) => {
      const r = await window.a11ycore.runa11yCoreInPage(null, null, {}, [rule]);
      const c = r.checksResults.find((x) => x.ruleId === rule);
      return c.occurrences[0].lean || null;
    }, RULE_ID);
    assert.equal(lean && lean.toward, 'fail');
  }
);
