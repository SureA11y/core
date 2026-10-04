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

const LABELS = {
  Passed: 'pass',
  Failed: 'fail',
  'Flagged (cantTell)': 'cantTell',
  'Not applicable': 'notApplicable'
};
const MAX_SNIPPET = 100;

function parseArgs(argv) {
  return { check: argv.slice(2).includes('--check') };
}

// Every example of a RULE_EXAMPLES.md: { ruleId, label, expected, html }.
// An unknown label is an example too, with expected null, so it is reported.
function readExamples(file) {
  if (!fs.existsSync(file)) return [];
  const out = [];
  const sections = fs.readFileSync(file, 'utf8').split(/^## /m).slice(1);
  for (const section of sections) {
    const ruleId = section.split('\n')[0].trim();
    const re = /^\*\*([^*]+)\*\*\s*\n```html\n([\s\S]*?)```/gm;
    let m;
    while ((m = re.exec(section)) !== null) {
      const label = m[1].trim();
      const outcome = label.replace(/\s*\(in a browser\)$/, '');
      out.push({ ruleId, label, expected: LABELS[outcome] || null, html: m[2] });
    }
  }
  return out;
}

function toPage(snippet) {
  if (/<html[\s>]/i.test(snippet)) return snippet;
  const head = (snippet.match(/<head[\s>][\s\S]*?<\/head>/i) || [''])[0];
  let rest = head ? snippet.replace(head, '') : snippet;
  const headInner = head.replace(/^<head[^>]*>|<\/head>$/gi, '');
  const leading = (rest.match(
    /^\s*(?:<(title|style)[\s\S]*?<\/\1>\s*|<(?:meta|link)\b[^>]*>\s*)+/i
  ) || [''])[0];
  rest = rest.slice(leading.length);
  const hasTitle = /<title[\s>]/i.test(headInner + leading);
  const body = /<body[\s>]/i.test(rest) ? rest : `<body>${rest}</body>`;
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    (hasTitle ? '' : '<title>Example page</title>') +
    headInner +
    leading +
    `</head>${body}</html>`
  );
}

function snippetLabel(html) {
  const one = html.replace(/\s+/g, ' ').trim();
  return one.length > MAX_SNIPPET ? one.slice(0, MAX_SNIPPET) + '…' : one;
}

async function collectDisagreements(examples, bundle) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const out = [];
  try {
    for (const ex of examples) {
      let engine;
      if (!ex.expected) {
        engine = 'unknown label';
      } else {
        const page = await context.newPage();
        try {
          await page.setContent(toPage(ex.html));
          await page.addScriptTag({ content: bundle });
          engine = await page.evaluate((id) => {
            const r = window.a11ycore.runa11yCoreInPage(
              location.href,
              null,
              { rules: { include: id } },
              null
            );
            const c = r.checksResults.find((x) => x.ruleId === id);
            return c ? c.outcome : 'absent';
          }, ex.ruleId);
        } finally {
          await page.close();
        }
      }
      if (engine !== ex.expected) {
        out.push({
          ruleId: ex.ruleId,
          label: ex.label,
          engine,
          example: snippetLabel(ex.html)
        });
      }
    }
  } finally {
    await browser.close();
  }
  return out;
}

function keyOf(e) {
  return `${e.ruleId} [${e.label}] ${e.example}`;
}

function reportDrift(committed, fresh) {
  const before = new Set(committed.map(keyOf));
  const after = new Map(fresh.map((e) => [keyOf(e), e]));
  const lines = [];
  const added = fresh.filter((e) => !before.has(keyOf(e)));
  const resolved = committed.filter((e) => !after.has(keyOf(e)));
  const changed = committed.filter((e) => {
    const now = after.get(keyOf(e));
    return now && now.engine !== e.engine;
  });
  if (added.length) {
    lines.push(`${added.length} example(s) now give another outcome than their label:`);
    for (const e of added) lines.push(`  + ${keyOf(e)}: engine reports ${e.engine}`);
    lines.push('  Fix the example or its label, or the rule, whichever is wrong.');
  }
  if (resolved.length) {
    lines.push(`${resolved.length} recorded disagreement(s) no longer occur:`);
    for (const e of resolved) lines.push(`  - ${keyOf(e)}`);
  }
  if (changed.length) {
    lines.push(`${changed.length} recorded disagreement(s) changed:`);
    for (const e of changed) lines.push(`  ~ ${keyOf(e)}: now ${after.get(keyOf(e)).engine}`);
  }
  if (lines.length) lines.push('Run `npm run rule-examples:outcomes` to rewrite the record.');
  return lines.join('\n');
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
