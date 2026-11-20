'use strict';

/**
 * The native controls the engine models, checked against what Chromium
 * paints, so a browser that changes how it draws them fails here rather
 * than turning into wrong verdicts (round 5's suggestion after VI-1):
 *
 * - an unstyled drop-down <select> is painted in the Field system color,
 *   not its computed background (ButtonFace), and one the page gives a
 *   background is painted in that (contrast-helpers.js nativeSelectField);
 * - a text field, a text area and a button are painted in their computed
 *   background, which the contrast rules measure their text against;
 * - a checkbox and a radio are drawn 12 to 16 CSS px square, which
 *   target-size-minimum takes as the browser's own size.
 *
 * Each in light and dark color schemes. Pixels are read from a screenshot
 * at a point inside the control's padding, away from its text and border.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium, executablePath, skip } = require('../helpers/chromium');

const PAGE = (scheme) => `<!doctype html><html lang="en"><head><title>Controls</title>
<meta name="color-scheme" content="${scheme}"><style>
  body { margin: 20px; font: 16px Arial; }
  .c { display: block; margin: 0 0 20px; width: 200px; height: 40px; padding: 0 12px; }
  #swatch { width: 20px; height: 20px; background: Field; }
</style></head><body>
<select id="select" class="c"><option>One</option></select>
<select id="select-bg" class="c" style="background-color:#ffd700"><option>One</option></select>
<input id="text" class="c" type="text">
<textarea id="area" class="c"></textarea>
<button id="button" class="c"></button>
<input id="check" type="checkbox"> <input id="radio" type="radio">
<div id="swatch"></div>
</body></html>`;

// The computed background, and the painted pixel near the control's right
// end, inside its padding and clear of the text and the drop-down arrow.
async function read(page, id, dx = 0.55) {
  const box = await page.evaluate((i) => {
    const el = document.getElementById(i);
    const r = el.getBoundingClientRect();
    return {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      background: getComputedStyle(el).backgroundColor
    };
  }, id);
  const x = Math.round(box.x + box.width * dx);
  const y = Math.round(box.y + box.height / 2);
  const png = await page.screenshot({ clip: { x, y, width: 1, height: 1 } });
  const pixel = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
  }, png.toString('base64'));
  return { ...box, pixel };
}

const rgb = (css) => (String(css).match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 2);

test('native controls are painted as the engine models them, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  for (const scheme of ['light', 'dark']) {
    await t.test(scheme, async () => {
      const page = await browser.newPage({ colorScheme: scheme, deviceScaleFactor: 1 });
      try {
        await page.setContent(PAGE(scheme));
        const field = rgb((await read(page, 'swatch', 0.5)).background);

        const select = await read(page, 'select');
        assert.ok(near(select.pixel, field), `select: painted ${select.pixel}, Field ${field}`);
        assert.ok(
          !near(rgb(select.background), field),
          `select: its computed background ${select.background} is not the Field color, so the engine needs nativeSelectField`
        );

        const styled = await read(page, 'select-bg');
        assert.ok(
          near(styled.pixel, rgb(styled.background)),
          `select with a background: painted ${styled.pixel}, computed ${styled.background}`
        );

        for (const id of ['text', 'area', 'button']) {
          const c = await read(page, id);
          assert.ok(
            near(c.pixel, rgb(c.background)),
            `${id}: painted ${c.pixel}, computed ${c.background}`
          );
        }

        for (const id of ['check', 'radio']) {
          const c = await read(page, id, 0.5);
          for (const side of [c.width, c.height]) {
            assert.ok(side >= 12 && side <= 16, `${id}: drawn ${c.width} by ${c.height}`);
          }
        }
      } finally {
        await page.close();
      }
    });
  }
});
