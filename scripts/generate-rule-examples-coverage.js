/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Track which rules docs/RULE_EXAMPLES.md covers, so a new or renamed rule
 * can't silently ship without a matching example. RULE_EXAMPLES.md is
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

const OUT = path.join('scripts', 'data', 'rule-examples-coverage.json');
const EXAMPLES_FILE = path.join('docs', 'RULE_EXAMPLES.md');

function parseArgs(argv) {
  const args = { check: false, out: OUT };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') args.check = true;
    else if (a === '--out') args.out = argv[++i];
  }
  return args;
}

function readDocumentedRuleIds(repoRoot) {
  const source = fs.readFileSync(path.join(repoRoot, EXAMPLES_FILE), 'utf8');
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

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = path.resolve(__dirname, '..');
  const outPath = path.isAbsolute(args.out) ? args.out : path.resolve(repoRoot, args.out);

  const core = require(path.join(repoRoot, 'src/core.js'));
  const catalogIds = core
    .getChecksCatalog()
    .map((r) => r.ruleId)
    .sort();
  const documented = readDocumentedRuleIds(repoRoot);

  const missing = catalogIds.filter((id) => !documented.has(id));
  const stale = [...documented].filter((id) => !catalogIds.includes(id)).sort();

  const fresh = { missing, stale };

  if (args.check) {
    if (!fs.existsSync(outPath)) {
      console.error(
        `[rule-examples-coverage] ${args.out} is missing -- run \`npm run rule-examples:coverage\``
      );
      process.exit(1);
    }
    const committed = JSON.parse(fs.readFileSync(outPath, 'utf8'));

    const newlyMissing = missing.filter((id) => !committed.missing.includes(id));
    const resolvedMissing = committed.missing.filter((id) => !missing.includes(id));
    const newlyStale = stale.filter((id) => !committed.stale.includes(id));
    const resolvedStale = committed.stale.filter((id) => !stale.includes(id));

    const lines = [];
    if (newlyMissing.length)
      lines.push(...describeList('rule(s) have no docs/RULE_EXAMPLES.md section', newlyMissing));
    if (resolvedMissing.length)
      lines.push(
        ...describeList('rule(s) recorded as missing now have a section', resolvedMissing)
      );
    if (newlyStale.length)
      lines.push(
        ...describeList(
          "docs/RULE_EXAMPLES.md section(s) that don't match a real rule id",
          newlyStale
        )
      );
    if (resolvedStale.length)
      lines.push(...describeList('recorded stale section(s) that are gone', resolvedStale));

    if (lines.length) {
      lines.push(
        'Add the missing example(s), remove the stale one(s), or run `npm run rule-examples:coverage` to update the baseline if the gap is deliberate.'
      );
      console.error(`[rule-examples-coverage] ${lines.join('\n')}`);
      process.exit(1);
    }

    console.log(
      `[rule-examples-coverage] ${missing.length} known gap(s), ${stale.length} known stale section(s), baseline is current.`
    );
    return;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(fresh, null, 2) + '\n');
  console.log(
    `[rule-examples-coverage] wrote ${outPath} (${missing.length} missing, ${stale.length} stale)`
  );
}

main();
