'use strict';

/**
 * A button or link whose name sits in a component no script can read (a
 * closed shadow root) is asked about, not failed: the browser names it from
 * what is inside, and the engine can't look there. A custom element with no
 * children and no open shadow root that still renders is the sign. In
 * Chromium it renders when it has a box; in jsdom, with no layout, when its
 * element is defined. Chromium names each case as noted.
 *
 * The Chromium part is skipped when Playwright or its Chromium build is not
 * installed. Set CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createDom, runa11yCoreOnDom } = require('../../src/testing.js');

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

const DEFINE = (mode) => `
  customElements.define('x-icon', class extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: '${mode}' });
      const img = document.createElement('img');
      img.alt = 'Save';
      img.style.cssText = 'width:16px;height:16px';
      root.append(img);
    }
  });`;

// [case, body, script, rule, expected outcome, expected reason code]
const CASES = [
  [
    'a button over a closed icon',
    '<button><x-icon></x-icon></button>',
    DEFINE('closed'),
    'button-name-present',
    'cantTell',
    'name_closedContent'
  ],
  [
    'a link over a closed icon',
    '<a href="/s"><x-icon></x-icon></a>',
    DEFINE('closed'),
    'link-name-present',
    'cantTell',
    'name_closedContent'
  ],
  [
    'a button over an open icon',
    '<button><x-icon></x-icon></button>',
    DEFINE('open'),
    'button-name-present',
    'pass',
    null
  ],
  ['an empty button', '<button></button>', '', 'button-name-present', 'fail', 'name_missing'],
  [
    'a button over an undefined, empty custom element',
    '<button><x-none></x-none></button>',
    '',
    'button-name-present',
    'fail',
    'name_missing'
  ]
];

const result = (r, ruleId) => {
  const c = r.checksResults.find((x) => x.ruleId === ruleId);
  return [c.outcome, c.occurrences[0] ? c.occurrences[0].data.details.reasonCode : null];
};

test('in jsdom, a defined component with no readable content is asked about', () => {
  for (const [name, body, script, ruleId, outcome, code] of CASES) {
    const dom = createDom(
      `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`
    );
    const mode = /mode: '(\w+)'/.exec(script);
    if (mode) {
      // jsdom runs no page scripts here: the component is defined from its window.
      const win = dom.window;
      win.customElements.define(
        'x-icon',
        class extends win.HTMLElement {
          constructor() {
            super();
            const img = win.document.createElement('img');
            img.alt = 'Save';
            this.attachShadow({ mode: mode[1] }).append(img);
          }
        }
      );
    }
    const r = runa11yCoreOnDom(dom, { runOnly: [ruleId] });
    assert.deepEqual(result(r, ruleId), [outcome, code], name);
  }
});

test('in Chromium, the same, where the component renders a box', { skip }, async () => {
  const browser = await chromium.launch({ executablePath });
  try {
    for (const [name, body, script, ruleId, outcome, code] of CASES) {
      const page = await browser.newPage();
      await page.setContent(
        `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main><script>${script}</script></body></html>`
      );
      await page.addScriptTag({ content: BUNDLE });
      const r = await page.evaluate(
        (id) => window.a11ycore.runa11yCoreInPage(null, null, {}, [id]),
        ruleId
      );
      assert.deepEqual(result(r, ruleId), [outcome, code], name);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
