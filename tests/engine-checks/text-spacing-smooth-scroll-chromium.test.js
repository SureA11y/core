'use strict';

// text-spacing-content-loss, and evidenceState's release, put the scroll
// position back at once on a page that sets `scroll-behavior: smooth`
// (round 9, R9-3). The spacing makes this page shorter, so a page scrolled
// to its end is clamped while the spacing is on; a plain scrollTo(x, y)
// back is animated under smooth scrolling, and the scan returned with the
// page scrolled elsewhere.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { evidenceState } = require('../../src/index.js');

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

const paragraphs = Array.from({ length: 80 }, (_, i) => `<p>Paragraph ${i}.</p>`).join('');
const PAGE = `<!doctype html><html lang="en"><head><title>t</title><style>html { scroll-behavior: smooth } p { margin: 0 0 120px }</style></head><body><main><h1>Article</h1>${paragraphs}</main></body></html>`;

async function open(browser) {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.setContent(PAGE);
  await addBundle(page);
  await page.evaluate(() =>
    window.scrollTo({ top: document.scrollingElement.scrollHeight, behavior: 'instant' })
  );
  return page;
}

test(
  'text-spacing-content-loss puts the scroll position back at once under smooth scrolling',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const page = await open(browser);
    const r = await page.evaluate(() => {
      const before = window.scrollY;
      window.a11ycore.runa11yCoreInPage(null, null, {}, ['text-spacing-content-loss']);
      return { before, after: window.scrollY };
    });
    assert.ok(r.before > 1000, String(r.before));
    assert.equal(r.after, r.before);
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.scrollY), r.before);
  }
);

test(
  "evidenceState's release puts the scroll position back at once under smooth scrolling",
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const page = await open(browser);
    const before = await page.evaluate(() => window.scrollY);
    const applied = await page.evaluate(evidenceState, {
      op: 'apply',
      state: 'text-spacing',
      token: 's'
    });
    assert.equal(applied.applied, true);
    assert.ok((await page.evaluate(() => window.scrollY)) < before, 'the spacing clamps it');
    await page.evaluate(evidenceState, { op: 'release', token: 's' });
    assert.equal(await page.evaluate(() => window.scrollY), before);
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.scrollY), before);
  }
);
