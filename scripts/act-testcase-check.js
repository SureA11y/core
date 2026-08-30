'use strict';

/**
 * act-testcase-check.js
 *
 * Runs this engine's automatic/manual rules against the official W3C ACT
 * Rules test-case corpus (act-rules.github.io) and reports any mismatch
 * between the ACT-declared expected outcome (passed/failed/inapplicable)
 * for a test case and what our matched rule(s) actually produce.
 *
 * Not part of `npm test` -- this is a manually-invoked dev tool, since it
 * depends on network access to a third-party site.
 *
 * Run:
 *   node scripts/act-testcase-check.js                 # all mapped rules
 *   node scripts/act-testcase-check.js --act=97a4e1     # single ACT rule
 *   node scripts/act-testcase-check.js --out=report.json
 *   node scripts/act-testcase-check.js --no-cache          # refetch the live corpus
 */

const fs = require('node:fs');
const path = require('node:path');
const { runa11yCoreOnHtml } = require('../tests/helpers/runDomRulesOnHtml.js');
const { fetchBuckets, fetchText, loadManifest } = require('./lib/act-corpus.js');

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(arg);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

function outcomesForRule(result, ruleId) {
  const rule =
    (result.checksResults || []).find((r) => r.ruleId === ruleId) ||
    (result.checksResults || []).find((r) => String(r.ruleId).endsWith(`:${ruleId}`));
  if (!rule) return null;
  return { outcome: rule.outcome, occurrenceCount: (rule.occurrences || []).length };
}

/**
 * Maps an ACT expected bucket + this engine's per-rule outcomes to a verdict.
 * Family matches (several of our rules mapped to one ACT rule) count as
 * covered if any member fires the expected way.
 */
function evaluate(expectedBucket, ourRuleIds, result) {
  const perRule = ourRuleIds.map((id) => ({ id, ...(outcomesForRule(result, id) || {}) }));

  if (expectedBucket === 'failed') {
    // A manual rule can only ever report `cantTell` (never `fail`) -- flagging
    // the target for review is the correct/best outcome it can produce, so it
    // counts as catching an ACT-failed case just as `fail` does for automatic rules.
    const ok = perRule.some(
      (r) => (r.outcome === 'fail' || r.outcome === 'cantTell') && r.occurrenceCount > 0
    );
    return { ok, perRule };
  }
  if (expectedBucket === 'inapplicable') {
    const badFail = perRule.some((r) => r.outcome === 'fail');
    return { ok: !badFail, perRule };
  }
  // passed
  const badFail = perRule.some((r) => r.outcome === 'fail');
  return { ok: !badFail, perRule };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const options = { cache: args['no-cache'] !== true };
  const entries = loadManifest(typeof args.act === 'string' ? args.act : undefined);

  if (!entries.length) {
    console.error(`No manifest entry for --act=${args.act}`);
    process.exit(1);
  }

  const report = [];
  let totalCases = 0;
  let totalMismatches = 0;

  for (const entry of entries) {
    let buckets;
    try {
      buckets = await fetchBuckets(entry.actId, options);
    } catch (err) {
      console.error(
        `SKIP ${entry.actId} (${entry.actName}): could not fetch rule page: ${err.message}`
      );
      continue;
    }

    const entryResult = {
      actId: entry.actId,
      actName: entry.actName,
      ourRuleIds: entry.ourRuleIds,
      matchType: entry.matchType,
      caseCount: buckets.passed.length + buckets.failed.length + buckets.inapplicable.length,
      mismatches: []
    };

    for (const bucketName of ['passed', 'failed', 'inapplicable']) {
      for (const caseUrl of buckets[bucketName]) {
        totalCases += 1;
        let html;
        try {
          html = await fetchText(caseUrl, options);
        } catch (err) {
          entryResult.mismatches.push({
            caseUrl,
            expected: bucketName,
            error: `fetch failed: ${err.message}`
          });
          totalMismatches += 1;
          continue;
        }

        let result;
        try {
          result = runa11yCoreOnHtml(html, {
            runOnly: { includeRuleIds: entry.ourRuleIds },
            entryPointParity: false
          });
        } catch (err) {
          entryResult.mismatches.push({
            caseUrl,
            expected: bucketName,
            error: `engine threw: ${err.message}`
          });
          totalMismatches += 1;
          continue;
        }

        const verdict = evaluate(bucketName, entry.ourRuleIds, result);
        if (!verdict.ok) {
          entryResult.mismatches.push({
            caseUrl,
            expected: bucketName,
            perRule: verdict.perRule,
            snippet: html.slice(0, 400)
          });
          totalMismatches += 1;
        }
      }
    }

    report.push(entryResult);
    const status = entryResult.mismatches.length
      ? `${entryResult.mismatches.length} MISMATCH`
      : 'ok';
    console.log(`${entry.actId}  ${entry.actName}  [${entryResult.caseCount} cases]  -> ${status}`);
  }

  console.log(`\n${totalCases} test cases checked, ${totalMismatches} mismatches.`);

  const outPath = args.out
    ? path.resolve(process.cwd(), args.out)
    : path.join(__dirname, '..', '.act-testcase-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`Full report written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
