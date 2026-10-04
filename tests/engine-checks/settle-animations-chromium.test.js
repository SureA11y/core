'use strict';

/**
 * A scan settles the page's animations: a finite one is read at its end, an
 * infinite one at its start, and each is put back exactly where it was. A
 * scan taken during a fade-in used to measure the text at whatever opacity
 * it had reached, so the same page passed or failed depending on when it
 * was scanned.
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

// Light grey text that fades in from almost transparent: at its end it
// passes contrast (#595959 on white is 7:1), early on it does not.
const FADE_PAGE = `<!doctype html><html lang="en"><head><title>t</title><style>
  body{background:#fff;margin:20px;font:16px sans-serif}
  @keyframes fade{from{opacity:.1}to{opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  #msg{color:#595959;animation:fade 60s linear forwards}
  #spinner{display:inline-block;width:10px;height:10px;animation:spin 2s linear infinite}
</style></head><body><main><p id="msg">Become a host</p><span id="spinner"></span></main></body></html>`;

test('a scan settles animations and restores them', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function withPage(fn) {
    const p = await browser.newPage();
    try {
      await p.setContent(FADE_PAGE);
      await p.addScriptTag({ content: BUNDLE });
      return await fn(p);
    } finally {
      await p.close();
    }
  }

  // Seeks the fade to `at` ms, scans, and reports what the animations
  // looked like before and after the scan.
  const scanAt = (p, at) =>
    p.evaluate((at) => {
      const [fade, spin] = document.getAnimations();
      fade.currentTime = at;
      spin.currentTime = 700;
      const before = [fade, spin].map((a) => [a.currentTime, a.playState]);
      const r = window.a11ycore.runa11yCoreInPage(
        null,
        null,
        { rules: { include: 'contrast-minimum' } },
        null
      );
      const after = [fade, spin].map((a) => [a.currentTime, a.playState]);
      return {
        outcome: r.checksResults.find((c) => c.ruleId === 'contrast-minimum').outcome,
        settled: r.engine.environment.animationsSettled,
        before,
        after
      };
    }, at);

  await t.test('a fade-in is judged at its end, whenever the scan runs', async () => {
    await withPage(async (p) => {
      const early = await scanAt(p, 500);
      const late = await scanAt(p, 55000);
      assert.equal(early.outcome, 'pass', 'text 1% into its fade is judged as it ends up');
      assert.equal(late.outcome, 'pass');
      assert.equal(early.settled, 2);
    });
  });

  await t.test('every animation is back where it was, still running', async () => {
    await withPage(async (p) => {
      const r = await scanAt(p, 500);
      assert.deepEqual(r.after, r.before);
      assert.deepEqual(
        r.after.map(([, state]) => state),
        ['running', 'running']
      );
    });
  });

  await t.test('the page can still pause its animations with CSS afterwards', async () => {
    await withPage(async (p) => {
      await scanAt(p, 500);
      const state = await p.evaluate(() => {
        document.getElementById('spinner').style.animationPlayState = 'paused';
        return document.getAnimations()[1].playState;
      });
      assert.equal(state, 'paused', 'the scan did not pin the animation as playing');
    });
  });
});
