'use strict';

/**
 * click-handler-keyboard-operable against what Chromium does with the
 * keyboard: whether Tab reaches the element or its flat-tree content, and
 * whether Enter then runs the inline click handler.
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

// [label, light-DOM markup with a #host, the host's shadow root (or null),
// its delegatesFocus, whether Tab lands in #host, whether Enter then runs the
// click handler, the rule's outcome, its reason code]
const CASES = [
  [
    'host role="button" with a <button> in its shadow root',
    '<x-a id="host" role="button" onclick="hits.push(1)"></x-a>',
    '<button>In</button>',
    false,
    true,
    true,
    'notApplicable',
    null
  ],
  [
    'host role="button" with an <a href> in its shadow root',
    '<x-d id="host" role="button" onclick="hits.push(1)"></x-d>',
    '<a href="#x">In</a>',
    false,
    true,
    true,
    'notApplicable',
    null
  ],
  [
    'shadow role="button" with a slotted <button>',
    '<x-f id="host"><button>Slotted</button></x-f>',
    '<div role="button" onclick="hits.push(1)"><slot></slot></div>',
    false,
    true,
    true,
    'notApplicable',
    null
  ],
  [
    'host with delegatesFocus and a focusable <div> in its shadow root',
    '<x-c id="host" role="button" onclick="hits.push(1)"></x-c>',
    '<div tabindex="0">In</div>',
    true,
    true,
    false,
    'cantTell',
    'CLICK_HANDLER_NO_KEY_HANDLER'
  ],
  [
    'role="button" tabindex="0" with display: contents',
    '<div id="host" role="button" tabindex="0" onclick="hits.push(1)" style="display: contents"><span>X</span></div>',
    null,
    false,
    false,
    false,
    'fail',
    'CLICK_HANDLER_CONTROL_NOT_FOCUSABLE'
  ],
  [
    'role="button" tabindex="-1"',
    '<div id="host" role="button" tabindex="-1" onclick="hits.push(1)">X</div>',
    null,
    false,
    false,
    false,
    'cantTell',
    'CLICK_HANDLER_NOT_IN_TAB_ORDER'
  ],
  // Drawn as a button without cursor:pointer (round 10, C10-4): Tab never
  // reaches it, so it is asked about; a large wrapper is not.
  [
    'a <div onclick> drawn as a button, with the default cursor',
    '<div id="host" style="background:#2a9d8f;color:#fff;padding:12px 24px" onclick="hits.push(1)">Add to cart</div>',
    null,
    false,
    false,
    false,
    'cantTell',
    'CLICK_HANDLER_NOT_FOCUSABLE'
  ],
  // Short visible text: hidden and screen-reader-only text is left out
  // (round 12, U12-11).
  [
    'a drawn button whose label is short once its screen-reader-only text is left out',
    '<div id="host" style="display:inline-block;padding:8px;border:1px solid" onclick="hits.push(1)">Buy <span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">the blue widget now today ok</span><span style="display:none">and more words that are not shown</span></div>',
    null,
    false,
    false,
    false,
    'cantTell',
    'CLICK_HANDLER_NOT_FOCUSABLE'
  ],
  // Drawn inside a native button, which the keyboard operates (round 12,
  // U12-12).
  [
    'a styled <span onclick> inside a <button>',
    '<button><span id="host" style="padding:2px;background:#eee" onclick="hits.push(1)">Go</span></button>',
    null,
    false,
    false,
    false,
    'notApplicable',
    null
  ],
  [
    'a padded card with a background, a heading and a paragraph',
    '<div id="host" style="background:#eee;padding:16px" onclick="hits.push(1)"><h3>Weekly newsletter</h3><p>The news of the week, every Monday.</p></div>',
    null,
    false,
    false,
    false,
    'notApplicable',
    null
  ]
];

test(
  'click-handler-keyboard-operable follows what Chromium focuses and activates',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    for (const [label, light, shadow, delegates, tabbed, entered, outcome, code] of CASES) {
      await t.test(label, async () => {
        const page = await browser.newPage();
        try {
          await page.setContent(
            `<!doctype html><html lang="en"><head><title>t</title><script>window.hits = [];</script></head><body><main>${light}</main></body></html>`
          );
          if (shadow != null) {
            await page.evaluate(
              ([html, delegatesFocus]) => {
                document
                  .getElementById('host')
                  .attachShadow({ mode: 'open', delegatesFocus }).innerHTML = html;
              },
              [shadow, delegates]
            );
          }
          await page.keyboard.press('Tab');
          const inHost = await page.evaluate(() => {
            const host = document.getElementById('host');
            const a = document.activeElement;
            return !!a && a !== document.body && (a === host || host.contains(a));
          });
          assert.equal(inHost, tabbed, 'Tab reaches it in Chromium');
          if (tabbed) {
            await page.keyboard.press('Enter');
            assert.equal(
              await page.evaluate(() => window.hits.length > 0),
              entered,
              'Enter runs the handler in Chromium'
            );
          }

          await addBundle(page);
          const got = await page.evaluate(() => {
            const r = window.a11ycore.runa11yCoreInPage(null, null, {}, [
              'click-handler-keyboard-operable'
            ]).checksResults[0];
            const occ = (r.occurrences || [])[0];
            return {
              outcome: r.outcome,
              code: (occ && occ.data && occ.data.details && occ.data.details.reasonCode) || null
            };
          });
          assert.deepEqual(got, { outcome, code });
        } finally {
          await page.close();
        }
      });
    }
  }
);
