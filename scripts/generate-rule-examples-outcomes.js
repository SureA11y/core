/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Check that every example in docs/RULE_EXAMPLES.md gives the outcome its
 * label claims (Passed, Failed, Flagged (cantTell), Not applicable), and
 * record the ones that do not in scripts/data/rule-examples-outcomes.json
 * (each profile's in its own scripts/data/, for its own examples).
 *
 * The examples are what the docs site shows for each rule, so a label that
 * no longer matches the engine teaches the wrong thing. generate-rule-
 * examples-coverage.js only checks that every rule has a section; nothing
 * read the outcomes, and a change to a rule left its examples claiming the
 * old one. This replays each example and, like generate-fixture-markers.js,
 * keeps the set of known disagreements so it can only shrink on purpose.
 *
 * Examples run in Chromium, through the browser bundle, as a reader's page
 * would: several rules measure layout, which jsdom does not have. A label
 * may end in "(in a browser)"; that is part of the reader's text, not of
 * the outcome. A snippet with no <html> is wrapped in a page: its leading
 * <title>, <meta>, <link> and <style> elements go in the <head>, and the
 * page gets a title of its own unless the snippet brings one.
 *
 * Needs Playwright's Chromium (CI installs it before this runs).
 *
 * Usage:
 *   npm run build && npm run rule-examples:outcomes          # rewrite the record
 *   npm run build && npm run rule-examples:outcomes:check    # fail if it is stale
 */

const fs = require('node:fs');
const path = require('node:path');

const { ruleSources, ruleIdsOf } = require('./lib/rule-dirs');
const { readExamples, toPage, collectDisagreements, reportDrift } = require('../src/rule-docs.js');

function parseArgs(argv) {
  return { check: argv.slice(2).includes('--check') };
}

async function main() {
  const args = parseArgs(process.argv);
  const repoRoot = path.resolve(__dirname, '..');
  const bundle = fs.readFileSync(path.join(repoRoot, 'surea11y.browser.js'), 'utf8');

  const sources = ruleSources();
  const owned = new Map();
  for (const src of sources.slice(1)) for (const id of ruleIdsOf(src)) owned.set(id, src.key);

  let failed = false;
  let total = 0;
  for (const src of sources) {
    const examples = readExamples(path.join(src.docsDir, 'RULE_EXAMPLES.md')).filter(
      (ex) => (owned.get(ex.ruleId) || 'core') === src.key
    );
    const fresh = await collectDisagreements(examples, bundle);
    const outPath = path.join(src.dataDir, 'rule-examples-outcomes.json');
    const shown = path.relative(repoRoot, outPath);
    total += fresh.length;

    if (!args.check) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify({ disagreements: fresh }, null, 2) + '\n');
      console.log(
        `[rule-examples-outcomes] wrote ${shown} (${examples.length} examples, ${fresh.length} disagreements)`
      );
      continue;
    }
    if (!fs.existsSync(outPath)) {
      console.error(
        `[rule-examples-outcomes] ${shown} is missing -- run \`npm run rule-examples:outcomes\``
      );
      failed = true;
      continue;
    }
    const committed = JSON.parse(fs.readFileSync(outPath, 'utf8')).disagreements;
    const drift = reportDrift(committed, fresh);
    if (drift) {
      console.error(`[rule-examples-outcomes] ${shown}: ${drift}`);
      failed = true;
    }
  }

  if (!args.check) return;
  if (failed) process.exit(1);
  console.log(`[rule-examples-outcomes] ${total} recorded disagreement(s), records are current`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { readExamples, toPage };
