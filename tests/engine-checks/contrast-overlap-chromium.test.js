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
  'a block it is pulled over': `<div style="background:#000;height:80px"></div><p style="margin-top:-50px;color:#ddd">${TEXT}</p>`
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
  'an underline scaled to nothing': `<style>.u{position:relative}.u::after{content:"";position:absolute;left:0;top:0;width:100%;height:100%;background:#000;transform:scaleX(0)}</style><p class="u" style="color:#ddd">${TEXT}</p>`
};

test('contrast over paint that is not an ancestor background, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(body) {
    const p = await browser.newPage();
    try {
      await p.setContent(
        '<!doctype html><html lang="en"><head><title>t</title><style>html{background:#fff}</style></head>' +
          `<body><main>${body}</main></body></html>`
      );
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
  }
});
