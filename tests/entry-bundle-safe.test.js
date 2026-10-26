'use strict';

/**
 * The main entry (`@surea11y/core`) is bundled for browsers: a Cypress spec
 * imports it through webpack. Every file it reaches through plain `require`
 * calls must need nothing outside core, or such a build fails ("Reading from
 * "node:vm" is not handled"). src/pack.js prepares packs with Node's fs and
 * vm, so the entry loads it through Node's own require when packs are passed.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function reached(entry) {
  const seen = new Set();
  const outside = [];
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const source = fs.readFileSync(file, 'utf8');
    for (const m of source.matchAll(/\brequire\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const id = m[1];
      if (!id.startsWith('.')) {
        outside.push(`${path.relative(ROOT, file)} requires ${id}`);
        continue;
      }
      let target = path.resolve(path.dirname(file), id);
      if (!/\.js(on)?$/.test(target)) {
        target = fs.existsSync(target + '.js') ? target + '.js' : path.join(target, 'index.js');
      }
      if (target.endsWith('.js')) visit(target);
    }
  };
  visit(entry);
  return { seen, outside };
}

test('the main entry reaches no module outside core, so a browser bundle of it builds', () => {
  const { seen, outside } = reached(path.join(ROOT, 'src', 'index.js'));
  assert.deepEqual(outside, []);
  assert.ok(!seen.has(path.join(ROOT, 'src', 'pack.js')), 'src/pack.js is reached');
});

test('a scan with packs still loads them in Node', () => {
  const main = require('../src/index.js');
  const { definePack } = require('../src/pack.js');
  const pack = definePack({ name: 'entry-pack', version: '1.0.0', namespace: 'entry', core: '*' });
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><p>x</p></body></html>',
    {
      url: 'https://example.test/',
      pretendToBeVisual: true
    }
  );
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    const r = main.runDomRulesInPage('https://example.test/', null, { packs: [pack] }, null);
    assert.deepEqual(r.engine.packs, ['entry-pack@1.0.0']);
  } finally {
    dom.window.close();
  }
});

// @surea11y/core/how-to-check is the steps' path for a binding whose code
// runs in a browser: it reaches nothing outside core, not even Node's fs.
test('the how-to-check entry reaches no module outside core', () => {
  const { seen, outside } = reached(path.join(ROOT, 'src', 'how-to-check-core.js'));
  assert.deepEqual(outside, []);
  assert.deepEqual(
    [...seen].sort(),
    [
      path.join(ROOT, 'src', 'how-to-check-core.js'),
      path.join(ROOT, 'src', 'occurrence-outcome.js')
    ].sort()
  );
});

// Bundled for a browser, as a Cypress spec is, the main entry builds. A scan
// through it is silent about steps it can't add; asked for steps by name it
// warns once that it has none, and the how-to-check entry with an imported
// dictionary adds them.
test('in a browser bundle, addHowToCheck warns once and the how-to-check entry adds the steps', () => {
  const esbuild = require('esbuild');
  const { JSDOM } = require('jsdom');
  const app = esbuild.buildSync({
    stdin: {
      contents: [
        "const core = require('@surea11y/core');",
        "const { applyHowToCheck } = require('@surea11y/core/how-to-check');",
        "const en = require('@surea11y/core/review/en');",
        "const raw = core.runDomRulesInPage(null, null, null, ['td-has-header']);",
        'window.__warnedAfterScan = window.__warnings.length;',
        'const a = core.addHowToCheck(raw);',
        'const b = core.addHowToCheck(raw);',
        "window.__out = { raw, a, b, how: core.howToCheckFor('td-has-header', 'TD_TABLE_NO_HEADERS'),",
        '  applied: applyHowToCheck(raw, { en }) };'
      ].join('\n'),
      resolveDir: ROOT,
      loader: 'js'
    },
    bundle: true,
    platform: 'browser',
    format: 'iife',
    write: false,
    logLevel: 'silent'
  }).outputFiles[0].text;
  assert.ok(!app.includes('readFileSync'), 'the bundle carries Node file reads');
  const dom = new JSDOM(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><table>' +
      '<tr><td>1</td><td>2</td><td>3</td><td>4</td></tr>'.repeat(4) +
      '</table></main></body></html>',
    { url: 'https://example.test/', pretendToBeVisual: true, runScripts: 'outside-only' }
  );
  try {
    const warnings = [];
    dom.window.__warnings = warnings;
    dom.window.console.warn = (m) => warnings.push(String(m));
    dom.window.eval(app);
    const out = dom.window.__out;
    assert.equal(out.raw.checksResults[0].outcome, 'cantTell');
    assert.equal(out.raw.checksResults[0].occurrences[0].howToCheck, undefined);
    assert.equal(dom.window.__warnedAfterScan, 0, warnings.join('\n'));
    assert.equal(out.a, out.raw);
    assert.equal(out.b, out.raw);
    assert.equal(out.how, null);
    // Once for the three calls, naming the first.
    const steps = warnings.filter((w) => /adds no steps/.test(w));
    assert.equal(steps.length, 1, warnings.join('\n'));
    assert.match(steps[0], /^\[surea11y\] addHowToCheck .*@surea11y\/core\/how-to-check/);
    assert.equal(
      out.applied.checksResults[0].occurrences[0].howToCheck.steps[0],
      'Look at the table the report names on screen.'
    );
  } finally {
    dom.window.close();
  }
});
