'use strict';

/**
 * target-size-minimum in a real browser, where hit-testing decides what a
 * pointer can reach: a visually hidden control is no target (#37), and a
 * neighbour covered by an overlay near the target is no conflict (#38).
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

const RULE_ID = 'target-size-minimum';
const BUNDLE = fs.readFileSync(path.join(__dirname, '../../../surea11y.browser.js'), 'utf8');

const SR_ONLY =
  'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;white-space:nowrap;border:0';
// Beside the skip link's spot (10 to 20px), not over it: 4px off, inside
// its spacing circle.
const MENU =
  '<button id="menu" style="position:absolute;top:0;left:24px;width:30px;height:30px;margin:0">Menu</button>';

// A card link whose centre is 12.5px from a 16px-high button's, as on
// bbc.co.uk/news at 390px, where the button sat in a fixed cookie banner.
const CARD =
  '.card{position:absolute;left:16px;top:806px;width:358px;height:111px;background:#eee}';
const BUTTON = 'width:358px;height:16px;padding:0;border:0';

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(body, contextSelector = null) {
    const p = await browser.newPage({ viewport: { width: 390, height: 900 } });
    try {
      await p.setContent(
        `<!doctype html><html lang="en"><head><title>t</title><style>body{margin:0;font:16px sans-serif}</style></head><body>${body}</body></html>`
      );
      await p.addScriptTag({ content: BUNDLE });
      const result = await p.evaluate(
        ([id, scope]) =>
          window.a11ycore.runa11yCoreInPage(null, scope, { rules: { include: id } }, null),
        [RULE_ID, contextSelector]
      );
      const r = result.checksResults.find((c) => c.ruleId === RULE_ID);
      return [r.outcome, r.occurrences.map((o) => [o.selector, o.data.details.reasonCode])];
    } finally {
      await p.close();
    }
  }

  await t.test('a control clipped to nothing is not a target (#37)', async () => {
    for (const clip of [
      'clip:rect(0,0,0,0)',
      'clip:rect(1px,1px,1px,1px)',
      'clip-path:inset(50%)'
    ]) {
      const link = `<a id="skip" href="#main" style="${SR_ONLY};${clip};top:10px;left:10px">Skip to content</a>`;
      assert.equal((await scan(`${link}${MENU}<main id="main">x</main>`))[0], 'pass', clip);
    }
    // Clipped by an ancestor, as when the class sits on a wrapper.
    const wrapped = `<span style="${SR_ONLY};clip:rect(0 0 0 0);top:10px;left:10px"><a href="#main">Skip</a></span>`;
    assert.equal((await scan(`${wrapped}${MENU}<main id="main">x</main>`))[0], 'pass');
  });

  await t.test('the same small link, not clipped, still fails', async () => {
    const link =
      '<a id="skip" href="#main" style="position:absolute;top:10px;left:10px;width:10px;height:10px;overflow:hidden">S</a>';
    const [outcome, findings] = await scan(`${link}${MENU}<main id="main">x</main>`);
    assert.equal(outcome, 'fail');
    assert.ok(
      findings.some(([selector]) => selector === '#skip'),
      JSON.stringify(findings)
    );
  });

  await t.test('a neighbour under a fixed overlay is no conflict (#38)', async () => {
    const [outcome] = await scan(
      `<style>${CARD} .banner{position:fixed;left:0;right:0;bottom:0;height:160px;background:#222;z-index:10} .banner button{position:absolute;left:16px;top:101px;${BUTTON}}</style>` +
        '<a class="card" href="/story">A story</a><div class="banner"><button id="yes">Yes, I agree</button></div>'
    );
    assert.equal(outcome, 'pass');
  });

  await t.test('the same button on the exposed card still fails', async () => {
    assert.deepEqual(
      await scan(
        `<style>${CARD} #yes{position:absolute;left:16px;top:841px;${BUTTON}}</style>` +
          '<a class="card" href="/story">A story</a><button id="yes">Yes, I agree</button>'
      ),
      ['fail', [['#yes', 'undersized-and-too-close']]]
    );
  });

  await t.test('a neighbour below the fold is still a conflict', async () => {
    // Out of the viewport elementFromPoint returns nothing, which proves
    // nothing: the distance check keeps the conflict.
    const [outcome] = await scan(
      '<button id="a" style="position:absolute;top:2000px;left:10px;width:10px;height:10px;padding:0">A</button>' +
        '<button id="b" style="position:absolute;top:2000px;left:30px;width:10px;height:10px;padding:0">B</button>'
    );
    assert.equal(outcome, 'fail');
  });

  await t.test('under a scoped scan, a neighbour just outside the scope still counts', async () => {
    const body =
      '<div id="widget"><button id="a" style="position:absolute;top:10px;left:10px;width:10px;height:10px;padding:0">A</button></div>' +
      '<button id="b" style="position:absolute;top:10px;left:24px;width:10px;height:10px;padding:0">B</button>';
    const [outcome, occurrences] = await scan(body, '#widget');
    assert.equal(outcome, 'fail');
    assert.deepEqual(
      occurrences.map(([selector]) => selector),
      ['#a'],
      'only the target in scope is reported'
    );
  });

  await t.test(
    'under a scoped scan, a lone small target with no neighbour still passes',
    async () => {
      const body =
        '<div id="widget"><button id="a" style="position:absolute;top:10px;left:10px;width:10px;height:10px;padding:0">A</button></div>' +
        '<button id="b" style="position:absolute;top:300px;left:300px;width:10px;height:10px;padding:0">B</button>';
      assert.equal((await scan(body, '#widget'))[0], 'pass');
    }
  );

  async function marginOf(body) {
    const p = await browser.newPage({ viewport: { width: 390, height: 900 } });
    try {
      await p.setContent(
        `<!doctype html><html lang="en"><head><title>t</title><style>body{margin:0;font:16px sans-serif} button{position:absolute;padding:0;border:0}</style></head><body>${body}</body></html>`
      );
      await p.addScriptTag({ content: BUNDLE });
      const result = await p.evaluate(
        (id) => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: id } }, null),
        RULE_ID
      );
      const r = result.checksResults.find((c) => c.ruleId === RULE_ID);
      return { outcome: r.outcome, margin: r.margin };
    } finally {
      await p.close();
    }
  }

  await t.test('the smallest target of at least 24 by 24 is the margin', async () => {
    const { outcome, margin } = await marginOf(
      '<button id="big" style="top:0;left:0;width:48px;height:48px">A</button>' +
        '<button id="snug" style="top:100px;left:0;width:60px;height:24.4px">B</button>' +
        '<button id="square" style="top:200px;left:0;width:30px;height:30px">C</button>'
    );
    assert.equal(outcome, 'pass');
    assert.equal(margin.measure, 'target-size-px');
    assert.equal(margin.limit, 'min');
    assert.equal(margin.selector, '#snug');
    assert.equal(margin.threshold, 24);
    assert.equal(margin.value, 24.4);
    assert.equal(margin.headroom, 0.4);
    assert.equal(margin.measuredCount, 3);
    assert.deepEqual(margin.context, { widthPx: 60, heightPx: 24.4 });
  });

  await t.test('a small target passing on spacing is not a size candidate', async () => {
    const { outcome, margin } = await marginOf(
      '<button id="tiny" style="top:0;left:0;width:16px;height:16px">A</button>' +
        '<button id="big" style="top:200px;left:0;width:40px;height:40px">B</button>'
    );
    assert.equal(outcome, 'pass', 'the small one is far from the other');
    assert.equal(margin.selector, '#big');
    assert.equal(margin.measuredCount, 2);
    const onlySmall = await marginOf(
      '<button id="tiny" style="top:0;left:0;width:16px;height:16px">A</button>'
    );
    assert.equal(onlySmall.margin, undefined);
  });
});
