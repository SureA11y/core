'use strict';

/**
 * The translations of the procedures that are to be checked again, because
 * the English changed after they were made (src/procedures-to-review.json):
 * for each, the English it was made from, the English now and the
 * translation.
 *
 * Usage:
 *   npm run procedures:review            list them
 *   npm run procedures:review -- --json  the same, as JSON, for tools
 *
 * Exits 1 when the record itself is wrong (an unknown locale or key, or an
 * entry whose English is unchanged); the entries alone are not an error.
 */

const { problemsOf, pendingOf, readRecord, readDictionaries } = require('./lib/procedures-review');

const record = readRecord();
const dictionaries = readDictionaries();
const problems = problemsOf(record, dictionaries);
const pending = pendingOf(record, dictionaries);

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify({ pending, problems }, null, 2) + '\n');
} else {
  if (!pending.length) console.log('No translation of the procedures is waiting to be checked.');
  for (const locale of [...new Set(pending.map((p) => p.locale))]) {
    const rows = pending.filter((p) => p.locale === locale);
    console.log(`\n${locale}: ${rows.length} to check`);
    for (const p of rows) {
      console.log(`\n  ${p.key}`);
      console.log(`    English was: ${p.was}`);
      console.log(`    English now: ${p.now}`);
      console.log(`    ${locale} now:      ${p.translation}`);
    }
  }
  for (const p of problems) console.error(`procedures-to-review.json, ${p}`);
}
process.exitCode = problems.length ? 1 : 0;
