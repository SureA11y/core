#!/usr/bin/env node
'use strict';

/**
 * other-engine-corpus-check.js
 *
 * Runs a third-party DOM accessibility scanner against this repo's own
 * scenario fixtures (tests/fixtures/*-all-scenarios.html) in a real browser,
 * and diffs its findings against what this engine reports for the same
 * cases, per rule. The tool being compared against is never named here: it
 * is supplied at invocation time, so this script works against whichever
 * one you point it at.
 *
 * This engine's side of the comparison reuses scripts/lib/rule-review-data.js
 * (the same replay docs/rule-review.html and fixtures:markers:check already
 * trust), which evaluates fixtures via jsdom, not a real browser. The other
 * tool's side runs in a real Chromium page. A disagreement can therefore
 * occasionally trace to a jsdom-vs-real-browser rendering difference rather
 * than a real logic gap -- the same class of caveat docs/LIMITATIONS.md
 * already documents for other jsdom-based tooling in this repo.
 *
 * Only fixture cases with an individual target element are compared
 * (`.case` wrapper divs); whole-document rules (RULE_AUTHORING.md §11.2)
 * have nothing to diff per case and are skipped.
 *
 * Not part of `npm test` -- this is a manually-invoked dev tool, since it
 * depends on Playwright and on the comparison tool you supply.
 *
 * Usage:
 *   node scripts/other-engine-corpus-check.js \
 *     --inject=<path-or-https-url to the tool's browser script> \
 *     --call="window.someGlobal.run()" \
 *     --adapter=scripts/lib/corpus-adapters/violations-nodes-target.js \
 *     [--rule=area-alt-present,area-alt-quality] \
 *     [--gaps-only] \
 *     [--out=report.json]
 *
 * --inject   Local file path or https:// URL for the tool's own script.
 * --call     A JS expression, evaluated and awaited inside the page, that
 *            runs the tool and resolves to its raw result object.
 * --adapter  Path to a module exporting a function (rawResult) => string[]
 *            of CSS selectors for the nodes it flagged. Must be a plain,
 *            self-contained function -- its source is inlined into the
 *            page, so it cannot close over anything outside its argument.
 *            scripts/lib/corpus-adapters/violations-nodes-target.js covers
 *            the common { violations: [{ nodes: [{ target }] }] } shape.
 * --rule     Comma-separated rule ids to check (default: every rule with a
 *            fixture and at least one element-scoped case).
 */

const fs = require('node:fs');
const path = require('node:path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  chromium = null;
}

const { collect, findRepoRoot } = require('./lib/rule-review-data');

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(arg);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

function isUrl(s) {
  return /^https?:\/\//.test(s);
}

/** Diff bucket for one element-scoped case. */
function bucketFor(ourFlagged, otherFlagged) {
  if (ourFlagged && otherFlagged) return 'agree-flag';
  if (!ourFlagged && !otherFlagged) return 'agree-clean';
  if (ourFlagged && !otherFlagged) return 'ours-only';
  return 'gap'; // the other tool flagged it, we didn't
}

