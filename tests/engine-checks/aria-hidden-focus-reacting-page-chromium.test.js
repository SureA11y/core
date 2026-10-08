'use strict';

// aria-hidden-focus on a page that reacts to focus (#168): it focuses an
// element in each aria-hidden subtree, and a carousel's focusin handler
// moves aria-hidden to the focused slide. The findings, markup included,
// are those of the page as found, and focus is not left in a hidden slide.

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
const PAGE = `<!doctype html><html lang="en"><head><title>t</title></head><body><main>
<div id="car">
  <div class="slide" id="s1"><a href="/1">One</a></div>
  <div class="slide" id="s2" aria-hidden="true"><a href="/2">Two</a></div>
  <div class="slide" id="s3" aria-hidden="true"><a href="/3">Three</a></div>
</div>
<script>
document.getElementById('car').addEventListener('focusin', (e) => {
  const slide = e.target.closest('.slide');
  for (const s of document.querySelectorAll('.slide')) {
    if (s === slide) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
  }
});
</script></main></body></html>`;

test('aria-hidden-focus reports a reacting page as it was found', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent(PAGE);
  await page.addScriptTag({ content: BUNDLE });
  const got = await page.evaluate(() => {
    const r = window.a11ycore.runa11yCoreInPage(null, null, null, ['aria-hidden-focus'])
      .checksResults[0];
    return {
      outcome: r.outcome,
      found: r.occurrences.map((o) => [o.selector, o.html.includes('aria-hidden="true"')]),
      active: document.activeElement === document.body
    };
  });
  assert.deepEqual(got, {
    outcome: 'fail',
    // The slides hidden when the scan began, each with the attribute it had.
    found: [
      ['#s2', true],
      ['#s3', true]
    ],
    // Focus is back where it was, not on a link in a hidden slide.
    active: true
  });
});
