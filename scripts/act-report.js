/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * act-report.js
 *
 * Runs the engine against the W3C ACT Rules test-case corpus and writes the
 * EARL implementation report (docs/EARL.md).
 *
 * Each test case becomes a TestSubject and each mapped rule an assertion about
 * it, under the engine's own rule ids -- the ACT rule they correspond to is
 * derived from which test cases an assertion covers.
 *
 * Only rules mapped to an ACT rule run against its cases: an unmapped rule
 * failing an unrelated minimal document would count as a false positive against
 * a rule it never claimed to implement.
 *
 * Run:
 *   node scripts/act-report.js                     # all mapped rules
 *   node scripts/act-report.js --act=97a4e1        # one ACT rule
 *   node scripts/act-report.js --no-cache          # refetch the live corpus
 *   node scripts/act-report.js --out=path.jsonld
 *
 * Exit: 0 clean · 1 false positives (submission blocked) · 2 corpus incomplete
 */

const fs = require('node:fs');
const path = require('node:path');

const { renderEarlReport } = require('../src/earl.js');
const { runa11yCoreOnHtml } = require('../tests/helpers/runDomRulesOnHtml.js');
const { BUCKETS, fetchBuckets, fetchText, loadManifest, mapPool } = require('./lib/act-corpus.js');

const { version } = require('../package.json');
const FETCH_CONCURRENCY = 6;

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(arg);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

function outcomesFor(result, ruleId) {
  const checks = result.checksResults || [];
  return (
    checks.find((r) => r.ruleId === ruleId) ||
    checks.find((r) => String(r.ruleId).endsWith(`:${ruleId}`)) ||
    null
  );
}

/**
 * A `fail` on an example ACT declares passed or inapplicable. `cantTell` is not
 * one: an automated implementation may defer and still count as consistent.
 */
function falsePositivesIn(expected, checks) {
  if (expected === 'failed') return [];
  return checks.filter((c) => c && c.outcome === 'fail').map((c) => c.ruleId);
}

/**
 * A manual rule flags its target for review rather than failing it, which
 * catches an ACT-failed example just as a `fail` does.
 */
function catchesFailure(checks) {
  return checks.some(
    (c) => c && (c.outcome === 'fail' || c.outcome === 'cantTell') && (c.occurrences || []).length
  );
}

function collectCases(entry, buckets) {
  const cases = [];
  for (const expected of BUCKETS) {
    for (const caseUrl of buckets[expected]) {
      cases.push({ actId: entry.actId, ourRuleIds: entry.ourRuleIds, caseUrl, expected });
    }
  }
  return cases;
}

async function runCase(testCase, options) {
  let html;
  try {
    html = await fetchText(testCase.caseUrl, options);
  } catch (err) {
    return { ...testCase, error: `fetch failed: ${err.message}` };
  }

  let result;
  try {
    result = runa11yCoreOnHtml(html, {
      url: testCase.caseUrl,
      runOnly: { includeRuleIds: testCase.ourRuleIds },
      entryPointParity: false
    });
  } catch (err) {
    return { ...testCase, error: `engine threw: ${err.message}` };
  }

  const checks = testCase.ourRuleIds.map((id) => outcomesFor(result, id)).filter(Boolean);
  return { ...testCase, result, checks };
}

/**
 * Pins the run. The corpus is a live site with no version of its own, so the
 * retrieval date is the only pin available.
 */
function provenanceNode(date) {
  return {
    '@type': 'Project',
    name: 'SureA11y',
    shortdesc: 'Accessibility testing engine',
    homepage: 'https://github.com/SureA11y/core',
    license: 'https://www.mozilla.org/MPL/2.0/',
    release: { '@type': 'Version', revision: version, created: date },
    'dct:source': 'https://act-rules.github.io/',
    'dct:date': date
  };
}

function summarise(entries, records) {
  const byRule = new Map(entries.map((e) => [e.actId, { entry: e, cases: [] }]));
  for (const record of records) byRule.get(record.actId).cases.push(record);

  const falsePositives = [];
  const errors = [];

  for (const { entry, cases } of byRule.values()) {
    let missed = 0;
    let ruleFps = 0;

    for (const c of cases) {
      if (c.error) {
        errors.push(c);
        continue;
      }
      const fps = falsePositivesIn(c.expected, c.checks);
      if (fps.length) {
        ruleFps += 1;
        falsePositives.push({ ...c, ruleIds: fps });
      }
      if (c.expected === 'failed' && !catchesFailure(c.checks)) missed += 1;
    }

    const verdict = ruleFps ? 'FALSE POSITIVES' : missed ? `${missed} not flagged` : 'clean';
    console.log(
      `${entry.actId}  ${entry.actName.padEnd(52).slice(0, 52)}  ` +
        `[${String(cases.length).padStart(3)} cases]  -> ${verdict}`
    );
  }

  return { falsePositives, errors };
}

function reportProblems({ falsePositives, errors }) {
  if (errors.length) {
    console.log(`\n${errors.length} case(s) could not be evaluated:`);
    for (const e of errors) console.log(`  ${e.caseUrl}\n    ${e.error}`);
  }

  if (!falsePositives.length) return;

  console.log(`\nFALSE POSITIVES -- these block submission (${falsePositives.length}):`);
  for (const fp of falsePositives) {
    console.log(`  ${fp.actId}  expected ${fp.expected}  ${fp.ruleIds.join(', ')} -> fail`);
    console.log(`    ${fp.caseUrl}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const options = { cache: args['no-cache'] !== true };
  const date = typeof args.date === 'string' ? args.date : new Date().toISOString().slice(0, 10);

  const entries = loadManifest(typeof args.act === 'string' ? args.act : undefined);
  if (!entries.length) {
    console.error(`No manifest entry for --act=${args.act}`);
    return 2;
  }

  const cases = [];
  const unreachable = [];

  for (const entry of entries) {
    try {
      cases.push(...collectCases(entry, await fetchBuckets(entry.actId, options)));
    } catch (err) {
      unreachable.push(entry.actId);
      console.error(`SKIP ${entry.actId} (${entry.actName}): ${err.message}`);
    }
  }

  let done = 0;
  const records = await mapPool(cases, FETCH_CONCURRENCY, async (c) => {
    const record = await runCase(c, options);
    done += 1;
    if (process.stderr.isTTY) process.stderr.write(`\r${done}/${cases.length} cases`);
    return record;
  });
  if (process.stderr.isTTY) process.stderr.write('\r\x1b[K');
  const reachable = entries.filter((e) => !unreachable.includes(e.actId));
  const { falsePositives, errors } = summarise(reachable, records);

  const results = records.filter((r) => r.result).map((r) => r.result);
  const report = renderEarlReport(results, {
    assertor: { name: 'SureA11y', version },
    mode: 'earl:automatic'
  });
  report['@graph'].unshift(provenanceNode(date));

  const outPath = args.out
    ? path.resolve(process.cwd(), String(args.out))
    : path.join(__dirname, '..', 'act-report.jsonld');
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    `\n${records.length} test cases across ${reachable.length} ACT rules, ` +
      `${falsePositives.length} false positives.`
  );
  reportProblems({ falsePositives, errors });
  console.log(`\nReport written to ${outPath}`);

  if (falsePositives.length) return 1;
  if (errors.length || unreachable.length) return 2;
  return 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    console.error(err);
    process.exitCode = 2;
  }
);
