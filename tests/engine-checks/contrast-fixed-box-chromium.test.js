'use strict';

/**
 * Text in a box that stays in place as the page scrolls (position: fixed)
 * or sticks while it scrolls (sticky), with no opaque background between
 * the text and that box, has under it whatever the page scrolls past, so
 * contrast-computable asks about it (BACKGROUND_OVERLAP, blockerProperty
 * position) at any scroll position, and the verdict is the same scrolled or
 * not (round 9, V9-3). This needs a layout, so it runs in Chromium.
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

const PAGE = (header) =>
  `<!doctype html><html lang="en"><head><title>t</title><style>body{margin:0;background:#fff;font:16px Arial}</style></head><body>${header}<div style="height:400px;background:#123"></div><div style="height:2000px">content</div></body></html>`;
const TEXT = '<p id="t" style="margin:0;padding:15px;color:#f5f5f5">Brand navigation</p>';

// [name, header, expected for #t: 'asked' or the contrast-minimum outcome]
const CASES = [
  [
    'a transparent fixed header',
    `<header style="position:fixed;top:0;left:0;right:0;height:50px">${TEXT}</header>`,
    'asked'
  ],
  [
    'a translucent fixed header',
    `<header style="position:fixed;top:0;left:0;right:0;height:50px;background:rgba(0,0,0,.5)">${TEXT}</header>`,
    'asked'
  ],
  [
    'a transparent sticky header',
    `<header style="position:sticky;top:0;height:50px">${TEXT}</header>`,
    'asked'
  ],
  // An opaque background between the text and the fixed box decides it.
  [
    'a fixed header with an opaque background',
    `<header style="position:fixed;top:0;left:0;right:0;height:50px;background:#123">${TEXT}</header>`,
    'measured'
  ],
  [
    'text with an opaque background of its own in a fixed header',
    `<header style="position:fixed;top:0;left:0;right:0;height:50px"><p id="t" style="margin:0;padding:15px;color:#f5f5f5;background:#123">Brand navigation</p></header>`,
    'measured'
  ],
  // A fixed box in a transformed ancestor scrolls with it.
  [
    'a fixed box inside a transformed ancestor',
    `<div style="transform:translateZ(0);background:#123"><header style="position:fixed;top:0;left:0;right:0;height:50px">${TEXT}</header></div>`,
    'measured'
  ]
];

test(
  'text in a fixed or sticky box with no opaque background, in Chromium (round 9, V9-3)',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    for (const [name, header, expected] of CASES) {
      await t.test(name, async () => {
        const verdicts = [];
        for (const y of [0, 800]) {
          const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
          try {
            await page.setContent(PAGE(header));
            await page.evaluate((top) => window.scrollTo(0, top), y);
            await addBundle(page);
            verdicts.push(
              await page.evaluate(() => {
                const res = window.a11ycore.runa11yCoreInPage(null, null, {}, [
                  'contrast-computable',
                  'contrast-minimum'
                ]);
                const occ = (id) =>
                  res.checksResults
                    .find((c) => c.ruleId === id)
                    .occurrences.filter((o) => o.selector === '#t')
                    .map((o) => ({
                      code: o.data.details.reasonCode,
                      property: o.data.details.blockerProperty || null,
                      key: o.i18n && o.i18n.summaryKey
                    }));
                return { computable: occ('contrast-computable'), minimum: occ('contrast-minimum') };
              })
            );
          } finally {
            await page.close();
          }
        }
        // The same verdict scrolled or not.
        assert.deepEqual(verdicts[1], verdicts[0]);
        const [v] = verdicts;
        if (expected === 'asked') {
          assert.deepEqual(v.computable, [
            {
              code: 'BACKGROUND_OVERLAP',
              property: 'position',
              key: 'contrastComputable_cantTell_fixedBox'
            }
          ]);
          assert.deepEqual(v.minimum, []);
        } else {
          assert.deepEqual(v.computable, []);
        }
      });
    }
  }
);
