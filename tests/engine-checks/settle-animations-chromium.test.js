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

const { addBundle } = require('../helpers/browserBundle');

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
      await addBundle(p);
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

  // Moving an animation makes the next read of one update the page's style,
  // so the scan reads them all before it moves any. Read and moved one at a
  // time, 4,000 animations took about 10 s; checked here by the order of the
  // reads and writes, not by a time.
  await t.test('every animation is read before any is moved', async () => {
    const p = await browser.newPage();
    try {
      const spans = Array.from({ length: 5 }, (_, i) => `<span class="a">M${i}</span>`).join(' ');
      await p.setContent(
        `<!doctype html><html lang="en"><head><title>t</title><style>@keyframes m{to{transform:translateX(50px)}}.a{display:inline-block;animation:m 10s infinite}</style></head><body><main>${spans}</main></body></html>`
      );
      // Before the bundle loads, so the engine reads through these too.
      await p.evaluate(() => {
        window.__animLog = [];
        const proto = Animation.prototype;
        const time = Object.getOwnPropertyDescriptor(proto, 'currentTime');
        const state = Object.getOwnPropertyDescriptor(proto, 'playState');
        Object.defineProperty(proto, 'currentTime', {
          configurable: true,
          get() {
            window.__animLog.push('r');
            return time.get.call(this);
          },
          set(v) {
            window.__animLog.push('w');
            time.set.call(this, v);
          }
        });
        Object.defineProperty(proto, 'playState', {
          configurable: true,
          get() {
            window.__animLog.push('r');
            return state.get.call(this);
          }
        });
      });
      await addBundle(p);
      const log = await p.evaluate(() => {
        window.__animLog.length = 0;
        window.a11ycore.runa11yCoreInPage(location.href, null, {}, ['img-alt-present']);
        return window.__animLog.join('');
      });
      // The settling reads, then the five moves, then the five moves back.
      const first = log.indexOf('w');
      assert.ok(first > 0, log);
      assert.equal(log.slice(first, first + 5), 'wwwww', log);
      assert.ok(!log.slice(0, first).includes('w'), log);
    } finally {
      await p.close();
    }
  });
});

// The document's getAnimations() leaves out the animations of elements in
// shadow trees: a fade in a component was measured wherever it had got to
// and its motion never reported (round 9, V9-1).
const SHADOW_PAGE = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>Shadow:</p><div id="host"></div></main><script>
  const inner = document.getElementById('host').attachShadow({ mode: 'open' });
  inner.innerHTML = '<div id="nest"></div><style>@keyframes fade{from{opacity:.1}to{opacity:1}} @keyframes mv{to{transform:translateX(50px)}} .a{animation:fade 60s linear forwards;color:#595959;background:#fff;font:16px sans-serif} .m{display:inline-block;animation:mv 2s infinite}</style><p class="a">Fading text in a component</p>';
  inner.getElementById('nest').attachShadow({ mode: 'open' }).innerHTML =
    '<style>@keyframes mv{to{transform:translateX(50px)}} .m{display:inline-block;animation:mv 2s infinite}</style><span class="m">Moving</span>';
</script></body></html>`;

test('animations in open shadow roots are settled and reported', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const scan = async (options) => {
    const p = await browser.newPage();
    try {
      await p.setContent(SHADOW_PAGE);
      await addBundle(p);
      return await p.evaluate((options) => {
        const fade = document.getElementById('host').shadowRoot.getAnimations()[0];
        fade.currentTime = 500;
        const r = window.a11ycore.runa11yCoreInPage(null, null, options, [
          'contrast-minimum',
          'moving-content-pausable'
        ]);
        const of = (id) => r.checksResults.find((c) => c.ruleId === id);
        return {
          contrast: of('contrast-minimum').outcome,
          moving: (of('moving-content-pausable').occurrences || []).map(
            (o) => o.data.details.reasonCode
          ),
          settled: r.engine.environment.animationsSettled,
          after: fade.currentTime
        };
      }, options);
    } finally {
      await p.close();
    }
  };
  await t.test('a fade in a component is judged at its end, and put back', async () => {
    const r = await scan({});
    assert.equal(r.contrast, 'pass');
    assert.equal(r.settled, 2, 'the fade and the nested marquee');
    assert.equal(r.after, 500);
  });
  await t.test('motion in a component, and in one nested in it, is reported', async () => {
    assert.deepEqual((await scan({})).moving, ['MOVING_CONTENT_OVER_5S', 'MOVING_CONTENT_LOOPS']);
  });
  await t.test('with includeShadowDom off they are left alone', async () => {
    const r = await scan({ includeShadowDom: false });
    assert.equal(r.settled, 0);
    assert.deepEqual(r.moving, []);
  });
});
