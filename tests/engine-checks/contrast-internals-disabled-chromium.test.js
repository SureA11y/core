'use strict';

/**
 * WCAG 1.4.3 and 1.4.6 exempt text that is part of an inactive user
 * interface component. A custom element disabled through its
 * ElementInternals (internals.role = 'button', internals.ariaDisabled =
 * 'true') is as disabled as role=button aria-disabled=true, which the
 * contrast rules already exempt, but its text was held to the ratio. The
 * exemption now reads the internals' aria-disabled where the element has
 * no attribute of its own, whether the engine finds them on the element
 * (this._internals) or through the internals hook. Round 8, LY-14.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { internalsHookScript } = require('../../src/index.js');

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

// A button component, #949494 on white (3.03:1), its internals kept in
// `this._internals` or in a local the hook alone can see.
const component = (name, disabled, { keep = true, attr = '' } = {}) =>
  `<${name}${attr}>Send</${name}><script>customElements.define('${name}', class extends HTMLElement { constructor() { super(); const i = this.attachInternals(); ${keep ? 'this._internals = i;' : ''} i.role = 'button'; i.ariaDisabled = '${disabled}'; } }); document.querySelector('${name}').style.color = '#949494';</script>`;

// [description, markup, hook, expected contrast-minimum outcome]
const CASES = [
  [
    'role=button aria-disabled=true is exempt',
    '<div role="button" aria-disabled="true" style="color:#949494">Send</div>',
    false,
    'notApplicable'
  ],
  [
    'internals.ariaDisabled = true, internals on the element, is exempt',
    component('x-send', 'true'),
    false,
    'notApplicable'
  ],
  [
    'internals.ariaDisabled = true, read through the internals hook, is exempt',
    component('x-send', 'true', { keep: false }),
    true,
    'notApplicable'
  ],
  [
    'internals.ariaDisabled = false is held to the ratio',
    component('x-send', 'false'),
    false,
    'fail'
  ],
  [
    'an aria-disabled="false" attribute overrides the internals',
    component('x-send', 'true', { attr: ' aria-disabled="false"' }),
    false,
    'fail'
  ]
];

test(
  'contrast: a component disabled through ElementInternals, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    for (const [description, markup, hook, expected] of CASES) {
      await t.test(description, async () => {
        const page = await browser.newPage();
        try {
          const html = `<!doctype html><html lang="en"><head><title>Internals</title></head><body style="background:#fff"><main>${markup}</main></body></html>`;
          if (hook) {
            // Served from an origin, so the init script runs before the page's
            // own (page.setContent reuses the blank page, which it never ran in).
            await page.addInitScript({ content: internalsHookScript() });
            await page.route('https://example.test/**', (route) =>
              route.fulfill({ contentType: 'text/html', body: html })
            );
            await page.goto('https://example.test/');
          } else {
            await page.setContent(html);
          }
          await page.evaluate(BUNDLE);
          const outcome = await page.evaluate(
            () =>
              window.a11ycore.runa11yCoreInPage(location.href, null, {}, ['contrast-minimum'])
                .checksResults[0].outcome
          );
          assert.equal(outcome, expected);
        } finally {
          await page.close();
        }
      });
    }
  }
);
