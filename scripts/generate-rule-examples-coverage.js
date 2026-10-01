/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Track which rules docs/RULE_EXAMPLES.md covers, so a new or renamed rule
 * can't silently ship without a matching example. Core's rules are in core's
 * docs/RULE_EXAMPLES.md, with their baseline in scripts/data/; a profile's in
 * the same places under its folder (scripts/lib/rule-dirs.js ruleSources).
 * RULE_EXAMPLES.md is
 * hand-authored -- unlike RULE_CATALOG.md, there's nothing to regenerate and
 * diff -- so this only checks coverage (every current rule id has a section)
 * against scripts/data/rule-examples-coverage.json, a baseline of known gaps
 * that can only shrink: resolving a gap without updating the baseline fails
 * the build too, the same way scripts/generate-fixture-markers.js works.
 *
 * Usage:
 *   npm run build && node scripts/generate-rule-examples-coverage.js          # rewrite the baseline
 *   npm run build && node scripts/generate-rule-examples-coverage.js --check  # fail if it's stale
 */

const fs = require('node:fs');
const path = require('node:path');

const { ruleSources, ruleIdsOf } = require('./lib/rule-dirs');

function parseArgs(argv) {
  return { check: argv.slice(2).includes('--check') };
}

function readDocumentedRuleIds(examplesFile) {
  if (!fs.existsSync(examplesFile)) return new Set();
  const source = fs.readFileSync(examplesFile, 'utf8');
  const ids = new Set();
  const re = /^## (\S+)$/gm;
  let m;
  while ((m = re.exec(source)) !== null) ids.add(m[1]);
  return ids;
}

function describeList(label, ids) {
  const lines = [`${ids.length} ${label}:`];
  for (const id of ids) lines.push(`  ${id}`);
  return lines;
}

// One source's gaps, and whether its baseline records them: lines describing
// any drift, empty when it is current.
function checkSource(repoRoot, examplesFile, outPath, fresh) {
  const shownDoc = path.relative(repoRoot, examplesFile);
  const shownOut = path.relative(repoRoot, outPath);
  if (!fs.existsSync(outPath)) {
    return [`${shownOut} is missing -- run \`npm run rule-examples:coverage\``];
  }
  const committed = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  const { missing, stale } = fresh;

  const newlyMissing = missing.filter((id) => !committed.missing.includes(id));
  const resolvedMissing = committed.missing.filter((id) => !missing.includes(id));
  const newlyStale = stale.filter((id) => !committed.stale.includes(id));
  const resolvedStale = committed.stale.filter((id) => !stale.includes(id));

  const lines = [];
  if (newlyMissing.length)
    lines.push(...describeList(`rule(s) have no ${shownDoc} section`, newlyMissing));
  if (resolvedMissing.length)
    lines.push(...describeList('rule(s) recorded as missing now have a section', resolvedMissing));
  if (newlyStale.length)
    lines.push(...describeList(`${shownDoc} section(s) that don't match its rule ids`, newlyStale));
  if (resolvedStale.length)
    lines.push(...describeList('recorded stale section(s) that are gone', resolvedStale));
  return lines;
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = path.resolve(__dirname, '..');

  const core = require(path.join(repoRoot, 'src/core.js'));
  const catalogIds = core
    .getChecksCatalog()
    .map((r) => r.ruleId)
    .sort();

  // A profile documents its own rules; core, every other rule in the catalog.
  const sources = ruleSources();
  const owned = new Map();
  for (const src of sources.slice(1)) for (const id of ruleIdsOf(src)) owned.set(id, src.key);

  const problems = [];
  let gaps = 0;
  let staleCount = 0;
  for (const src of sources) {
    const ids = catalogIds.filter((id) => (owned.get(id) || 'core') === src.key);
    const examplesFile = path.join(src.docsDir, 'RULE_EXAMPLES.md');
    const outPath = path.join(src.dataDir, 'rule-examples-coverage.json');
    const documented = readDocumentedRuleIds(examplesFile);

    const missing = ids.filter((id) => !documented.has(id));
    const stale = [...documented].filter((id) => !ids.includes(id)).sort();
    const fresh = { missing, stale };
    gaps += missing.length;
    staleCount += stale.length;

    if (args.check) {
      problems.push(...checkSource(repoRoot, examplesFile, outPath, fresh));
      continue;
    }

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(fresh, null, 2) + '\n');
    console.log(
      `[rule-examples-coverage] wrote ${path.relative(repoRoot, outPath)} (${missing.length} missing, ${stale.length} stale)`
    );
  }

  if (!args.check) return;
  if (problems.length) {
    problems.push(
      'Add the missing example(s), remove the stale one(s), or run `npm run rule-examples:coverage` to update the baseline if the gap is deliberate.'
    );
    console.error(`[rule-examples-coverage] ${problems.join('\n')}`);
    process.exit(1);
  }
  console.log(
    `[rule-examples-coverage] ${gaps} known gap(s), ${staleCount} known stale section(s), baselines are current.`
  );
}

main();
