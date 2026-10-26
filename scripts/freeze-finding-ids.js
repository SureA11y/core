#!/usr/bin/env node
'use strict';

/**
 * Freezes the finding identities a release ships, in
 * scripts/data/released-finding-ids.json: every rule id and reason code in
 * the inventories (core's scripts/data/finding-ids.json and each profile's),
 * under the version being released. tests/released-finding-ids.test.js then
 * holds every later commit to them: what a release published stays, or is
 * listed under `retired` with the reason it went (docs/API_STABILITY.md,
 * "Finding identity").
 *
 * Run it as part of a release, after npm run finding-ids:
 *
 *   npm run finding-ids:release -- 1.8.0
 *
 * The retired list starts empty again: what it held was not in the release.
 * So do the identity moves of src/baseline-moves.json from before this minor
 * release: a move lets a baseline from the minor release before it match,
 * and is dropped at the next one (docs/BASELINE.md, "Upgrading").
 */

const fs = require('fs');
const path = require('path');

const { ruleSources } = require('./lib/rule-dirs');

const OUT_FILE = path.join(__dirname, 'data', 'released-finding-ids.json');
const MOVES_FILE = path.join(__dirname, '..', 'src', 'baseline-moves.json');

// "1.14.0" or "1.14" -> [1, 14]
const minorOf = (version) => String(version).split('.').slice(0, 2).map(Number);
const olderMinor = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);

// Drops the moves that shipped in a minor release before `version`.
function retireMoves(version) {
  const table = JSON.parse(fs.readFileSync(MOVES_FILE, 'utf8'));
  const current = minorOf(version);
  const kept = table.moves.filter((m) => !olderMinor(minorOf(m.since), current));
  if (kept.length === table.moves.length) return 0;
  fs.writeFileSync(MOVES_FILE, `${JSON.stringify({ ...table, moves: kept }, null, 2)}\n`, 'utf8');
  return table.moves.length - kept.length;
}

function main() {
  const version = process.argv[2];
  if (!/^\d+\.\d+\.\d+$/.test(version || '')) {
    console.error('Usage: npm run finding-ids:release -- <version>, such as 1.8.0');
    process.exitCode = 2;
    return;
  }

  const inventories = ruleSources().map((src) =>
    JSON.parse(fs.readFileSync(path.join(src.dataDir, 'finding-ids.json'), 'utf8'))
  );
  const ruleIds = inventories.flatMap((inv) => inv.ruleIds).sort();
  const merged = Object.assign({}, ...inventories.map((inv) => inv.reasonCodes));
  const reasonCodes = Object.fromEntries(
    Object.keys(merged)
      .sort()
      .map((id) => [id, merged[id]])
  );

  const out = {
    $comment:
      'Written by scripts/freeze-finding-ids.js at each release: the rule ids and reason codes that version shipped. tests/released-finding-ids.test.js fails when one is missing and not listed under retired with its reason. See docs/API_STABILITY.md, "Finding identity".',
    version,
    ruleIds,
    reasonCodes,
    retired: { ruleIds: {}, reasonCodes: {} }
  };
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  const dropped = retireMoves(version);
  if (dropped) {
    console.log(
      `[finding-ids:release] dropped ${dropped} identity moves from before ${version} in ${path.relative(process.cwd(), MOVES_FILE)}`
    );
  }
  console.log(
    `[finding-ids:release] froze ${ruleIds.length} rule ids for ${version} in ${path.relative(process.cwd(), OUT_FILE)}`
  );
}

main();
