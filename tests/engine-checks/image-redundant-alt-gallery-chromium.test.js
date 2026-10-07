'use strict';

/**
 * image-redundant-alt reads the text beside a parent's images once per
 * parent (#124): an <img> holds no text, so the text an image's alt is
 * compared with is the same for every image in the parent. A gallery of N
 * images used to read its siblings' text N times. In Chromium, the reads of
 * a sibling's textContent are counted, and the outcome is checked.
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

test(
  'image-redundant-alt reads a parent text once for all its images, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const page = await browser.newPage();
    t.after(() => page.close());

    await page.setContent(
      `<!doctype html><html lang="en"><head><title>Gallery</title></head><body><main><div><span id="s">photo</span>${'<img alt="photo" src="data:,">'.repeat(500)}</div></main></body></html>`
    );
    await page.evaluate(() => {
      const span = document.getElementById('s');
      const original = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
      window.__reads = 0;
      Object.defineProperty(Node.prototype, 'textContent', {
        configurable: true,
        get() {
          if (this === span) window.__reads += 1;
          return original.get.call(this);
        },
        set: original.set
      });
    });
    await page.evaluate(BUNDLE);
    const r = await page.evaluate(() => {
      const res = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
        'image-redundant-alt'
      ]);
      return { reads: window.__reads, check: res.checksResults[0] };
    });
    assert.ok(r.reads <= 2, `read ${r.reads} times`);
    assert.equal(r.check.outcome, 'cantTell');
    assert.equal(r.check.occurrences.length, 500);
  }
);
