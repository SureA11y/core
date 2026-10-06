'use strict';

/**
 * Every rule reads an element's role the way browsers do (#91): the role
 * attribute is a fallback list, the first token naming a known role wins,
 * and tokens are matched in any case. So prefixing every role in a page with
 * a token no browser knows, or writing every role in upper case, must not
 * change any rule's result.
 *
 * Runs every fixture that has a role attribute through runDomRulesInPage
 * three times: as written, with each role="x" as role="zzunknown x", and
 * with each role="x" as role="X".
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const FIXTURES = path.join(__dirname, 'fixtures');

function scan(html) {
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  const prevWindow = global.window;
  const prevDocument = global.document;
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    const { runDomRulesInPage } = require('../src/core.js');
    const result = runDomRulesInPage('https://example.test/', null, {}, null);
    // A selector may carry the role itself ([role="x"]); only where it
    // points matters here.
    const norm = (s) => String(s || '').replace(/\[role[^\]]*\]/gi, '[role]');
    const out = {};
    for (const c of result.checksResults) {
      const occurrences = (c.occurrences || []).map(
        (o) => `${o.outcome || ''} ${norm(o.selector)}`
      );
      out[c.ruleId] = `${c.outcome}${c.error ? ' error' : ''} ${occurrences.sort().join('|')}`;
    }
    return out;
  } finally {
    dom.window.close();
    global.window = prevWindow;
    global.document = prevDocument;
  }
}

function rewriteRoles(html, rewrite) {
  return html.replace(/(\srole\s*=\s*)(["'])([^"']*)\2/gi, (m, pre, q, value) =>
    value.trim() ? `${pre}${q}${rewrite(value)}${q}` : m
  );
}

const files = fs
  .readdirSync(FIXTURES)
  .filter((f) => f.endsWith('.html'))
  .filter((f) => /\srole\s*=/i.test(fs.readFileSync(path.join(FIXTURES, f), 'utf8')));

// Each fixture's own result, shared by both tests.
const baseByFile = new Map();
function baseOf(f, html) {
  if (!baseByFile.has(f)) baseByFile.set(f, scan(html));
  return baseByFile.get(f);
}

for (const [label, rewrite] of [
  ['an unknown leading role token', (v) => `zzunknown ${v}`],
  ['roles in upper case', (v) => v.toUpperCase()]
]) {
  test(`${label} changes no rule's result`, () => {
    const changed = [];
    for (const f of files) {
      const html = fs.readFileSync(path.join(FIXTURES, f), 'utf8');
      const base = baseOf(f, html);
      const variant = scan(rewriteRoles(html, rewrite));
      for (const ruleId of Object.keys(base)) {
        if (base[ruleId] !== variant[ruleId]) changed.push(`${f}: ${ruleId}`);
      }
    }
    assert.deepEqual(changed, []);
  });
}
