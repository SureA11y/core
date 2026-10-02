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
 */

const fs = require('fs');
const path = require('path');

const { ruleSources } = require('./lib/rule-dirs');

const OUT_FILE = path.join(__dirname, 'data', 'released-finding-ids.json');

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
  console.log(
    `[finding-ids:release] froze ${ruleIds.length} rule ids for ${version} in ${path.relative(process.cwd(), OUT_FILE)}`
  );
}

main();
