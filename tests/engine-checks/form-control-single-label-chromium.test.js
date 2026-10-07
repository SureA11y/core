'use strict';

/**
 * form-control-single-label counts the labels HTML associates with a control
 * (#113): a `for` label labels the first element with that id in its own
 * tree, and a wrapping label without `for` labels only its first labelable
 * descendant (HTML, labeled control). Each case is checked against the
 * control's `labels` in Chromium, which follows that algorithm.
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

// [description, markup, markup put in a shadow root on #host (or null), how
// many labels the control marked .t has]
const CASES = [
  [
    'a wrapping label labels its first field only',
    '<label>From <input> to <input class="t" id="to"></label><label for="to">End date</label>',
    null,
    1
  ],
  [
    'a wrapping label with for does not label the field it wraps',
    '<label for="email">Email <input class="t" id="email2"></label><input id="email"><label for="email2">Backup</label>',
    null,
    1
  ],
  [
    'for labels only the first element with the id',
    '<label for="x">A</label><input id="x"><label>B <input class="t" id="x"></label>',
    null,
    1
  ],
  [
    'a button before the field takes the wrapping label',
    '<label>Go <button>x</button> <input class="t" id="s"></label><label for="s">Search</label>',
    null,
    1
  ],
  [
    'a wrapping label whose for matches nothing labels nothing',
    '<label for="none">A <input class="t" id="z"></label><label for="z">B</label>',
    null,
    1
  ],
  [
    'for does not reach into a shadow root',
    '<label for="q">Light</label><div id="host"></div>',
    '<label>Zip <input class="t" id="q"></label>',
    1
  ],
  [
    'a hidden input is not labelable, so the wrapping label labels the next field',
    '<label>Name <input type="hidden" value="1"><input class="t" id="n"></label><label for="n">Other</label>',
    null,
    2
  ],
  [
    'a wrapping label and a for label on one field',
    '<label>Name <input class="t" id="n"></label><label for="n">Full name</label>',
    null,
    2
  ],
  [
    'the same, in a shadow root',
    '<div id="host"></div>',
    '<label>Zip <input class="t" id="q"></label><label for="q">Postcode</label>',
    2
  ]
];

test(
  'form-control-single-label counts the labels HTML associates, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    for (const [description, markup, shadow, count] of CASES) {
      await t.test(description, async () => {
        const page = await browser.newPage();
        try {
          await page.setContent(
            `<!doctype html><html lang="en"><head><title>Labels</title></head><body><main>${markup}</main></body></html>`
          );
          if (shadow) {
            await page.evaluate((html) => {
              document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML = html;
            }, shadow);
          }
          await page.evaluate(BUNDLE);
          const r = await page.evaluate(() => {
            const host = document.getElementById('host');
            const el = ((host && host.shadowRoot) || document).querySelector('.t');
            const res = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
              'form-control-single-label'
            ]);
            const c = res.checksResults.find((x) => x.ruleId === 'form-control-single-label');
            return {
              labels: el.labels.length,
              outcome: c.outcome,
              occurrences: (c.occurrences || []).length
            };
          });
          assert.equal(r.labels, count);
          assert.equal(r.outcome, count > 1 ? 'fail' : 'pass');
          assert.equal(r.occurrences, count > 1 ? 1 : 0);
        } finally {
          await page.close();
        }
      });
    }
  }
);
