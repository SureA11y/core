#!/usr/bin/env node
'use strict';

/**
 * Generates scripts/data/finding-ids.json, the inventory of identities a
 * consumer can hold onto: every rule id, and every reasonCode each rule ships.
 * It holds core's rules; each profile's are in its own scripts/data/
 * finding-ids.json (scripts/lib/rule-dirs.js ruleSources).
 *
 * Those two make up the finding fingerprint (src/baseline.js's
 * computeBaselineKey, re-used as SARIF partialFingerprints), so one changing
 * silently breaks a stored baseline and makes a Code Scanning alert close and
 * reopen as new. tests/finding-ids.test.js compares this file against a fresh
 * generation and fails when a shipped identity disappears.
 *
 * Reason codes come from two passes, because neither alone is complete:
 * running each rule against its own fixture catches the ones built at runtime,
 * and reading the source catches the branches a fixture never reaches. A code
 * that is built at runtime on a branch only a browser reaches is in neither,
 * so a rule lists those in meta.reasonCodes, which is added too.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const { runDomRulesInPage, getChecksCatalog } = require('../src/index.js');
const { ruleDirs, ruleSources, ruleIdsOf } = require('./lib/rule-dirs');

const ROOT = path.join(__dirname, '..');

function ruleSourceFiles() {
  return ruleDirs()
    .flatMap((dir) => fs.readdirSync(dir).map((entry) => path.join(dir, entry)))
    .flatMap((full) => {
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

function codesFromFixture(ruleId, fixturePath) {
  const html = fs.readFileSync(fixturePath, 'utf8');
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
  const catalogIds = getChecksCatalog()
    .map((r) => r.ruleId)
    .sort();

  // A rule id is the file's own registered id, not its filename: the two have
  // already drifted apart once (role-img-text-alternative-present).
  const idByFile = new Map();
  const fromById = new Map();
  const declaredById = new Map();
  for (const file of ruleSourceFiles()) {
    try {
      const mod = require(file);
      if (mod && typeof mod.id === 'string') idByFile.set(file, mod.id);
      // A variant runs its base rule's code, so its codes are in the base's source.
      if (mod && typeof mod.from === 'string') fromById.set(mod.id, mod.from);
      // Codes a rule builds at runtime, which neither pass can be sure to see:
      // reached only in a browser, or passed through a variable.
      if (mod && mod.meta && Array.isArray(mod.meta.reasonCodes)) {
        declaredById.set(mod.id, mod.meta.reasonCodes.map(String));
      }
    } catch {
      // A module that will not load is the rule validator's problem, not this one.
    }
  }
  const fileById = new Map([...idByFile].map(([file, id]) => [id, file]));

  const codesByRule = new Map();
  const add = (ruleId, codes) => {
    if (!ruleId) return;
    const target = codesByRule.get(ruleId) || new Set();
    for (const c of codes) target.add(c);
    codesByRule.set(ruleId, target);
  };

  for (const [file, ruleId] of idByFile) {
    const base = fromById.has(ruleId) ? fileById.get(fromById.get(ruleId)) : null;
    add(ruleId, codesFromSource(base || file));
  }
  for (const [ruleId, codes] of declaredById) add(ruleId, codes);

  const sources = ruleSources();
  for (const src of sources) {
    const indexFile = path.join(src.fixturesDir, 'index.json');
    if (!fs.existsSync(indexFile)) continue;
    const fixturesIndex = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
    for (const row of fixturesIndex.rows.filter((r) => r.fixtureFile)) {
      try {
        add(row.ruleId, codesFromFixture(row.ruleId, path.join(src.root, row.fixtureFile)));
      } catch (e) {
        console.error(`[finding-ids] ${row.ruleId}: fixture pass failed (${e.message})`);
      }
    }
  }

  // Each source's inventory holds its own rules; core's also any rule the
  // catalog has that no rules folder holds.
  const owned = new Set();
  const idsBySource = sources.map((src) => {
    const ids = ruleIdsOf(src);
    if (src.key !== 'core') for (const id of ids) owned.add(id);
    return ids;
  });

  sources.forEach((src, i) => {
    const ruleIds = catalogIds.filter((id) =>
      src.key === 'core' ? !owned.has(id) : idsBySource[i].has(id)
    );
    const reasonCodes = {};
    for (const ruleId of ruleIds) {
      const codes = [...(codesByRule.get(ruleId) || [])].sort();
      if (codes.length) reasonCodes[ruleId] = codes;
    }

    const out = {
      $comment:
        'Generated by scripts/generate-finding-ids.js. The identities a consumer holds: rule ids and the reason codes that, with the occurrence html, form a finding fingerprint. Removing an entry is a breaking change -- see docs/API_STABILITY.md.',
      ruleIds,
      reasonCodes
    };

    const outFile = path.join(src.dataDir, 'finding-ids.json');
    fs.mkdirSync(src.dataDir, { recursive: true });
    fs.writeFileSync(outFile, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
    const codeCount = Object.values(reasonCodes).reduce((n, c) => n + c.length, 0);
    console.log(
      `[finding-ids] wrote ${path.relative(ROOT, outFile)} (${ruleIds.length} rule ids, ${codeCount} reason codes across ${Object.keys(reasonCodes).length} rules)`
    );
  });
}

main();
