/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * measure-leans.js
 *
 * Counts how often each lean is right (docs/LEANS.md, "How far to trust a
 * lean"), against the W3C ACT Rules test cases: each case says whether a page
 * passes or fails the ACT rule, which is the answer a person would reach. For
 * every undecided finding that leans, of a rule mapped to the case's ACT rule
 * (scripts/data/act-rule-map.json), the lean agrees when it points the way the
 * case says: `fail` on a failed case, `pass` on a passed one. Inapplicable
 * cases are left out, as neither answer is theirs.
 *
 * A case counts once for each rule, reason code and direction it shows,
 * however many elements lean that way on it, so one page with many findings
 * doesn't outweigh the others. The ACT answer is the page's: a lean on an
 * element other than the one the case is about is counted against the page's
 * answer all the same, which is what a reviewer of the page would conclude.
 *
 * The counts go to scripts/data/lean-measures.json, which the build embeds in
 * the engine (scripts/build-core.js): every lean whose rule, code and
 * direction were counted carries them as `measured`. Core's fixtures are not
 * counted: their markers say which tier the engine gives a case, not what a
 * person would answer it.
 *
 * Run (then `npm run build`):
 *   node scripts/measure-leans.js                     # in jsdom
 *   node scripts/measure-leans.js --runner=chromium   # in Chromium, as the bindings run
 *   node scripts/measure-leans.js --no-cache          # refetch the live corpus
 *   node scripts/measure-leans.js --out=path.json
 *
 * It prints each measured lean, and warns about one that agreed with fewer
 * than 80% of 5 or more cases: such a lean is to be reconsidered, or removed.
 * A lean carries its counts (`measured`) only from 5 cases up: fewer say
 * little, and a lean shown as 1/1 would read as proven.
 * Exit: 0 written · 2 the corpus could not be read.
 */

const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('../tests/helpers/runDomRulesOnHtml.js');
const {
  DEFAULT_SOURCE,
  fetchText,
  loadCorpus,
  loadManifest,
  mapPool,
  scanOptionsFor
} = require('./lib/act-corpus.js');
const { openBrowserRunner } = require('./lib/act-browser.js');

const { version } = require('../package.json');

const OUT_PATH = path.join(__dirname, 'data', 'lean-measures.json');
// W3C's site rate-limits a burst of fetches; three at a time stays under it.
const FETCH_CONCURRENCY = 3;
// A lean that agreed with fewer of this many cases is worth a look.
const WARN_BELOW = 0.8;
// From how many cases a lean's counts say enough to be shown, or warned about.
const MIN_CASES = 5;

const ANSWERS = { passed: 'pass', failed: 'fail' };

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(arg);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

function tierOf(check, occ) {
  for (const tier of [occ && occ.occurrenceOutcome, occ && occ.outcome]) {
    if (tier === 'fail' || tier === 'cantTell') return tier;
  }
  return check.outcome;
}

function reasonCodeOf(occ) {
  const details = occ && occ.data && occ.data.details;
  return details && typeof details.reasonCode === 'string' && details.reasonCode
    ? details.reasonCode
    : 'DEFAULT';
}

// The leans one scanned case shows, as `rule\0code\0toward` keys, once each.
function leansIn(result, ruleIds) {
  const keys = new Set();
  for (const check of (result && result.checksResults) || []) {
    if (!check || !ruleIds.includes(check.ruleId)) continue;
    for (const occ of check.occurrences || []) {
      if (tierOf(check, occ) !== 'cantTell') continue;
      const toward = occ && occ.lean && occ.lean.toward;
      if (toward !== 'pass' && toward !== 'fail') continue;
      keys.add([check.ruleId, reasonCodeOf(occ), toward].join('\u0000'));
    }
  }
  return keys;
}

async function scanCase(testCase, options) {
  const { runOnly, engineOptions } = scanOptionsFor(
    testCase.actId,
    testCase.ourRuleIds,
    testCase.caseUrl
  );
  if (options.browserRunner) {
    const result = await options.browserRunner.scan(testCase.caseUrl, { runOnly, engineOptions });
    // Shown through Chromium's XML viewer: scanned as parsed, in jsdom.
    if (result !== null) return result;
  }
  const html = await fetchText(testCase.caseUrl, options);
  return runa11yCoreOnHtml(html, {
    url: testCase.caseUrl,
    runOnly,
    engineOptions,
    entryPointParity: false
  });
}

// The counts, as lean-measures.json holds them: rule -> code -> direction.
function tally(records) {
  const leans = {};
  for (const { keys, answer } of records) {
    for (const key of keys) {
      const [ruleId, code, toward] = key.split('\u0000');
      const byCode = (leans[ruleId] = leans[ruleId] || {});
      const byToward = (byCode[code] = byCode[code] || {});
      const m = (byToward[toward] = byToward[toward] || { agreed: 0, cases: 0 });
      m.cases += 1;
      if (toward === answer) m.agreed += 1;
    }
  }
  // Sorted, so a rerun that counts the same writes the same file.
  const sorted = {};
  for (const ruleId of Object.keys(leans).sort()) {
    sorted[ruleId] = {};
    for (const code of Object.keys(leans[ruleId]).sort()) {
      sorted[ruleId][code] = {};
      for (const toward of Object.keys(leans[ruleId][code]).sort()) {
        sorted[ruleId][code][toward] = leans[ruleId][code][toward];
      }
    }
  }
  return sorted;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const options = {
    cache: args['no-cache'] !== true,
    source: typeof args.source === 'string' ? args.source : DEFAULT_SOURCE
  };
  const runner = typeof args.runner === 'string' ? args.runner : 'jsdom';
  if (runner !== 'jsdom' && runner !== 'chromium') {
    console.error(`Unknown --runner=${runner} (jsdom or chromium)`);
    return 2;
  }

  let corpus;
  try {
    corpus = await loadCorpus(options);
  } catch (err) {
    console.error(`Could not read the ACT test cases: ${err.message}`);
    return 2;
  }

  const cases = [];
  for (const entry of loadManifest()) {
    const rule = corpus.rules.get(entry.actId);
    if (!rule) continue;
    for (const expected of Object.keys(ANSWERS)) {
      for (const caseUrl of rule.buckets[expected]) {
        cases.push({ actId: entry.actId, ourRuleIds: entry.ourRuleIds, caseUrl, expected });
      }
    }
  }

  if (runner === 'chromium') {
    try {
      options.browserRunner = await openBrowserRunner(options);
    } catch (err) {
      console.error(`Could not start Chromium: ${err.message}`);
      return 2;
    }
  }

  let done = 0;
  const skipped = [];
  const records = await mapPool(cases, FETCH_CONCURRENCY, async (c) => {
    let keys = new Set();
    try {
      keys = leansIn(await scanCase(c, options), c.ourRuleIds);
    } catch (err) {
      skipped.push(`${c.caseUrl}: ${err.message}`);
    }
    done += 1;
    if (process.stderr.isTTY) process.stderr.write(`\r${done}/${cases.length} cases`);
    return { keys, answer: ANSWERS[c.expected] };
  }).finally(() => options.browserRunner && options.browserRunner.close());
  if (process.stderr.isTTY) process.stderr.write('\r\x1b[K');

  const date = typeof args.date === 'string' ? args.date : new Date().toISOString().slice(0, 10);
  const leans = tally(records);
  const out = {
    $comment:
      'Generated by scripts/measure-leans.js: how often each lean agreed with the W3C ACT Rules test cases, by rule, reason code and direction. scripts/build-core.js embeds it in the engine as each lean’s `measured`, for a lean counted on at least minCases cases. Rerun it, then npm run build; do not edit by hand.',
    corpus: `${corpus.source.name} test cases, ${date}`,
    coreVersion: version,
    runner,
    minCases: MIN_CASES,
    leans
  };
  const outPath = args.out ? path.resolve(process.cwd(), String(args.out)) : OUT_PATH;
  fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);

  let measured = 0;
  const weak = [];
  for (const [ruleId, byCode] of Object.entries(leans)) {
    for (const [code, byToward] of Object.entries(byCode)) {
      for (const [toward, m] of Object.entries(byToward)) {
        measured += 1;
        console.log(`${ruleId} ${code} leans ${toward}: ${m.agreed}/${m.cases}`);
        if (m.cases >= MIN_CASES && m.agreed / m.cases < WARN_BELOW) {
          weak.push(`${ruleId} ${code} leans ${toward}: right in ${m.agreed} of ${m.cases} cases`);
        }
      }
    }
  }
  console.log(`\n${measured} leans measured on ${cases.length} test cases; written to ${outPath}`);
  if (skipped.length) {
    console.log(`\n${skipped.length} case(s) could not be scanned, and count for nothing:`);
    for (const s of skipped) console.log(`  ${s}`);
  }
  if (weak.length) {
    console.log(`\nRight in fewer than ${WARN_BELOW * 100}% of their cases, to reconsider:`);
    for (const w of weak) console.log(`  ${w}`);
  }
  return 0;
}

if (require.main === module) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (err) => {
      console.error(err);
      process.exitCode = 2;
    }
  );
}

module.exports = { leansIn, tally };
