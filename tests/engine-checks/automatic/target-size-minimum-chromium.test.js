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
const { addBundle } = require('../../helpers/browserBundle');
const { internalsHookScript } = require('../../../src/index.js');

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
      await addBundle(p);
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

  // An avatar group, as on ant.design: 24px links overlapping by 8px, each
  // painted over the one before it, with an avatar <span> and <img> inside.
  // What is painted over a target takes nothing from it (what covers a
  // target depends on the moment of the scan), so each link is measured
  // whole, 24×24, and passes.
  const AVATAR =
    '<a id="ID" href="/ID" style="display:inline-block;width:24px;height:24px;margin-left:GAP;vertical-align:top">' +
    '<span style="display:block;width:24px;height:24px;border-radius:50%;overflow:hidden">' +
    '<img alt="ID" style="display:block;width:22px;height:22px;margin:1px"></span></a>';
  const group = (gap) =>
    '<div style="position:absolute;top:10px;left:10px;font-size:0">' +
    ['a1', 'a2', 'a3', 'a4']
      .map((id, i) => AVATAR.replaceAll('ID', id).replace('GAP', i ? gap : '0'))
      .join('') +
    '</div>';

  await t.test('links in an overlapping avatar group are measured whole', async () => {
    assert.equal((await scan(group('-8px')))[0], 'pass');
  });

  await t.test('the same group spaced apart passes', async () => {
    assert.equal((await scan(group('4px')))[0], 'pass');
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
      await addBundle(p);
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

  await t.test('a smallest target more than 6px over 24 gives no margin', async () => {
    const { outcome, margin } = await marginOf(
      '<button id="big" style="top:0;left:0;width:48px;height:48px">A</button>' +
        '<button id="wide" style="top:100px;left:0;width:60px;height:31px">B</button>'
    );
    assert.equal(outcome, 'pass');
    assert.equal(margin, undefined, '31px is outside the band (up to 30px)');
  });

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
        '<button id="big" style="top:200px;left:0;width:28px;height:28px">B</button>'
    );
    assert.equal(outcome, 'pass', 'the small one is far from the other');
    assert.equal(margin.selector, '#big');
    assert.equal(margin.measuredCount, 2);
    const onlySmall = await marginOf(
      '<button id="tiny" style="top:0;left:0;width:16px;height:16px">A</button>'
    );
    assert.equal(onlySmall.margin, undefined);
  });

  // The fail names the ancestor that cuts the target down to the size
  // measured, and the CSS that does, in both rules.
  await t.test('a target an ancestor clips names that ancestor and its CSS', async () => {
    async function occurrences(ruleId, body) {
      const p = await browser.newPage({ viewport: { width: 390, height: 900 } });
      try {
        await p.setContent(
          `<!doctype html><html lang="en"><head><title>t</title><style>body{margin:0;font:16px sans-serif}</style></head><body>${body}</body></html>`
        );
        await addBundle(p);
        const result = await p.evaluate(
          ([id]) => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: id } }, null),
          [ruleId]
        );
        return result.checksResults.find((c) => c.ruleId === ruleId).occurrences;
      } finally {
        await p.close();
      }
    }
    const B = 'width:16px;height:40px;margin:0;padding:0;border:0';
    const [first] = await occurrences(
      RULE_ID,
      `<div class="toolbar" style="height:16px;overflow:hidden"><button style="${B}">A</button><button style="${B}">B</button></div>`
    );
    assert.equal(first.data.details.clippedBy, '<div class="toolbar">');
    assert.equal(first.data.details.clipProperty, 'overflow: hidden');
    assert.equal(first.i18n.params.neighbour, '<button> "B"');
    assert.match(
      first.summary,
      /^Target is 16×16 CSS px .* too close to another target \(<button> "B"\): 16 px where 24 px is needed\. Its ancestor <div class="toolbar"> cuts it to that size with overflow: hidden\.$/
    );
    const [inset] = await occurrences(
      RULE_ID,
      `<div class="cp" style="clip-path:inset(0 0 24px 0)"><button style="${B}">A</button><button style="${B}">B</button></div>`
    );
    assert.equal(inset.i18n.params.clippedBy, '<div class="cp">');
    assert.match(inset.i18n.params.clipProperty, /^clip-path: inset\(/);
    const [enhanced] = await occurrences(
      'target-size-enhanced',
      '<div class="toolbar" style="height:20px;overflow:hidden"><button style="width:40px;height:40px;margin:0;padding:0;border:0">T</button></div>'
    );
    assert.equal(
      enhanced.summary,
      'Target is 40×20 CSS px at a 390px-wide viewport, under 44×44. Its ancestor <div class="toolbar"> cuts it to that size with overflow: hidden.'
    );
    // Not clipped: nothing named.
    const [plain] = await occurrences(
      RULE_ID,
      '<button style="width:16px;height:16px;margin:0;padding:0;border:0">A</button><button style="width:16px;height:16px;margin:0;padding:0;border:0">B</button>'
    );
    assert.equal(plain.data.details.clippedBy, undefined);
    assert.doesNotMatch(plain.summary, /cuts it/);
  });

  // Seventh stress test (VL-1, VL-2, VL-7, VL-8 on audit/register).
  await t.test('small targets in shadow roots are measured against each other', async () => {
    const [outcome, findings] = await scan(
      '<x-tb id="h"></x-tb><script>customElements.define("x-tb", class extends HTMLElement { constructor() { super(); this.attachShadow({ mode: "open" }).innerHTML = "<style>button{width:16px;height:16px;padding:0;margin:0;border:0}</style><button>a</button><button>b</button><button>c</button>"; } });</script>'
    );
    assert.equal(outcome, 'fail');
    assert.ok(findings.length >= 2, JSON.stringify(findings));
  });

  await t.test('an overlay over both targets says nothing of how close they are', async () => {
    const toolbar =
      '<div style="position:absolute;top:40px;left:40px">' +
      [1, 2, 3, 4]
        .map(
          (i) =>
            `<button style="width:20px;height:20px;margin:0 2px 0 0;padding:0;border:0">${i}</button>`
        )
        .join('') +
      '</div>';
    const [outcome] = await scan(
      toolbar + '<div style="position:fixed;inset:0;background:rgba(0,0,0,.5)"></div>'
    );
    assert.equal(outcome, 'fail');
  });

  await t.test('a checkbox the author resized is not sized by the browser', async () => {
    const boxes = (css) =>
      [1, 2, 3].map(() => `<input type="checkbox" style="${css}margin:0 2px 0 0">`).join('');
    assert.equal((await scan(boxes('')))[0], 'pass');
    assert.equal((await scan(boxes('width:10px;height:10px;')))[0], 'fail');
  });

  // Both rules, on one page: the selectors of the targets each reports.
  async function reportedBy(ruleId, body) {
    const p = await browser.newPage({ viewport: { width: 390, height: 900 } });
    try {
      await p.setContent(
        `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`
      );
      await addBundle(p);
      return await p.evaluate((id) => {
        const r = window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: id } }, null);
        return r.checksResults.find((c) => c.ruleId === id).occurrences.map((o) => o.selector);
      }, ruleId);
    } finally {
      await p.close();
    }
  }

  // The user-agent exception covers every native control the browser draws
  // at its own size, not only checkboxes and radios (round 12, U12-8).
  await t.test('unstyled native controls are sized by the browser', async () => {
    const controls =
      '<input type="range" aria-label="a"><br><input type="range" aria-label="b"><br>' +
      '<select aria-label="c"><option>One</option></select><br>' +
      '<input type="file" aria-label="d"><br><input type="color" aria-label="e"><br>' +
      '<input aria-label="f"><br><input type="date" aria-label="g">';
    for (const id of ['target-size-minimum', 'target-size-enhanced']) {
      assert.deepEqual(await reportedBy(id, controls), [], id);
    }
    // Resized by the author: a range made narrow, a select given the page's
    // font, a button, whose size follows its text.
    const styled =
      '<input type="range" aria-label="a" style="width:60px"><br>' +
      '<select aria-label="c" style="font:inherit;font-size:16px"><option>One</option></select><br>' +
      '<button>Go</button>';
    assert.deepEqual(await reportedBy('target-size-enhanced', styled), [
      'input[aria-label="a"]',
      'select[aria-label="c"]',
      'html > body > button'
    ]);
  });

  // A size the author set, within what a browser draws: the exception needs
  // a size the author has not modified (round 12, R12F-11).
  await t.test('text inputs the author sized are judged as targets', async () => {
    const inputs = (css) =>
      `<input aria-label="a" style="${css}"><br><input aria-label="b" style="${css}">`;
    assert.equal((await scan(inputs('')))[0], 'pass');
    const [outcome] = await scan(inputs('box-sizing:border-box;height:20px'));
    assert.equal(outcome, 'fail');
  });

  // CSS zoom is the author's change of size, as a transform is, on the
  // control or an ancestor (round 12, U12-9).
  await t.test('a checkbox shrunk by zoom is not sized by the browser', async () => {
    const boxes = (css) =>
      [1, 2]
        .map((i) => `<input type="checkbox" aria-label="${i}" style="${css}margin:0">`)
        .join('');
    assert.equal((await scan(boxes('')))[0], 'pass');
    assert.equal((await scan(boxes('transform:scale(.7);')))[0], 'fail');
    assert.equal((await scan(boxes('zoom:0.7;')))[0], 'fail');
    assert.equal((await scan(`<div style="zoom:0.7">${boxes('')}</div>`))[0], 'fail');
  });

  await t.test('the hint asks for the larger of the two distances the spacing needs', async () => {
    const p = await browser.newPage({ viewport: { width: 390, height: 900 } });
    try {
      await p.setContent(
        '<!doctype html><html lang="en"><head><title>t</title></head><body>' +
          '<button id="a" style="position:absolute;left:0;top:0;width:16px;height:16px;padding:0;border:0">a</button>' +
          '<button style="position:absolute;left:18px;top:0;width:26px;height:16px;padding:0;border:0">Edit</button>' +
          '</body></html>'
      );
      await addBundle(p);
      const hint = await p.evaluate(() => {
        const r = window.a11ycore.runa11yCoreInPage(
          null,
          null,
          { rules: { include: 'target-size-minimum' } },
          null
        );
        const c = r.checksResults.find((x) => x.ruleId === 'target-size-minimum');
        return c.occurrences.find((o) => o.selector === '#a').i18n.params.shortfallPx;
      });
      // Centres 23px apart need 1px more, but the other's region is 10px from
      // this centre, which needs 2px: moving 1px would still fail.
      assert.equal(hint, '2');
    } finally {
      await p.close();
    }
  });
  // Speed: a point outside the viewport hits nothing, so on a long page the
  // neighbours below the fold are not hit-tested 25 times each.
  await t.test('targets below the fold cost no hit tests of their own', async () => {
    const p = await browser.newPage({ viewport: { width: 800, height: 600 } });
    try {
      let links = '';
      for (let i = 0; i < 600; i++) links += `<a href="/l${i}">Read more</a> `;
      await p.setContent(
        `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>h</h1><p>${links}</p></main></body></html>`
      );
      await addBundle(p);
      const got = await p.evaluate(() => {
        let calls = 0;
        const original = Document.prototype.elementFromPoint;
        Document.prototype.elementFromPoint = function (...args) {
          calls++;
          return original.apply(this, args);
        };
        try {
          const r = window.a11ycore.runa11yCoreInPage(null, null, {}, ['target-size-minimum']);
          return { calls, findings: r.checksResults[0].occurrences.length };
        } finally {
          Document.prototype.elementFromPoint = original;
        }
      });
      assert.equal(got.findings, 600);
      // About 17 per target before; now those in view only.
      assert.ok(got.calls < 2 * got.findings, `${got.calls} hit tests`);
    } finally {
      await p.close();
    }
  });
  // Round 8, NW-1: the hit test drills into shadow roots, and a neighbour
  // whose face is drawn in a component's shadow root was read as covered.
  await t.test('a plain target beside one drawn in a component still fails', async () => {
    const icon =
      '<svg viewBox="0 0 16 16" width="16" height="16" style="display:block"><rect width="16" height="16"/></svg>';
    const button = (label, face) =>
      `<button aria-label="${label}" style="all:unset;display:inline-block;width:16px;height:16px">${face}</button>`;
    const [outcome, findings] = await scan(
      `<script>customElements.define('x-icon', class extends HTMLElement { constructor() { super(); this.attachShadow({ mode: 'open' }).innerHTML = '${icon}'; } });</script>` +
        `<div style="display:flex;gap:2px;margin:20px">${button('a', icon)}${button('b', '<x-icon></x-icon>')}${button('c', icon)}</div>`
    );
    assert.equal(outcome, 'fail');
    assert.equal(findings.length, 3, JSON.stringify(findings));
  });
  // Round 8, LY-6: a tab, a switch or another widget is a target, its role
  // given by an attribute or by a custom element's ElementInternals.
  await t.test('controls with an interactive widget role are targets', async () => {
    const box = 'display:inline-block;width:16px;height:16px;margin-right:2px';
    const [byAttribute, attributeFindings] = await scan(
      `<div role="tablist"><span role="tab" tabindex="0" style="${box}">A</span><span role="tab" tabindex="-1" style="${box}">B</span></div>` +
        `<div style="margin-top:40px"><span role="switch" tabindex="0" style="${box}"></span><span role="switch" tabindex="0" style="${box}"></span></div>`
    );
    assert.equal(byAttribute, 'fail');
    assert.equal(attributeFindings.length, 4, JSON.stringify(attributeFindings));
    // The internals hook, installed before the page's scripts, reads the role.
    const p = await browser.newPage({ viewport: { width: 390, height: 900 } });
    try {
      await p.addInitScript({ content: internalsHookScript() });
      const html =
        `<!doctype html><html lang="en"><head><title>t</title></head><body>` +
        `<script>customElements.define('x-tab', class extends HTMLElement { constructor() { super(); this.attachInternals().role = 'tab'; } });</script>` +
        `<x-tab tabindex="0" style="${box}">A</x-tab><x-tab tabindex="-1" style="${box}">B</x-tab></body></html>`;
      // Served from an origin, so the init script runs as on a real site.
      await p.route('https://example.test/**', (route) =>
        route.fulfill({ contentType: 'text/html', body: html })
      );
      await p.goto('https://example.test/');
      await addBundle(p);
      const r = await p.evaluate(
        (id) =>
          window.a11ycore
            .runa11yCoreInPage(null, null, { rules: { include: id } }, null)
            .checksResults.find((c) => c.ruleId === id),
        RULE_ID
      );
      assert.equal(r.outcome, 'fail');
      assert.equal(r.occurrences.length, 2);
    } finally {
      await p.close();
    }
  });
});
