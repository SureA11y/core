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
