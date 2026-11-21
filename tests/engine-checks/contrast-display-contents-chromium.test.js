'use strict';

/**
 * An element with display: contents (a wrapper made so, or a <slot>, which
 * is one by default) generates no box, so it never has client rects, but
 * its text is drawn in the line around it. The visibility filter took the
 * missing rects for "not drawn", and the contrast rules left the text out:
 * #ccc on white was notApplicable. It is visible where its content is
 * drawn, and link-in-text-block looks through such a wrapper for the text
 * around the link, as through an inline one. Round 8, LY-5.
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

const shadowHost = (inner) =>
  `<x-card></x-card><script>customElements.define('x-card', class extends HTMLElement { connectedCallback() { this.attachShadow({ mode: 'open' }).innerHTML = ${JSON.stringify(inner)}; } });</script>`;

// [description, markup, rule, expected outcome]
const CASES = [
  [
    'text directly in a display: contents div is measured',
    '<div style="display:contents;color:#ccc">Direct text in a contents box</div>',
    'contrast-minimum',
    'fail'
  ],
  [
    'text in a display: contents span inside a paragraph is measured',
    '<p>Before <span style="display:contents;color:#ccc">contents span text</span> after</p>',
    'contrast-minimum',
    'fail'
  ],
  [
    "an empty slot's fallback text is measured",
    shadowHost('<slot style="color:#ccc">Fallback text</slot>'),
    'contrast-minimum',
    'fail'
  ],
  [
    'a display: contents box whose text is hidden stays out',
    '<div style="display:contents;color:#ccc;visibility:hidden">Hidden text</div>',
    'contrast-minimum',
    'notApplicable'
  ],
  [
    'a link wrapped in a display: contents span is judged against the text around it',
    '<p style="color:#333">Read the <span style="display:contents"><a href="#" style="color:#444;text-decoration:none">terms of service</a></span> before you go.</p>',
    'link-in-text-block',
    'fail'
  ]
];

test('contrast: text whose parent has display: contents, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [description, markup, ruleId, expected] of CASES) {
    await t.test(description, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>Contents</title></head><body style="background:#fff"><main>${markup}</main></body></html>`
        );
        await page.evaluate(BUNDLE);
        const outcome = await page.evaluate(
          (id) =>
            window.a11ycore.runa11yCoreInPage(location.href, null, {}, [id]).checksResults[0]
              .outcome,
          ruleId
        );
        assert.equal(outcome, expected);
      } finally {
        await page.close();
      }
    });
  }
});
