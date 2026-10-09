'use strict';
// Shared helpers for the pack probes: scan HTML in jsdom through the public
// Node entry point, with packs.
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const { JSDOM } = require(path.join(ROOT, 'node_modules/jsdom'));
const main = require(path.join(ROOT, 'src/index.js'));
const packApi = require(path.join(ROOT, 'src/pack.js'));

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<img src="a.png"><a href="/x">click here</a>' +
  '<p style="color:#767676;background:#fff">Grey text</p></main></body></html>';

function scan(engineOptions, { html = PAGE, runOnly, impl = main } = {}) {
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    return impl.runDomRulesInPage(
      'https://example.test/',
      null,
      { timestamp: '2026-10-09T00:00:00.000Z', ...engineOptions },
      runOnly
    );
  } finally {
    dom.window.close();
  }
}

// Captures console.warn while fn runs.
function quiet(fn) {
  const w = console.warn;
  const out = [];
  console.warn = (...a) => out.push(a.join(' '));
  try {
    const r = fn();
    return { r, warnings: out };
  } catch (e) {
    return { error: e, warnings: out };
  } finally {
    console.warn = w;
  }
}

const base = (over = {}) => ({ name: 'p', version: '1.0.0', namespace: 'p', core: '*', ...over });
const rule = (id, extra = {}) => ({
  id,
  meta: { title: id, tags: [], ...(extra.meta || {}) },
  runInPage: extra.runInPage || (() => ({ outcome: 'pass' })),
  ...(extra.from ? { from: extra.from } : {})
});
const outcome = (res, id) => {
  const c = (res.checksResults || []).find((x) => x.ruleId === id);
  return c ? c.outcome : undefined;
};
const rollup = (res, id) => (res.rulesResults || []).find((x) => x.ruleId === id);

// Strips run-dependent fields for comparison.
function strip(res) {
  return JSON.parse(
    JSON.stringify(res, (k, v) =>
      ['durationMs', 'duration', 'timings', 'ruleTimings', 'startedAt', 'endedAt', 'elapsedMs', 'perfStats'].includes(k)
        ? undefined
        : v
    )
  );
}

function report(name, value) {
  console.log(`--- ${name}`);
  console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 1));
}

module.exports = { ROOT, JSDOM, main, packApi, scan, quiet, base, rule, outcome, rollup, strip, report, PAGE };
