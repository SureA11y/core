'use strict';

/**
 * label-in-name reads the label as the screen shows it: flex items drawn
 * side by side with no space between them ("sure" and "a11y" touching) read
 * as one word, "surea11y", though the box break splits the visible text
 * the way innerText does. A gap, a margin or padding between the boxes, or
 * boxes on separate lines, keep the words apart, and a label the name leaves
 * out still fails.
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

const CSS =
  '.tag{display:inline-flex} .word{display:flex} .gap{display:flex;gap:4px}' +
  ' .margin{display:flex} .margin>span+span{margin-left:4px}' +
  ' .padding{display:flex} .padding>span{padding:0 3px} .rtl{display:flex;direction:rtl}';

// [the control, the rule's outcome]
const CASES = [
  // The reported page: flex items touching, then " core" after a no-break space.
  [
    '<a href="/" class="tag" aria-label="surea11y core"><span class="word"><span>sure</span><span>a11y</span></span><span>&nbsp;core</span></a>',
    'pass'
  ],
  ['<a href="/" aria-label="surea11y core"><span>sure</span><span>a11y</span> core</a>', 'pass'],
  [
    '<a href="/" class="word" aria-label="surea11y">\n  <span>sure</span>\n  <span>a11y</span>\n</a>',
    'pass'
  ],
  ['<a href="/" class="rtl" aria-label="שלוםעולם"><span>שלום</span><span>עולם</span></a>', 'pass'],
  // The box break still splits the words where the name has them apart.
  [
    '<a href="/" class="word" aria-label="sure a11y"><span>sure</span><span>a11y</span></a>',
    'pass'
  ],
  ['<a href="/" class="gap" aria-label="surea11y"><span>sure</span><span>a11y</span></a>', 'fail'],
  [
    '<a href="/" class="margin" aria-label="surea11y"><span>sure</span><span>a11y</span></a>',
    'fail'
  ],
  [
    '<a href="/" class="padding" aria-label="surea11y"><span>sure</span><span>a11y</span></a>',
    'fail'
  ],
  ['<a href="/" aria-label="surea11y"><div>sure</div><div>a11y</div></a>', 'fail'],
  ['<a href="/" class="word" aria-label="other"><span>sure</span><span>a11y</span></a>', 'fail']
];

test('label-in-name reads touching boxes as one word, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [control, outcome] of CASES) {
    await t.test(control, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title><style>body{font:16px sans-serif} ${CSS}</style></head><body><main>${control}</main></body></html>`
        );
        await addBundle(page);
        const got = await page.evaluate(
          () =>
            window.a11ycore.runa11yCoreInPage(null, null, {}, ['label-in-name']).checksResults[0]
              .outcome
        );
        assert.equal(got, outcome);
      } finally {
        await page.close();
      }
    });
  }
});
