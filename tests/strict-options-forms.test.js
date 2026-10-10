'use strict';

/**
 * strictOptions as a command line or an environment variable spells it:
 * 'true', '1' and 1 turn it on, as true does; 'false', '0', 0 and '' leave it
 * off. 'true' or 1 used to read as off without a word, so a pipeline that
 * meant to be strict wasn't. Any other value is read as off, with a warning.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const main = require('../src/index.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>x</p></main></body></html>';

function quiet(fn) {
  const warnings = [];
  const warn = console.warn;
  console.warn = (m) => warnings.push(String(m));
  try {
    return { value: fn(), warnings };
  } catch (error) {
    return { error, warnings };
  } finally {
    console.warn = warn;
  }
}

// A typo in the options: thrown under strictOptions, warned about without.
const scanInPage = (strictOptions) =>
  quiet(() =>
    runa11yCoreOnHtml(HTML, {
      engineOptions: { strictOptions, lcoale: 'de' },
      entryPointParity: false
    })
  );
const scanInNode = (strictOptions) =>
  quiet(() => {
    const dom = new JSDOM(HTML, { url: 'https://example.test/', pretendToBeVisual: true });
    global.window = dom.window;
    global.document = dom.window.document;
    try {
      return main.runDomRulesInPage('https://example.test/', null, { strictOptions, lcoale: 'de' });
    } finally {
      dom.window.close();
    }
  });

test("'true', '1' and 1 are strict, in both entry points", () => {
  for (const scan of [scanInPage, scanInNode]) {
    for (const v of [true, 'true', 'TRUE', ' true ', 1, '1']) {
      const { error } = scan(v);
      assert.equal(error && error.code, 'INVALID_ENGINE_OPTIONS', JSON.stringify(v));
    }
  }
});

test("'false', '0', 0 and '' are not, and say nothing about it", () => {
  for (const scan of [scanInPage, scanInNode]) {
    for (const v of [false, 'false', '0', 0, '']) {
      const { error, warnings } = scan(v);
      assert.equal(error, undefined, JSON.stringify(v));
      assert.ok(!warnings.some((w) => /strictOptions must be/.test(w)), JSON.stringify(v));
    }
  }
});

test('any other value is read as not strict, with a warning', () => {
  for (const v of ['yes', 'on', 2, {}]) {
    const { error, warnings } = scanInPage(v);
    assert.equal(error, undefined, JSON.stringify(v));
    assert.ok(
      warnings.some((w) =>
        w.includes(`strictOptions must be true or false, not ${JSON.stringify(v)}; read as false`)
      ),
      JSON.stringify(v)
    );
  }
});

test("packs are checked strictly under strictOptions: 'true'", () => {
  const bad = { name: 'late', version: '1.0.0', namespace: 'late', core: '^99.0.0' };
  const { error } = quiet(() => {
    const dom = new JSDOM(HTML, { url: 'https://example.test/', pretendToBeVisual: true });
    global.window = dom.window;
    global.document = dom.window.document;
    try {
      return main.runDomRulesInPage('https://example.test/', null, {
        packs: [bad],
        strictOptions: 'true'
      });
    } finally {
      dom.window.close();
    }
  });
  assert.match(error && error.message, /late: it supports core \^99\.0\.0/);
});
