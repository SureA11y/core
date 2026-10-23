'use strict';
// Shared helpers for the options/outputs probes. Scans in jsdom with the
// current checkout (default) or another core directory (OLD_CORE env var or
// the `coreDir` argument), capturing console output.
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..');
const { JSDOM } = require(path.join(ROOT, 'node_modules/jsdom'));
const OLD_CORE =
  process.env.OLD_CORE ||
  path.resolve(ROOT, '../surea11y.dev/node_modules/@surea11y/core'); // 1.10.0 from npm

function load(coreDir = ROOT) {
  const main = require(path.join(coreDir, 'src/index.js'));
  const sub = (n) => require(path.join(coreDir, 'src', n + '.js'));
  return { main, sub, dir: coreDir };
}

function setDom(html, url = 'https://example.test/') {
  const dom = new JSDOM(html, { url, contentType: 'text/html', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  return dom;
}

// Captures console.warn/info/log/error during fn().
function capture(fn) {
  const logs = [];
  const orig = {};
  for (const k of ['warn', 'info', 'log', 'error']) {
    orig[k] = console[k];
    console[k] = (...a) => logs.push(k + ': ' + a.map(String).join(' '));
  }
  let value, error;
  try {
    value = fn();
  } catch (e) {
    error = e;
  } finally {
    for (const k of Object.keys(orig)) console[k] = orig[k];
  }
  return { value, error, logs };
}

function scan(html, { contextSelector = null, engineOptions = {}, runOnly = null, coreDir, entry = 'runDomRulesInPage', url } = {}) {
  const { main } = load(coreDir);
  setDom(html, url);
  return capture(() => main[entry](url || 'https://example.test/', contextSelector, engineOptions, runOnly));
}

function fixture(name) {
  return fs.readFileSync(path.join(ROOT, 'tests/fixtures', name), 'utf8');
}

function summary(result) {
  const o = {};
  for (const c of result.checksResults) o[c.ruleId] = c.outcome + (c.occurrences ? '/' + c.occurrences.length : '');
  return o;
}

module.exports = { ROOT, OLD_CORE, load, setDom, capture, scan, fixture, summary, JSDOM };
