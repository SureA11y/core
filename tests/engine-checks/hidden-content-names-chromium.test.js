'use strict';

/**
 * Content the page shows or hides with CSS against what the markup says:
 * a hidden attribute that author CSS displays again, and content-visibility,
 * which hides a box's contents but has no effect on an inline element. Each
 * case is checked against the name Chromium's accessibility tree gives, so
 * the engine says "no name" exactly where Chromium does.
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

// [markup, rule, Chromium's name, the rule's outcome]
const CASES = [
  [
    '<button><span hidden style="display:inline">Open</span></button>',
    'button-name-present',
    'Open',
    'pass'
  ],
  [
    '<style>.shown{display:inline}</style><button><span hidden class="shown">Open</span></button>',
    'button-name-present',
    'Open',
    'pass'
  ],
  ['<button><span hidden>Open</span></button>', 'button-name-present', '', 'fail'],
  ['<button style="content-visibility:hidden">Save</button>', 'button-name-present', '', 'fail'],
  [
    '<button style="content-visibility:hidden"><b>Save</b></button>',
    'button-name-present',
    '',
    'fail'
  ],
  [
    '<button><div style="content-visibility:hidden"><b>Save</b></div></button>',
    'button-name-present',
    '',
    'fail'
  ],
  [
    '<button><span style="content-visibility:hidden">Save</span></button>',
    'button-name-present',
    'Save',
    'pass'
  ],
  [
    '<button><span style="content-visibility:hidden"><b>Save</b></span></button>',
    'button-name-present',
    'Save',
    'pass'
  ],
  [
    '<button><span style="display:inline-block;content-visibility:hidden">Save</span></button>',
    'button-name-present',
    '',
    'fail'
  ],
  ['<a href="#" style="content-visibility:hidden">Home</a>', 'link-name-present', 'Home', 'pass']
];

test('names from content hidden or shown by CSS, against Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);

  for (const [markup, ruleId, chromeName, expected] of CASES) {
    await t.test(`${ruleId} ${expected}: ${markup}`, async () => {
      await page.setContent(
        `<!doctype html><html lang="en"><head><title>t</title></head><body>${markup}</body></html>`
      );
      const { nodes } = await cdp.send('Accessibility.getFullAXTree');
      const named = nodes.filter(
        (n) => !n.ignored && n.role && ['button', 'link'].includes(n.role.value)
      );
      assert.equal(named.length, 1);
      assert.equal((named[0].name && named[0].name.value) || '', chromeName, 'Chromium name');

      await page.addScriptTag({ content: BUNDLE });
      const outcome = await page.evaluate((id) => {
        const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [id]);
        return r.checksResults.find((c) => c.ruleId === id).outcome;
      }, ruleId);
      assert.equal(outcome, expected);
    });
  }
});
