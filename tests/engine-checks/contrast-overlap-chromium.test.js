'use strict';

/**
 * Text over paint that is not an ancestor's background, in a real browser.
 * The contrast rules measure against the stack of ancestor backgrounds, so
 * light text over a dark sibling, an <img> hero, a ::before overlay or a
 * block it is pulled over failed with high confidence against the white
 * page. Such text is now not computable (BACKGROUND_OVERLAP), while text
 * whose ancestors do give its background is judged as before.
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

const TEXT = 'Hello world text';
const BLACK =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><rect width='10' height='10'/></svg>";

// Light text that sits on something dark the ancestors don't paint.
const OVERLAPS = {
  'an absolutely positioned sibling': `<div style="position:relative;height:100px"><div style="position:absolute;inset:0;background:#000"></div><p style="position:absolute;top:0;margin:0;color:#ddd">${TEXT}</p></div>`,
  'an <img> hero': `<div style="position:relative;height:200px"><img src="${BLACK}" alt="" style="position:absolute;inset:0;width:100%;height:100%"><h2 style="position:relative;margin:0;color:#ddd">${TEXT}</h2></div>`,
  'a ::before overlay': `<style>.h{position:relative;z-index:0}.h::before{content:"";position:absolute;inset:0;background:#000;z-index:-1}</style><div class="h"><p style="margin:0;color:#ddd">${TEXT}</p></div>`,
  'a block it is pulled over': `<div style="background:#000;height:80px"></div><p style="margin-top:-50px;color:#ddd">${TEXT}</p>`,
  'the menu of an open <details>': `<details open style="position:relative"><summary></summary><div style="position:absolute;top:100%;left:0;width:300px;height:200px;background:#000"></div></details><p style="color:#ddd">${TEXT}</p>`
};

// Light text on the white page, with paint near it that is not under it,
// or is under an opaque ancestor background: a plain fail, as before.
const NO_OVERLAP = {
  'a card over a hero image': `<div style="position:relative;height:300px"><img src="${BLACK}" alt="" style="position:absolute;inset:0;width:100%;height:100%"><div style="position:relative;background:#fff;padding:20px"><p style="color:#ddd">${TEXT}</p></div></div>`,
  'a float the text wraps around': `<img src="${BLACK}" alt="" style="float:left;width:100px;height:100px"><p style="color:#ddd">${TEXT} ${TEXT} ${TEXT} ${TEXT}</p>`,
  'an inline icon': `<p style="color:#ddd">${TEXT} <img src="${BLACK}" alt="" width="16" height="16"> more</p>`,
  'a heading with a tight line-height above a dark block': `<h1 style="line-height:0.8;margin:0;color:#ddd">Big heading text</h1><div style="background:#000;height:40px"></div>`,
  'a fixed banner over it': `<p style="color:#ddd">${TEXT}</p><div style="position:fixed;top:0;left:0;right:0;height:200px;background:#000"></div>`,
  'a white fade-out over white': `<style>.f{position:relative}.f::after{content:"";position:absolute;right:0;top:0;width:60px;height:100%;background:#fff}</style><p class="f" style="color:#ddd">${TEXT}</p>`,
  'an underline scaled to nothing': `<style>.u{position:relative}.u::after{content:"";position:absolute;left:0;top:0;width:100%;height:100%;background:#000;transform:scaleX(0)}</style><p class="u" style="color:#ddd">${TEXT}</p>`,
  // Collapsed content keeps a layout box in Chromium but is not painted.
  'the menu of a closed <details>': `<details style="position:relative"><summary>Menu</summary><div style="position:absolute;top:0;left:0;width:300px;height:200px;background:#000"></div></details><p style="color:#ddd">${TEXT}</p>`,
  'a panel under content-visibility: hidden': `<div style="position:relative;content-visibility:hidden;height:0"><div style="position:absolute;top:0;left:0;width:300px;height:200px;background:#000"></div></div><p style="color:#ddd">${TEXT}</p>`,
  'a hidden="until-found" panel': `<div hidden="until-found" style="position:relative;height:0"><div style="position:absolute;top:0;left:0;width:300px;height:200px;background:#000"></div></div><p style="color:#ddd">${TEXT}</p>`,
  'a shadow root in a closed <details>': `<details style="position:relative"><summary>Menu</summary><x-m></x-m></details><p style="color:#ddd">${TEXT}</p><script>document.querySelector('x-m').attachShadow({ mode: 'open' }).innerHTML = '<div style="position:absolute;top:0;left:0;width:300px;height:200px;background:#000"></div>';</script>`,
  'a second <summary> of a closed <details>': `<details style="position:relative"><summary>Menu</summary><summary style="display:block;position:absolute;top:0;left:0;width:300px;height:200px;background:#000"></summary></details><p style="color:#ddd">${TEXT}</p>`
};

test('contrast over paint that is not an ancestor background, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  // withoutCheckVisibility: as in a browser that lacks
  // Element.prototype.checkVisibility(), where collapsed content is looked
  // for along the ancestors instead.
  async function scan(body, { withoutCheckVisibility = false } = {}) {
    const p = await browser.newPage();
    try {
      await p.setContent(
        '<!doctype html><html lang="en"><head><title>t</title><style>html{background:#fff}</style></head>' +
          `<body><main>${body}</main></body></html>`
      );
      if (withoutCheckVisibility) await p.evaluate(() => delete Element.prototype.checkVisibility);
      await p.addScriptTag({ content: BUNDLE });
      return await p.evaluate(() => {
        const r = window.a11ycore.runa11yCoreInPage(null, null, {}, [
          'contrast-minimum',
          'contrast-computable'
        ]);
        const get = (id) => r.checksResults.find((c) => c.ruleId === id);
        const reasons = (c) =>
          c.occurrences.map((o) => o.data && o.data.details && o.data.details.reasonCode);
        return {
          minimum: get('contrast-minimum').outcome,
          computable: get('contrast-computable').outcome,
          reasons: reasons(get('contrast-computable')),
          property: (get('contrast-computable').occurrences[0] || { data: { details: {} } }).data
            .details.blockerProperty
        };
      });
    } finally {
      await p.close();
    }
  }

  for (const [name, body] of Object.entries(OVERLAPS)) {
    await t.test(`text over ${name} is not computable, not failed`, async () => {
      const r = await scan(body);
      assert.equal(r.minimum, 'notApplicable', name);
      assert.equal(r.computable, 'cantTell', name);
      assert.deepEqual(r.reasons, ['BACKGROUND_OVERLAP'], name);
      assert.ok(r.property, 'names what paints there');
    });
  }

  for (const [name, body] of Object.entries(NO_OVERLAP)) {
    await t.test(`text beside ${name} is still judged`, async () => {
      const r = await scan(body);
      assert.equal(r.minimum, 'fail', name);
      assert.equal(r.computable, 'pass', name);
    });
    await t.test(`text beside ${name} is still judged without checkVisibility()`, async () => {
      const r = await scan(body, { withoutCheckVisibility: true });
      assert.equal(r.minimum, 'fail', name);
      assert.equal(r.computable, 'pass', name);
    });
  }
});

test(
  'contrast in Chromium: text no scrolling reaches is not judged under styleAndGeometry',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    async function outcome(body) {
      const p = await browser.newPage();
      try {
        await p.setContent(
          '<!doctype html><html lang="en"><head><title>t</title><style>html{background:#fff}</style></head>' +
            `<body><main><h1>Title</h1>${body}</main></body></html>`
        );
        await p.addScriptTag({ content: BUNDLE });
        return await p.evaluate(
          () =>
            window.a11ycore.runa11yCoreInPage(null, null, { visibilityMode: 'styleAndGeometry' }, [
              'contrast-minimum'
            ]).checksResults[0].outcome
        );
      } finally {
        await p.close();
      }
    }
    // Off screen (the left: -9999px technique), and clipped to nothing.
    assert.equal(
      await outcome('<p style="position:absolute;left:-9999px;color:#ccc">Off</p>'),
      'pass'
    );
    assert.equal(
      await outcome(
        '<div style="height:0;overflow:hidden"><p style="color:#ccc">Clipped</p></div>'
      ),
      'pass'
    );
    // A box that scrolls lets a reader reach its text, so it still counts.
    assert.equal(
      await outcome(
        '<div style="height:40px;overflow:auto"><p style="margin-top:200px;color:#ccc">Scroll</p></div>'
      ),
      'fail'
    );
  }
);

test('contrast in Chromium: SVG text is judged by its fill, not its color', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  async function scan(attrs, style) {
    const p = await browser.newPage();
    try {
      await p.setContent(
        '<!doctype html><html lang="en"><head><title>t</title><style>html{background:#fff}</style></head>' +
          '<body><main><h1>T</h1><svg width="300" height="40" role="img" aria-label="Chart">' +
          `<text x="5" y="25" font-size="16" ${attrs} style="${style}">Chart label text</text></svg></main></body></html>`
      );
      await p.addScriptTag({ content: BUNDLE });
      return await p.evaluate(() => {
        const r = window.a11ycore.runa11yCoreInPage(null, null, {}, [
          'contrast-minimum',
          'contrast-computable'
        ]);
        return r.checksResults.map((c) => c.ruleId + ':' + c.outcome).sort();
      });
    } finally {
      await p.close();
    }
  }
  // color only feeds currentColor: a black fill on a light color is black.
  assert.deepEqual(await scan('fill="#000"', 'color:#eee'), [
    'contrast-computable:pass',
    'contrast-minimum:pass'
  ]);
  assert.deepEqual(await scan('fill="#eee"', 'color:#000'), [
    'contrast-computable:pass',
    'contrast-minimum:fail'
  ]);
  assert.deepEqual(await scan('', 'fill:#eee;color:#000'), [
    'contrast-computable:pass',
    'contrast-minimum:fail'
  ]);
  // Outline-only text has no fill to measure.
  assert.deepEqual(await scan('fill="none" stroke="#000"', ''), [
    'contrast-computable:cantTell',
    'contrast-minimum:pass'
  ]);
});
