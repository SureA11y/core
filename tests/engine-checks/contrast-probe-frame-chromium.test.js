'use strict';

// The contrast rules read the browser's own placeholder and select colors
// in a blank frame. It is made once a scan, kept in a closed shadow root,
// so its load event never reaches the page's listeners, and taken out when
// the scan ends: before, each use added and removed a frame of its own,
// and a page's capturing load listener ran inside the scan for each
// (round 9, R9-9).
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

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title>' +
  '<script>window.__loads = 0; window.__added = [];' +
  "addEventListener('load', () => window.__loads++, true);" +
  "document.addEventListener('load', () => window.__loads++, true);" +
  'new MutationObserver((records) => { for (const r of records) for (const n of r.addedNodes) window.__added.push(n.nodeName); })' +
  '.observe(document, { childList: true, subtree: true });</script></head><body><main><h1>x</h1>' +
  '<label>Name <input placeholder="Your name"></label>' +
  '<label>Mail <input type="email" placeholder="you@example.test"></label>' +
  '<label>Note <textarea placeholder="A note"></textarea></label>' +
  '<label>Pick <select><option>a</option></select></label>' +
  '<div style="color-scheme: dark"><label>Dark <input placeholder="Dark"></label>' +
  '<label>Dark pick <select><option>b</option></select></label></div>' +
  '</main></body></html>';

test(
  'the contrast rules read the browser colors in one frame a scan, unseen by load listeners',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const p = await browser.newPage();
    await p.setContent(PAGE);
    await addBundle(p);
    const scan = () =>
      p.evaluate(() => {
        window.__loads = 0;
        window.__added = [];
        const result = window.a11ycore.runa11yCoreInPage(null, null, null, [
          'contrast-minimum',
          'contrast-computable'
        ]);
        return {
          loads: window.__loads,
          outcomes: result.checksResults.map((c) => [c.ruleId, c.outcome, c.occurrences.length]),
          left: document.querySelectorAll('iframe, surea11y-probe').length
        };
      });
    const first = await scan();
    assert.equal(first.loads, 0);
    assert.equal(first.left, 0);
    // The frame's holder, added once and taken out, is all a MutationObserver
    // sees of it.
    await p.evaluate(() => new Promise((r) => setTimeout(r, 0)));
    assert.deepEqual(
      (await p.evaluate(() => window.__added)).filter(
        (n) => n === 'IFRAME' || n === 'SUREA11Y-PROBE'
      ),
      ['SUREA11Y-PROBE']
    );
    // A second scan reads the same.
    const second = await scan();
    assert.deepEqual(second.outcomes, first.outcomes);
  }
);
