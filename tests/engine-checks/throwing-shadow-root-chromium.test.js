'use strict';

/**
 * A custom element whose shadowRoot getter throws, whether its class
 * defines the getter, the element has its own, or the page patched
 * Element.prototype: its shadow tree is unreadable, as a closed one is, and
 * no rule reports the getter's error. It used to put about 77 rules into
 * cantTell.
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

test('a throwing shadowRoot getter, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const variant of ['class getter', 'own property', 'patched prototype']) {
    await t.test(variant, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>T</h1><x-bad>hi</x-bad><img src="a.png" alt="A"><p>text</p></main></body></html>'
        );
        await page.evaluate((v) => {
          const fail = () => {
            throw new Error('nope');
          };
          if (v === 'class getter') {
            customElements.define(
              'x-bad',
              class extends HTMLElement {
                get shadowRoot() {
                  return fail();
                }
              }
            );
          } else if (v === 'own property') {
            Object.defineProperty(document.querySelector('x-bad'), 'shadowRoot', { get: fail });
          } else {
            const native = Object.getOwnPropertyDescriptor(Element.prototype, 'shadowRoot');
            Object.defineProperty(Element.prototype, 'shadowRoot', {
              configurable: true,
              get() {
                return this.localName === 'x-bad' ? fail() : native.get.call(this);
              }
            });
          }
        }, variant);
        await page.addScriptTag({ content: BUNDLE });
        const errored = await page.evaluate(() =>
          window.a11ycore
            .runa11yCoreInPage(null, null, {}, null)
            .checksResults.filter((c) => c.error && !c.occurrences.length)
            .map((c) => c.ruleId)
        );
        assert.deepEqual(errored, []);
      } finally {
        await page.close();
      }
    });
  }
});
