#!/usr/bin/env node
'use strict';

/**
 * Generates scripts/data/finding-ids.json, the inventory of identities a
 * consumer can hold onto: every rule id, and every reasonCode each rule ships.
 *
 * Those two make up the finding fingerprint (src/baseline.js's
 * computeBaselineKey, re-used as SARIF partialFingerprints), so one changing
 * silently breaks a stored baseline and makes a Code Scanning alert close and
 * reopen as new. tests/finding-ids.test.js compares this file against a fresh
 * generation and fails when a shipped identity disappears.
 *
 * Reason codes come from two passes, because neither alone is complete:
 * running each rule against its own fixture catches the ones built at runtime,
 * and reading the source catches the branches a fixture never reaches.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const { runDomRulesInPage, getChecksCatalog } = require('../src/index.js');

const ROOT = path.join(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'scripts', 'data', 'finding-ids.json');
const CHECKS_DIR = path.join(ROOT, 'src', 'checks');

function ruleSourceFiles() {
  return fs
    .readdirSync(CHECKS_DIR)
    .flatMap((entry) => {
      const full = path.join(CHECKS_DIR, entry);
      if (!fs.statSync(full).isDirectory()) return [];
      return fs
        .readdirSync(full)
        .filter((f) => f.endsWith('.js'))
        .map((f) => path.join(full, f));
    })
    .sort();
}

function codesFromSource(file) {
  const src = fs.readFileSync(file, 'utf8');
  const codes = new Set();

  // The value is not always a bare literal: several rules pick between two with
  // a ternary. Walk to the comma or brace that ends the property, tracking
  // quotes and nesting, then take every string inside it -- a fixed-size window
  // runs on into the next expression and picks up its strings.
  const re = /\breasonCode\s*:/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    let i = m.index + m[0].length;
    let depth = 0;
    let quote = '';
    const value = [];
    for (; i < src.length; i++) {
      const ch = src[i];
      if (quote) {
        if (ch === '\\') {
          value.push(ch, src[++i]);
          continue;
        }
        if (ch === quote) quote = '';
        value.push(ch);
        continue;
      }
      if (ch === "'" || ch === '"') {
        quote = ch;
        value.push(ch);
        continue;
      }
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') {
        if (depth === 0) break;
        depth--;
      } else if (ch === ',' && depth === 0) break;
      value.push(ch);
    }

    const lit = /(['"])([A-Za-z][\w.-]*)\1/g;
    let l;
    while ((l = lit.exec(value.join(''))) !== null) codes.add(l[2]);
  }
  return codes;
}

function codesFromFixture(ruleId, fixtureFile) {
  const html = fs.readFileSync(path.join(ROOT, fixtureFile), 'utf8');
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;

  const codes = new Set();
  try {
    const result = runDomRulesInPage(
      'https://example.test/',
      null,
      {},
      { includeRuleIds: [ruleId] }
    );
    const check = (result.checksResults || []).find((r) => r.ruleId === ruleId);
    for (const occ of (check && check.occurrences) || []) {
      const code = occ && occ.data && occ.data.details && occ.data.details.reasonCode;
      if (typeof code === 'string' && code) codes.add(code);
    }
  } finally {
    dom.window.close();
  }
  return codes;
}

function main() {
  const catalog = getChecksCatalog();
  const catalogIds = catalog.map((r) => r.ruleId).sort();

  // A rule id is the file's own registered id, not its filename: the two have
  // already drifted apart once (role-img-text-alternative-present).
  const idByFile = new Map();
  for (const file of ruleSourceFiles()) {
    try {
      const mod = require(file);
      if (mod && typeof mod.id === 'string') idByFile.set(file, mod.id);
    } catch {
      // A module that will not load is the rule validator's problem, not this one.
    }
  }

  const codesByRule = new Map();
  const add = (ruleId, codes) => {
    if (!ruleId) return;
    const target = codesByRule.get(ruleId) || new Set();
    for (const c of codes) target.add(c);
    codesByRule.set(ruleId, target);
  };

  for (const [file, ruleId] of idByFile) add(ruleId, codesFromSource(file));

  const fixturesIndex = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'index.json'), 'utf8')
  );
  for (const row of fixturesIndex.rows.filter((r) => r.fixtureFile)) {
    try {
      add(row.ruleId, codesFromFixture(row.ruleId, row.fixtureFile));
    } catch (e) {
      console.error(`[finding-ids] ${row.ruleId}: fixture pass failed (${e.message})`);
    }
  }

  // A deprecated rule may have stopped emitting its codes -- iframe-title-unique
  // reports notApplicable on every page -- but the inventory records what was
  // shipped, not what is still produced, and a code's promise ends only when
  // the rule file is removed (docs/API_STABILITY.md). Carry its committed
  // codes forward until then, so retiring a check is not read as breaking one.
  if (fs.existsSync(OUT_FILE)) {
    const committed = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
    const committedCodes = (committed && committed.reasonCodes) || {};
    for (const r of catalog) {
      if (r.deprecated && Array.isArray(committedCodes[r.ruleId])) {
        add(r.ruleId, committedCodes[r.ruleId]);
      }
    }
  }

  const reasonCodes = {};
  for (const ruleId of [...codesByRule.keys()].sort()) {
    const codes = [...codesByRule.get(ruleId)].sort();
    if (codes.length) reasonCodes[ruleId] = codes;
  }

  const out = {
    $comment:
      'Generated by scripts/generate-finding-ids.js. The identities a consumer holds: rule ids and the reason codes that, with the occurrence html, form a finding fingerprint. Removing an entry is a breaking change -- see docs/API_STABILITY.md.',
    ruleIds: catalogIds,
    reasonCodes
  };

  fs.writeFileSync(OUT_FILE, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  const codeCount = Object.values(reasonCodes).reduce((n, c) => n + c.length, 0);
  console.log(
    `[finding-ids] wrote ${path.relative(ROOT, OUT_FILE)} (${catalogIds.length} rule ids, ${codeCount} reason codes across ${Object.keys(reasonCodes).length} rules)`
  );
}

main();
