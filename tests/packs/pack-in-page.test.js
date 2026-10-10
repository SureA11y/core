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

// Named packs the page doesn't run as named are listed in skippedPacks
// with the reason, warned about, and thrown under strictOptions; the rest
// of the scan runs without them.
function unrun(engineOptions) {
  const warn = console.warn;
  const warnings = [];
  console.warn = (m) => warnings.push(String(m));
  try {
    return { result: scan(main.runa11yCoreInPage, engineOptions), warnings };
  } finally {
    console.warn = warn;
  }
}

test('packs named but not registered are not dropped unnoticed', () => {
  const { result, warnings } = unrun({ packs: NAMES });
  assert.equal(result.engine.packs, undefined);
  assert.deepEqual(
    result.skippedPacks.map((s) => s.name),
    NAMES
  );
  assert.match(result.skippedPacks[0].reason, /none is registered/);
  assert.ok(warnings.some((w) => /@acme\/page@1\.0\.0 not run: no packScript/.test(w)));
  const { skippedPacks, ...rest } = result;
  assert.deepEqual(rest, scan(main.runa11yCoreInPage, {}));
  assert.throws(
    () => scan(main.runa11yCoreInPage, { packs: NAMES, strictOptions: true }),
    /engineOptions\.packs: .*\(strictOptions\)/
  );
});

test('packs run only as one packScript call registered them', () => {
  const other = definePack({
    name: '@acme/other',
    version: '1.0.0',
    namespace: 'other',
    core: '*',
    rules: []
  });
  const both = ['@acme/other@1.0.0', ...NAMES];
  // Registered apart, named together: not run, and the sets are named.
  new Function(packScript([acme]))();
  new Function(packScript([other]))();
  try {
    const { result, warnings } = unrun({ packs: both });
    assert.deepEqual(
      result.skippedPacks.map((s) => s.name),
      both
    );
    assert.match(
      result.skippedPacks[0].reason,
      /registered: \[@acme\/page@1\.0\.0\], \[@acme\/other@1\.0\.0\]/
    );
    assert.ok(warnings.length);
  } finally {
    delete globalThis.__surea11yPacks;
  }
  // Registered together, one named: not run.
  new Function(packScript([acme, other]))();
  try {
    const { result } = unrun({ packs: NAMES });
    assert.match(
      result.skippedPacks[0].reason,
      /registered: \[@acme\/other@1\.0\.0, @acme\/page@1\.0\.0\]/
    );
    assert.deepEqual(scan(main.runa11yCoreInPage, { packs: both }).engine.packs, both);
  } finally {
    delete globalThis.__surea11yPacks;
  }
});

test('packs prepared for another core are refused in the page', () => {
  const script = packScript([acme]);
  assert.match(script, /core: "\d+\.\d+\.\d+[^"]*",/);
  new Function(script.replace(/core: "[^"]*",/, 'core: "0.0.1",'))();
  try {
    const { result } = unrun({ packs: NAMES });
    assert.equal(result.engine.packs, undefined);
    assert.match(
      result.skippedPacks[0].reason,
      /prepared for core 0\.0\.1, and this page runs core /
    );
    assert.throws(
      () => scan(main.runa11yCoreInPage, { packs: NAMES, strictOptions: true }),
      /prepared for core 0\.0\.1/
    );
  } finally {
    delete globalThis.__surea11yPacks;
  }
  // A script that uses a core rule the page's core lacks: refused, and
  // core's own rules all run.
  new Function(packScript([acme]))();
  const entry = Object.values(globalThis.__surea11yPacks)[0];
  const id = Object.keys(entry.impls).find((k) => typeof entry.impls[k] === 'string');
  entry.impls[id] = 'no-such-rule';
  try {
    const { result } = unrun({ packs: NAMES });
    assert.match(result.skippedPacks[0].reason, /core rules this page's core does not have/);
    assert.equal(
      result.checksResults.length,
      scan(main.runa11yCoreInPage, {}).checksResults.length
    );
  } finally {
    delete globalThis.__surea11yPacks;
  }
});

test('a name an object has by inheritance names no registered set', () => {
  new Function(packScript([acme]))();
  try {
    for (const name of ['__proto__', 'toString', 'constructor']) {
      const { result } = unrun({ packs: [name] });
      assert.match(result.skippedPacks[0].reason, /no packScript in this page registered/, name);
    }
  } finally {
    delete globalThis.__surea11yPacks;
  }
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

// Every way a rule's code can be written, as a page gets it.
const shapes = definePack({
  name: 'shapes',
  version: '1.0.0',
  namespace: 'shapes',
  core: '*',
  rules: [
    ['shapes-defaults', (_ctx, o = String(1)) => ({ outcome: o === '1' ? 'pass' : 'fail' })],
    ['shapes-paren', (_ctx, s = ')') => ({ outcome: s === ')' ? 'pass' : 'fail' })],
    ['shapes-comment', (_ctx /* ) */) => ({ outcome: 'pass' })],
    [
      'shapes-method',
      {
        runInPage(_ctx) {
          return { outcome: 'pass' };
        }
      }.runInPage
    ],
    [
      'shapes-computed',
      {
        ['runInPage'](_ctx) {
          return { outcome: 'pass' };
        }
      }.runInPage
    ],
    [
      'shapes-function',
      function (_ctx) {
        return { outcome: 'pass' };
      }
    ]
  ].map(([id, runInPage]) => ({ id, meta: { title: id }, runInPage }))
});

test('every way of writing a rule reads back in the page', () => {
  const script = packScript([shapes]);
  new Function(script)();
  try {
    const inPage = scan(main.runa11yCoreInPage, {
      packs: ['shapes@1.0.0'],
      optInRules: ['shapes']
    });
    const node = scan(main.runDomRulesInPage, { packs: [shapes], optInRules: ['shapes'] });
    assert.deepEqual(inPage, node);
    const own = inPage.checksResults.filter((c) => c.ruleId.startsWith('shapes-'));
    assert.equal(own.length, 6);
    for (const c of own) assert.equal(c.outcome, 'pass', c.ruleId);
  } finally {
    delete globalThis.__surea11yPacks;
  }
});

test('code a page can not be given is refused, naming the rule', () => {
  const { checkPack } = require('../../src/pack.js');
  const pack = (runInPage) => ({
    name: 'odd',
    version: '1.0.0',
    namespace: 'odd',
    core: '*',
    rules: [{ id: 'odd-rule', meta: { title: 'Odd' }, runInPage }]
  });
  for (const fn of [function () {}.bind(null), Math.max]) {
    assert.match(
      checkPack(pack(fn)).join(),
      /odd-rule's runInPage has no source a page can be given/
    );
    assert.throws(() => packScript([pack(fn)]), /odd-rule's runInPage has no source/);
  }
  // An inline <script> ends at the first "</script".
  const closing = pack(() => ({ outcome: 'pass', note: '</script><script>alert(1)</script>' }));
  assert.deepEqual(checkPack(closing), []);
  assert.throws(() => packScript([closing]), /odd-rule's code contains "<\/script"/);
  assert.throws(
    () => buildBrowserBundle({ packs: [closing] }),
    /odd-rule's code contains "<\/script"/
  );
});

test('the script names its packs as data, and nothing in the data ends it', () => {
  const script = packScript([acme]);
  assert.match(
    script.split('\n')[0],
    /^\/\/ Packs for @surea11y\/core in a page: \["@acme\/page@1\.0\.0"\]\.$/
  );
  assert.doesNotMatch(script, /<\/script/i);
});