async function checkRule(browser, repoRoot, rule, { inject, call, adapterFnSrc }) {
  const fixtureAbsPath = path.resolve(repoRoot, rule.fixtureFile);
  const page = await browser.newPage();

  const result = { ruleId: rule.id, fixtureFile: rule.fixtureFile, rows: [], error: null };

  try {
    await page.goto('file://' + fixtureAbsPath);

    if (isUrl(inject)) await page.addScriptTag({ url: inject });
    else await page.addScriptTag({ path: path.resolve(repoRoot, inject) });

    const scan = await page.evaluate(
      async ({ callExpr, adapterFnSrc }) => {
        const raw = await Promise.resolve(eval(callExpr));
        const adapt = eval('(' + adapterFnSrc + ')');
        const selectors = adapt(raw) || [];

        function findQuietly(sel) {
          try {
            return document.querySelector(sel);
          } catch {
            return null;
          }
        }

        const flaggedCaseIds = new Set();
        const unattributed = [];
        for (const sel of selectors) {
          const el = findQuietly(sel);
          const caseEl = el ? el.closest('.case') : null;
          if (caseEl && caseEl.id) flaggedCaseIds.add(caseEl.id);
          else unattributed.push(sel);
        }
        return { flaggedCaseIds: Array.from(flaggedCaseIds), unattributed };
      },
      { callExpr: call, adapterFnSrc }
    );

    const flagged = new Set(scan.flaggedCaseIds);
    const elementCases = rule.cases.filter((c) => c.scope !== 'document');

    for (const c of elementCases) {
      const ourFlagged = c.engineOutcome !== 'notFlagged';
      const otherFlagged = flagged.has(c.id);
      result.rows.push({
        caseId: c.id,
        marker: c.marker,
        ourOutcome: c.engineOutcome,
        otherFlagged,
        bucket: bucketFor(ourFlagged, otherFlagged)
      });
    }
    result.otherUnattributed = scan.unattributed;
  } catch (err) {
    result.error = err.message;
  } finally {
    await page.close();
  }

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!chromium) {
    console.error('playwright is not installed. Run: npx playwright install chromium');
    process.exit(1);
  }
  for (const required of ['inject', 'call', 'adapter']) {
    if (!args[required]) {
      console.error(`Missing --${required}. See the header comment in this file for usage.`);
      process.exit(1);
    }
  }

  const repoRoot = findRepoRoot(__dirname);
  const adapterFn = require(path.resolve(repoRoot, args.adapter));
  if (typeof adapterFn !== 'function') {
    console.error(`${args.adapter} must export a function (rawResult) => string[]`);
    process.exit(1);
  }
  const adapterFnSrc = adapterFn.toString();

  const { rules } = collect({ repoRoot });
  const ruleFilter = args.rule
    ? new Set(
        String(args.rule)
          .split(',')
          .map((s) => s.trim())
      )
    : null;

  const targetRules = rules.filter(
    (r) =>
      r.fixtureFile &&
      r.cases.some((c) => c.scope !== 'document') &&
      (!ruleFilter || ruleFilter.has(r.id))
  );

  if (!targetRules.length) {
    console.error('No matching rules with a fixture and element-scoped cases.');
    process.exit(1);
  }

  const browser = await chromium.launch();
  const report = [];
  let totalCases = 0;
  let totalGaps = 0;
  let totalOursOnly = 0;

  for (const rule of targetRules) {
    const entry = await checkRule(browser, repoRoot, rule, {
      inject: args.inject,
      call: args.call,
      adapterFnSrc
    });
    report.push(entry);

    if (entry.error) {
      console.log(`${rule.id}  ERROR: ${entry.error}`);
      continue;
    }

    const gaps = entry.rows.filter((r) => r.bucket === 'gap');
    const oursOnly = entry.rows.filter((r) => r.bucket === 'ours-only');
    totalCases += entry.rows.length;
    totalGaps += gaps.length;
    totalOursOnly += oursOnly.length;

    const rowsToShow = args['gaps-only']
      ? gaps
      : entry.rows.filter((r) => r.bucket !== 'agree-clean');
    const status = gaps.length
      ? `${gaps.length} GAP`
      : oursOnly.length
        ? `${oursOnly.length} ours-only`
        : 'agree';
    console.log(`${rule.id}  [${entry.rows.length} cases]  -> ${status}`);
    for (const row of rowsToShow) {
      console.log(`    ${row.bucket.padEnd(11)} ${row.caseId}  (ours: ${row.ourOutcome})`);
    }
    if (entry.otherUnattributed.length) {
      console.log(`    ${entry.otherUnattributed.length} finding(s) did not resolve to a case`);
    }
  }

  await browser.close();

  console.log(
    `\n${targetRules.length} rule(s), ${totalCases} case(s) checked. ` +
      `${totalGaps} gap(s), ${totalOursOnly} ours-only.`
  );

  const outPath = args.out
    ? path.resolve(process.cwd(), args.out)
    : path.join(repoRoot, '.other-engine-corpus-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`Full report written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
