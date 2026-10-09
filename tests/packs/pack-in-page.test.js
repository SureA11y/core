'use strict';

/**
 * Packs in a page (packScript and buildBrowserBundle in src/pack.js): the
 * script registers the packs' prepared catalog, and runa11yCoreInPage runs on
 * it when engineOptions.packs names them. In jsdom the result is the one a
 * scan with the packs gives in Node; in Chromium it runs on a page whose
 * Content Security Policy forbids eval, so no rule's code is a string.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

const main = require('../../src/index.js');
const { definePack, packScript, buildBrowserBundle } = require('../../src/pack.js');

let chromium = null;
try {
  ({ chromium } = require('playwright'));
} catch {}

const PAGE =
  '<!doctype html><html><head><title>t</title></head><body><main>' +
  '<img src="a.png"><p style="color:#767676;background:#fff">Grey text</p></main></body></html>';

// A rule written as a method, an arrow function and a variant of a core rule,
// and an override written as a function expression.
const acme = definePack({
  name: '@acme/page',
  version: '1.0.0',
  namespace: 'acme',
  core: '*',
  overrides: ['img-alt-present'],
  rules: [
    {
      id: 'acme-lang-present',
      meta: { title: 'The page states its language', tags: ['acme'] },
      runInPage(ctx) {
        const lang = ctx.document.documentElement.getAttribute('lang');
        return lang
          ? { outcome: 'pass' }
          : { outcome: 'fail', occurrences: [{ __node: ctx.document.documentElement }] };
      }
    },
    {
      id: 'acme-always',
      meta: { title: 'Always passes', tags: ['acme'] },
      runInPage: () => ({ outcome: 'pass' })
    },
    {
      id: 'img-alt-present',
      runInPage: function () {
        return { outcome: 'pass' };
      }
    }
  ],
  variants: [
    {
      id: 'acme-contrast-enhanced',
      from: 'contrast-minimum',
      config: { normalTextRatio: 7, largeTextRatio: 4.5 },
      meta: {
        title: 'Text contrast is at least 7:1',
        tags: ['acme'],
        i18n: {
          titleKey: 'acmeContrastEnhanced_title',
          descriptionKey: 'acmeContrastEnhanced_description'
        }
      }
    }
  ],
  dictionaries: {
    en: {
      acmeContrastEnhanced_title: 'Text contrast is at least 7:1',
      acmeContrastEnhanced_description: 'Checks text contrast at 7:1.'
    }
  }
});
const NAMES = ['@acme/page@1.0.0'];

function scan(run, engineOptions) {
  const dom = new JSDOM(PAGE, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    return run('https://example.test/', null, {
      timestamp: '2026-10-09T00:00:00.000Z',
      ...engineOptions
    });
  } finally {
    dom.window.close();
  }
}

test('a registered pack gives in the page the result it gives in Node', () => {
  new Function(packScript([acme]))();
  try {
    const inPage = scan(main.runa11yCoreInPage, { packs: NAMES });
    const node = scan(main.runDomRulesInPage, { packs: [acme] });
    assert.deepEqual(inPage, node);
    assert.deepEqual(inPage.engine.packs, NAMES);
    assert.deepEqual(inPage.overriddenBuiltinIds, ['img-alt-present']);
    const outcome = (id) => inPage.checksResults.find((c) => c.ruleId === id).outcome;
    assert.equal(outcome('acme-lang-present'), 'fail');
    assert.equal(outcome('acme-always'), 'pass');
    assert.equal(outcome('acme-contrast-enhanced'), 'fail');
    assert.equal(outcome('img-alt-present'), 'pass');
  } finally {
    delete globalThis.__surea11yPacks;
  }
});

test('a scan without packs is unchanged with packs registered in the page', () => {
  const expected = scan(main.runa11yCoreInPage, {});
  new Function(packScript([acme]))();
  try {
    assert.deepEqual(scan(main.runa11yCoreInPage, {}), expected);
  } finally {
    delete globalThis.__surea11yPacks;
  }
});

test('packs named but not registered are not dropped unnoticed', () => {
  const warn = console.warn;
  const warnings = [];
  console.warn = (m) => warnings.push(String(m));
  try {
    const result = scan(main.runa11yCoreInPage, { packs: NAMES });
    assert.equal(result.engine.packs, undefined);
    assert.ok(warnings.some((w) => /register them in the page \(packScript/.test(w)));
  } finally {
    console.warn = warn;
  }
  assert.throws(
    () => scan(main.runa11yCoreInPage, { packs: NAMES, strictOptions: true }),
    /engineOptions\.packs: .*\(strictOptions\)/
  );
});

test('packScript refuses a pack that is not valid', () => {
  assert.throws(
    () => packScript([{ name: 'bad', version: '1.0.0', namespace: 'bad', core: '^99.0.0' }]),
    /engineOptions\.packs: bad: .*supports core/
  );
});

function findExecutable() {
  const candidates = [process.env.CHROMIUM_EXECUTABLE_PATH];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}
const executablePath = chromium ? findExecutable() : null;
const skip = !chromium
  ? 'playwright not installed'
  : !executablePath
    ? 'no Chromium build found (set CHROMIUM_EXECUTABLE_PATH)'
    : false;

// Records in the page whether eval is allowed there. (Code that page.evaluate
// runs is not held to the page's policy, so it can't tell.)
const EVAL_PROBE =
  "try { new Function('return 1')(); document.body.dataset.eval = 'allowed'; }" +
  " catch (e) { document.body.dataset.eval = 'blocked'; }";

test(
  'in Chromium, a bundle built with a pack runs it where eval is forbidden',
  { skip },
  async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const page = await browser.newPage();
      await page.route('https://example.test/', (route) =>
        route.fulfill({
          contentType: 'text/html',
          headers: { 'Content-Security-Policy': "script-src 'unsafe-inline'" },
          body: PAGE.replace('</body>', `<script>${EVAL_PROBE}</script></body>`)
        })
      );
      await page.goto('https://example.test/');
      assert.equal(await page.evaluate(() => document.body.dataset.eval), 'blocked');
      await page.addScriptTag({ content: buildBrowserBundle({ packs: [acme] }) });
      const result = await page.evaluate(
        (names) => window.a11ycore.runa11yCoreInPage(null, null, { packs: names }, null),
        NAMES
      );
      assert.deepEqual(result.engine.packs, NAMES);
      const outcome = (id) => result.checksResults.find((c) => c.ruleId === id).outcome;
      assert.equal(outcome('acme-lang-present'), 'fail');
      assert.equal(outcome('acme-contrast-enhanced'), 'fail');
      assert.equal(outcome('img-alt-present'), 'pass');
    } finally {
      await browser.close();
    }
  }
);
