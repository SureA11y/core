'use strict';

/**
 * iframe-focusable-content fails a frame with tabindex="-1" whose document
 * holds an element in its tab order, by HTML's rules (#121). A negative
 * tabindex on the frame takes its whole content out of the tab order: in
 * Chromium, Tab goes from the element before the frame to the one after it,
 * so that element cannot be reached. Each case's oracle is the same content
 * in a frame without tabindex: whether Tab reaches anything inside it.
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
const IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

// [description, frame content, whether its tab order holds anything]
const CASES = [
  ['a button in a disabled fieldset', '<fieldset disabled><button>x</button></fieldset>', false],
  ['an empty tabindex', '<div tabindex="">x</div>', false],
  ['an invalid tabindex', '<div tabindex="abc">x</div>', false],
  [
    'an <area> of a map no <img> uses',
    '<map name="m"><area href="/x" shape="rect" coords="0,0,9,9" alt="x"></map>',
    false
  ],
  [
    'an <area> whose map an <img> names in another case',
    `<map name="m"><area href="/x" shape="rect" coords="0,0,9,9" alt="x"></map><img src="${IMG}" usemap="#M" width="10" height="10" alt="">`,
    false
  ],
  ['a button in an inert div', '<div inert><button>x</button></div>', false],
  ['an editing host', '<div contenteditable="">x</div>', true],
  ['a plaintext-only editing host', '<div contenteditable="plaintext-only">x</div>', true],
  ['the first <summary> of a <details>', '<details><summary>More</summary>x</details>', true],
  ['a button with an invalid tabindex', '<button tabindex="abc">x</button>', true],
  [
    'a button in the legend of a disabled fieldset',
    '<fieldset disabled><legend><button>x</button></legend></fieldset>',
    true
  ],
  [
    'an <area> of a map an <img> uses',
    `<map name="m"><area href="/x" shape="rect" coords="0,0,9,9" alt="x"></map><img src="${IMG}" usemap="#m" width="10" height="10" alt="">`,
    true
  ]
];

const page = (content, tabindex) =>
  `<!doctype html><html lang="en"><head><title>Frames</title></head><body><main><button id="before">before</button><iframe id="f" title="frame" width="200" height="80"${tabindex} srcdoc="${content
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')}"></iframe><button id="after">after</button></main></body></html>`;

// The elements inside the frame Tab reaches between #before and #after.
async function tabbedInto(p) {
  await p.focus('#before');
  const reached = [];
  for (let i = 0; i < 8; i++) {
    await p.keyboard.press('Tab');
    const where = await p.evaluate(() => {
      const a = document.activeElement;
      if (a && a.id === 'f') {
        const inner = a.contentDocument.activeElement;
        return inner && inner !== a.contentDocument.body ? inner.localName : 'frame';
      }
      return a ? a.id || a.localName : '';
    });
    if (where === 'after') break;
    if (where !== 'frame' && where !== 'before') reached.push(where);
  }
  return reached;
}

test(
  'iframe-focusable-content reads the frame tab order by HTML rules, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    await t.test('Tab skips the content of a frame with tabindex="-1"', async () => {
      const p = await browser.newPage();
      try {
        await p.setContent(page('<button>x</button><div tabindex="0">y</div>', ' tabindex="-1"'));
        await p.waitForFunction(
          () => document.getElementById('f').contentDocument.body.childElementCount > 0
        );
        assert.deepEqual(await tabbedInto(p), []);
      } finally {
        await p.close();
      }
    });

    for (const [description, content, inOrder] of CASES) {
      await t.test(description, async () => {
        const p = await browser.newPage();
        try {
          await p.setContent(page(content, ''));
          await p.waitForFunction(
            () => document.getElementById('f').contentDocument.body.childElementCount > 0
          );
          assert.equal((await tabbedInto(p)).length > 0, inOrder);

          await p.evaluate(() => document.getElementById('f').setAttribute('tabindex', '-1'));
          await p.evaluate(BUNDLE);
          const outcome = await p.evaluate(
            () =>
              window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
                'iframe-focusable-content'
              ]).checksResults[0].outcome
          );
          assert.equal(outcome, inOrder ? 'fail' : 'pass');
        } finally {
          await p.close();
        }
      });
    }
  }
);
