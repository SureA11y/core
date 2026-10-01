/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Record the scenario-fixture cases whose PASS/FAIL/CANTTELL marker disagrees
 * with the verdict the engine returns for them (scripts/data/fixture-markers.json
 * for core's rules, and each profile's scripts/data/fixture-markers.json for
 * its own: scripts/lib/rule-dirs.js ruleSources).
 *
 * A fixture's markers are prose in a `.case-title`: the per-rule "fixture
 * coverage" tests assert which element ids a rule reports, but nothing asserts
 * the marker beside them, so a deliberate behaviour change leaves the fixture
 * claiming the old outcome. This replays every fixture and writes down the
 * cases where the two no longer agree, so the set can only shrink on purpose.
 *
 * For an element case a marker claims a tier only for the outcomes the engine
 * reports: a PASS case and a NOT-APPLICABLE case both produce no occurrence, so
 * this cannot tell those two apart; it compares whether a case is reported at
 * all, and at which tier when it is. A whole-document fixture is compared
 * against the rule-level outcome instead, where the two are distinct.
 *
 * Fixtures with no marked cases are invisible to this check. One fixture shared
 * by rules that expect different outcomes from the same case (contrast) needs a
 * per-rule marker before it can be covered.
 *
 * Usage:
 *   npm run fixtures:markers          # rewrite the record
 *   npm run fixtures:markers:check    # fail if the record is stale
 */

const fs = require('node:fs');
const path = require('node:path');

const { collect, findRepoRoot } = require('./lib/rule-review-data');
const { ruleSources, ruleIdsOf } = require('./lib/rule-dirs');

const MAX_LABEL = 120;

function parseArgs(argv) {
  return { check: argv.slice(2).includes('--check') };
}

function collectDisagreements(repoRoot) {
  const { rules } = collect({ repoRoot });
  const out = [];

  for (const rule of rules) {
    for (const c of rule.cases) {
      if (c.agrees) continue;
      out.push({
        ruleId: rule.id,
        caseId: c.id || c.marker,
        marked: c.outcome,
        engine: c.engineOutcome,
        label: c.label.length > MAX_LABEL ? c.label.slice(0, MAX_LABEL) + '…' : c.label
      });
    }
  }

  out.sort(
    (a, b) => a.ruleId.localeCompare(b.ruleId) || String(a.caseId).localeCompare(String(b.caseId))
  );
  return out;
}

function keyOf(entry) {
  return `${entry.ruleId} ${entry.caseId}`;
}

function describe(entry) {
  const engine = entry.engine === 'notFlagged' ? 'reports nothing' : `reports ${entry.engine}`;
  return `${keyOf(entry)}: marked ${entry.marked}, engine ${engine} — ${entry.label}`;
}

function reportDrift(committed, fresh) {
  const before = new Map(committed.map((e) => [keyOf(e), e]));
  const after = new Map(fresh.map((e) => [keyOf(e), e]));

  const added = fresh.filter((e) => !before.has(keyOf(e)));
  const resolved = committed.filter((e) => !after.has(keyOf(e)));
  const changed = fresh.filter((e) => {
    const prev = before.get(keyOf(e));
    return prev && JSON.stringify(prev) !== JSON.stringify(e);
  });

  const lines = [];
  if (added.length) {
    lines.push(`${added.length} fixture case(s) now disagree with the engine:`);
    for (const e of added) lines.push(`  + ${describe(e)}`);
    lines.push('  Update the marker, or the rule, whichever is wrong.');
  }
  if (resolved.length) {
    lines.push(`${resolved.length} recorded disagreement(s) no longer occur:`);
    for (const e of resolved) lines.push(`  - ${keyOf(e)}`);
  }
  if (changed.length) {
    lines.push(`${changed.length} recorded disagreement(s) changed:`);
    for (const e of changed) lines.push(`  ~ ${describe(e)}`);
  }
  if (lines.length) lines.push('Run `npm run fixtures:markers` to rewrite the record.');
  return lines.join('\n');
}

// Each source's record and the disagreements it holds: a profile's, those of
// its own rules; core's, the rest.
function splitBySource(fresh) {
  const sources = ruleSources();
  const owner = new Map();
  for (const src of sources.slice(1)) {
    for (const id of ruleIdsOf(src)) owner.set(id, src.key);
  }
  return sources.map((src) => ({
    file: path.join(src.dataDir, 'fixture-markers.json'),
    entries: fresh.filter((e) => (owner.get(e.ruleId) || 'core') === src.key)
  }));
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = findRepoRoot(__dirname);
  const records = splitBySource(collectDisagreements(repoRoot));

  if (args.check) {
    let failed = false;
    let total = 0;
    for (const { file, entries } of records) {
      const shown = path.relative(repoRoot, file);
      if (!fs.existsSync(file)) {
        console.error(`[fixture-markers] ${shown} is missing -- run \`npm run fixtures:markers\``);
        failed = true;
        continue;
      }
      const committed = JSON.parse(fs.readFileSync(file, 'utf8')).disagreements;
      const drift = reportDrift(committed, entries);
      if (drift) {
        console.error(`[fixture-markers] ${shown}: ${drift}`);
        failed = true;
      }
      total += entries.length;
    }
    if (failed) process.exit(1);
    console.log(`[fixture-markers] ${total} recorded disagreement(s), records are current`);
    return;
  }

  for (const { file, entries } of records) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ disagreements: entries }, null, 2) + '\n');
    console.log(
      `[fixture-markers] wrote ${path.relative(repoRoot, file)} (${entries.length} disagreements)`
    );
  }
}

main();
