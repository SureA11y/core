'use strict';

// A pack's or a caller's rule can't change what core's rules find: it runs
// after them, and the helpers, options and probes it is given are read-only.
// A rule that changes the page is named in a warning. Results keep the
// catalog's order. In Node, and in a page with the pack registered.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const main = require('../src/index.js');
const { definePack, packScript } = require('../src/pack.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<img src="a.png"><img src="b.png"><a href="/x"></a></main></body></html>';

// Rules whose ids sort before core's, so they would run first.
const hijack = {
  id: 'aaa-hijack',
  meta: { title: 'Replaces helpers' },
  runInPage(ctx) {
    ctx.helpers.queryAllSmart = () => [];
    return { outcome: 'pass', occurrences: [] };
  }
};
const nested = {
  id: 'aab-nested',
  meta: { title: 'Changes nested helpers and options' },
  runInPage(ctx) {
    ctx.engineOptions.contrast.mode = 'auditorAssist';
    return { outcome: 'pass', occurrences: [] };
  }
};
const zap = {
  id: 'aac-zap',
  meta: { title: 'Removes the images' },
  runInPage(ctx) {
    for (const img of Array.from(ctx.document.querySelectorAll('img'))) img.remove();
    return { outcome: 'pass', occurrences: [] };
  }
};

function scan(run, engineOptions) {
  const dom = new JSDOM(PAGE, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  const warn = console.warn;
  const warnings = [];
  console.warn = (m) => warnings.push(String(m));
  try {
    const result = run('https://example.test/', null, {
      timestamp: '2026-10-10T00:00:00.000Z',
      ...engineOptions
    });
    return { result, warnings };
  } finally {
    console.warn = warn;
    dom.window.close();
  }
}

const outcome = (result, id) => {
  const c = result.checksResults.find((x) => x.ruleId === id);
  return `${c.outcome}/${c.occurrences.length}`;
};

test("a custom rule can't change what core's rules find", () => {
  const plain = scan(main.runDomRulesInPage, {}).result;
  const { result, warnings } = scan(main.runDomRulesInPage, {
    customRules: [hijack, nested, zap]
  });
  for (const id of ['img-alt-present', 'link-name-present']) {
    assert.equal(outcome(result, id), outcome(plain, id), id);
  }
  assert.equal(outcome(plain, 'img-alt-present'), 'fail/2');
  const own = (id) => result.checksResults.find((c) => c.ruleId === id);
  assert.equal(own('aaa-hijack').outcome, 'cantTell');
  assert.match(own('aaa-hijack').error, /Cannot change "queryAllSmart": .*read-only/);
  assert.match(own('aab-nested').error, /Cannot change "mode"/);
  assert.equal(own('aac-zap').outcome, 'pass');
  assert.ok(warnings.some((w) => /Rule "aac-zap" changed the page while it ran/.test(w)));
  // The options the results echo are the scan's.
  assert.equal(own('aac-zap').engineOptions.contrast.mode, 'strictConformance');
  assert.doesNotThrow(() => structuredClone(result));
});

const pack = definePack({
  name: '@aaa/hostile',
  version: '1.0.0',
  namespace: 'aaa',
  core: '*',
  rules: [hijack, { ...zap, id: 'aaa-zap' }]
});

test("a pack's rule can't change what core's rules find, in Node and in a page", () => {
  const plain = scan(main.runDomRulesInPage, {}).result;
  const node = scan(main.runDomRulesInPage, { packs: [pack] });
  new Function(packScript([pack]))();
  let inPage;
  try {
    inPage = scan(main.runa11yCoreInPage, { packs: ['@aaa/hostile@1.0.0'] });
  } finally {
    delete globalThis.__surea11yPacks;
  }
  for (const { result, warnings } of [node, inPage]) {
    assert.deepEqual(result.engine.packs, ['@aaa/hostile@1.0.0']);
    for (const id of ['img-alt-present', 'link-name-present']) {
      assert.equal(outcome(result, id), outcome(plain, id), id);
    }
    assert.match(result.checksResults.find((c) => c.ruleId === 'aaa-hijack').error, /read-only/);
    assert.ok(warnings.some((w) => /Rule "aaa-zap" changed the page/.test(w)));
    // Results keep the catalog's order: the pack's rules sort first.
    const ids = result.checksResults.map((c) => c.ruleId);
    assert.deepEqual(ids.slice(0, 2), ['aaa-hijack', 'aaa-zap']);
  }
  assert.deepEqual(inPage.result, node.result);
});

test('a rule that only reads runs as before, with no warning', () => {
  const reader = {
    id: 'aaa-reader',
    meta: { title: 'Reads' },
    runInPage(ctx) {
      const imgs = ctx.helpers.queryAllSmart('img');
      const mode = ctx.engineOptions.contrast.mode;
      return {
        outcome: imgs.length === 2 && mode === 'strictConformance' ? 'pass' : 'fail',
        occurrences: []
      };
    }
  };
  const { result, warnings } = scan(main.runDomRulesInPage, { customRules: [reader] });
  assert.equal(result.checksResults.find((c) => c.ruleId === 'aaa-reader').outcome, 'pass');
  assert.ok(!warnings.some((w) => /changed the page/.test(w)));
});

test("a rule calling a helper that adds and removes a probe isn't said to change the page", () => {
  const colors = {
    id: 'aaa-colors',
    meta: { title: 'Parses colors' },
    runInPage(ctx) {
      const rgba = ctx.helpers.contrast.parseCssColorToRgba('rebeccapurple');
      return { outcome: rgba ? 'pass' : 'fail', occurrences: [] };
    }
  };
  const { result, warnings } = scan(main.runDomRulesInPage, { customRules: [colors] });
  assert.equal(result.checksResults.find((c) => c.ruleId === 'aaa-colors').outcome, 'pass');
  assert.ok(!warnings.some((w) => /changed the page/.test(w)), warnings.join('\n'));
});
