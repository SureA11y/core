'use strict';

/**
 * target-size-minimum spaces a target only against the targets that move
 * with it as the page scrolls: a fixed target against fixed ones, a sticky
 * one against those in its box, the page's against the page's. A fixed or
 * sticky target over a page whose small targets pass within its reach as it
 * scrolls is asked about (undersized-pinned-over-page), so the verdict is
 * the same at any scroll position (round 9, R9-8). One within reach only
 * while it passes under the pinned box's background is hidden, not too
 * close (round 12, U12-10). This needs a layout, so
 * it runs in Chromium.
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

const STYLE = `<style>
  body { margin: 0; }
  .fixed { position: fixed; width: 20px; height: 20px; padding: 0; border: 0; font-size: 10px; }
  .row { display: flex; gap: 8px; margin: 0; }
  .row a { display: inline-block; width: 20px; height: 20px; font-size: 10px; }
</style>`;
const LONG = (end, fixed) =>
  `<!doctype html><html lang="en"><head><title>t</title>${STYLE}</head><body><main>` +
  `${'<p style="height:400px">Section</p>'.repeat(20)}${end}<p style="height:16px"></p></main>${fixed}</body></html>`;
const RIGHT_LINKS =
  '<div class="row" style="justify-content:flex-end;padding-right:22px"><a href="#a">1</a><a href="#b">2</a><a href="#c">3</a><a href="#d">4</a></div>';
const SPREAD_LINKS =
  '<div class="row" style="justify-content:flex-end;gap:40px;padding-right:300px"><a href="#a">1</a><a href="#b">2</a></div>';
const TOP =
  '<button class="fixed" id="top" style="right:16px;bottom:40px" aria-label="Back to top">^</button>';

const STICKY = (css) =>
  `<!doctype html><html lang="en"><head><title>t</title>${STYLE}</head><body>` +
  `<header style="position:sticky;top:0;height:64px;display:flex;align-items:center;${css}"><a id="icon" href="#s" style="display:inline-block;width:16px;height:16px">s</a></header>` +
  `<main>${'<p style="margin:0"><a href="#x" style="display:inline-block;width:16px;height:16px">x</a></p><p style="height:200px"></p>'.repeat(20)}</main></body></html>`;

// [name, page, expected occurrences as selector: reason code]
const CASES = [
  [
    'a small fixed button the page’s small links scroll under',
    LONG(RIGHT_LINKS, TOP),
    { '#top': 'undersized-pinned-over-page' }
  ],
  ['a small fixed button no small link of the page passes', LONG(SPREAD_LINKS, TOP), {}],
  [
    'two small fixed buttons side by side are spaced against each other',
    LONG(
      SPREAD_LINKS,
      '<button class="fixed" id="f1" style="left:8px;top:8px">a</button><button class="fixed" id="f2" style="left:28px;top:8px">b</button>'
    ),
    { '#f1': 'undersized-and-too-close', '#f2': 'undersized-and-too-close' }
  ],
  // A page target within reach of a header icon only while it passes under
  // the header's background is hidden there, not too close (round 12,
  // U12-10). A header that paints no background shows it.
  [
    'a small icon in a sticky header whose background hides the page links within reach',
    STICKY('background:#fff'),
    {}
  ],
  [
    'a small icon in a transparent sticky header the page links pass within reach of',
    STICKY(''),
    { '#icon': 'undersized-pinned-over-page' }
  ],
  [
    'a small icon in a sticky header too short to hide the page links within reach',
    STICKY('background:#fff;height:20px'),
    { '#icon': 'undersized-pinned-over-page' }
  ]
];

test(
  'target-size-minimum with fixed targets, at any scroll position, in Chromium (round 9, R9-8)',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const scan = async (html, where) => {
      const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
      try {
        await page.setContent(html);
        if (where === 'bottom')
          await page.evaluate(() => window.scrollTo(0, document.scrollingElement.scrollHeight));
        await addBundle(page);
        return await page.evaluate(() => {
          const r = window.a11ycore.runa11yCoreInPage(null, null, {}, ['target-size-minimum'])
            .checksResults[0];
          return Object.fromEntries(
            r.occurrences.map((o) => [o.selector, o.data.details.reasonCode])
          );
        });
      } finally {
        await page.close();
      }
    };
    for (const [name, html, expected] of CASES) {
      await t.test(name, async () => {
        const top = await scan(html, 'top');
        const bottom = await scan(html, 'bottom');
        assert.deepEqual(top, expected);
        assert.deepEqual(bottom, expected);
      });
    }
    // Where the page doesn't scroll, nothing moves: a fixed button is spaced
    // against the page's targets as before.
    await t.test('a page that does not scroll', async () => {
      const html = `<!doctype html><html lang="en"><head><title>t</title>${STYLE}</head><body><main><div class="row" style="position:absolute;left:8px;top:8px"><a href="#a">1</a></div></main><button class="fixed" id="f" style="left:30px;top:8px">b</button></body></html>`;
      assert.deepEqual(await scan(html, 'top'), {
        'html > body > main > div > a': 'undersized-and-too-close',
        '#f': 'undersized-and-too-close'
      });
    });
  }
);
