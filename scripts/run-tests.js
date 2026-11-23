'use strict';

// Collects tests/**/*.test.js and profiles/*/tests/**/*.test.js manually and passes explicit file paths to
// `node --test`, instead of a glob string -- Node's test runner only gained
// native CLI glob support in newer versions, so a glob string that works
// locally can fail outright on an older (but still supported) Node version.

const { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

function collectTestFiles(dir, out) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectTestFiles(full, out);
    } else if (entry.endsWith('.test.js')) {
      out.push(full);
    }
  }
  return out;
}

const rootDir = path.join(__dirname, '..');
const testsDir = path.join(rootDir, 'tests');
const profilesDir = path.join(rootDir, 'profiles');

// An argument that names a file or folder narrows the run to the tests in it
// (`node scripts/run-tests.js tests/core tests/sarif.test.js`).
// `--test-shard=i/n` runs the i-th of n shards of about equal time, and
// `--record-timings` writes each file's time to tests/timings.json. Any other
// argument (e.g. from `npm run test:coverage`) is forwarded as a Node flag
// ahead of `--test`.
const TIMINGS_PATH = path.join(__dirname, '../tests/timings.json');
const nodeFlags = [];
const paths = [];
let shard = null;
let recordTimings = false;
for (const arg of process.argv.slice(2)) {
  const shardMatch = /^--test-shard=(\d+)\/(\d+)$/.exec(arg);
  if (shardMatch) {
    shard = { index: Number(shardMatch[1]), total: Number(shardMatch[2]) };
    if (shard.index < 1 || shard.index > shard.total) {
      console.error(`Invalid shard ${arg}: the index must be between 1 and the total`);
      process.exit(1);
    }
  } else if (arg === '--record-timings') recordTimings = true;
  else if (!arg.startsWith('-') && existsSync(arg)) paths.push(path.resolve(arg));
  else nodeFlags.push(arg);
}

const files = [];
if (paths.length) {
  for (const p of paths) {
    if (statSync(p).isDirectory()) collectTestFiles(p, files);
    else files.push(p);
  }
} else {
  collectTestFiles(testsDir, files);
  // Each profile keeps its tests next to it, in profiles/<name>/tests.
  for (const name of readdirSync(profilesDir).sort()) {
    const dir = path.join(profilesDir, name, 'tests');
    if (existsSync(dir)) collectTestFiles(dir, files);
  }
}

// One test file more than there are cores, unless the caller says otherwise.
// Node's default is one fewer, and many files spend their time waiting on a
// Chromium process: on 4 cores a third of the suite ran in about 255 s with 5
// files at a time, against 285 to 325 s with Node's 3.
if (!nodeFlags.some((flag) => flag.startsWith('--test-concurrency'))) {
  nodeFlags.push(`--test-concurrency=${os.availableParallelism() + 1}`);
}

if (files.length === 0) {
  console.error(
    `No *.test.js files found under ${paths.length ? paths.join(', ') : `${testsDir} or ${profilesDir}`}`
  );
  process.exit(1);
}

// Seconds per file from the last recorded run, keyed by path from the root. A
// file not recorded yet counts as the median.
function readTimings() {
  try {
    return JSON.parse(readFileSync(TIMINGS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

const timings = readTimings();
const known = Object.values(timings).sort((a, b) => a - b);
const median = known.length ? known[Math.floor(known.length / 2)] : 1;
const relative = (file) => path.relative(rootDir, file).split(path.sep).join('/');
// Each file also pays for its own process and module loading, about half a
// second, which the recorded test time leaves out.
const cost = (file) => (timings[relative(file)] ?? median) + 0.5;

// Longest first: a long file started last would run on alone at the end.
let ordered = [...files].sort(
  (a, b) => cost(b) - cost(a) || relative(a).localeCompare(relative(b))
);

// Node's own --test-shard deals files out in turn, blind to their time, which
// left one shard with a third more work than another. Each file goes instead
// to the shard with the least work so far; every shard computes the same split.
if (shard) {
  const loads = new Array(shard.total).fill(0);
  ordered = ordered.filter((file) => {
    const lightest = loads.indexOf(Math.min(...loads));
    loads[lightest] += cost(file);
    return lightest === shard.index - 1;
  });
  console.log(
    `Shard ${shard.index}/${shard.total}: ${ordered.length} of ${files.length} files, ` +
      `about ${Math.round(loads[shard.index - 1])} s of test time`
  );
  // `node --test` given no files would run its own default glob.
  if (ordered.length === 0) process.exit(0);
}

const reporterFlags = [];
let timingsOut = null;
if (recordTimings) {
  timingsOut = path.join(os.tmpdir(), `surea11y-timings-${process.pid}.json`);
  if (!nodeFlags.some((flag) => flag.startsWith('--test-reporter'))) {
    reporterFlags.push('--test-reporter=spec', '--test-reporter-destination=stdout');
  }
  reporterFlags.push(
    `--test-reporter=${path.join(__dirname, 'test-timings-reporter.js')}`,
    `--test-reporter-destination=${timingsOut}`
  );
}

// The engine copy with the sample profile built in, built once for every test
// file that needs it (tests/helpers/sampleEngine.js).
const { buildSampleEngine } = require('../tests/helpers/sampleEngine');
const sampleEngine = buildSampleEngine();

const result = spawnSync(process.execPath, [...nodeFlags, ...reporterFlags, '--test', ...ordered], {
  stdio: 'inherit',
  env: { ...process.env, SUREA11Y_SAMPLE_ENGINE: sampleEngine }
});
rmSync(sampleEngine, { recursive: true, force: true });

// Merged into the recorded times, so a narrowed run updates only its files.
// Files that no longer exist are dropped.
if (timingsOut) {
  const recorded = JSON.parse(readFileSync(timingsOut, 'utf8'));
  rmSync(timingsOut, { force: true });
  const merged = { ...timings };
  for (const [file, ms] of Object.entries(recorded)) {
    merged[relative(file)] = Math.round(ms / 100) / 10;
  }
  const sorted = {};
  for (const file of Object.keys(merged).sort()) {
    if (existsSync(path.join(rootDir, file))) sorted[file] = merged[file];
  }
  writeFileSync(TIMINGS_PATH, JSON.stringify(sorted, null, 2) + '\n');
  console.log(
    `Recorded the time of ${Object.keys(recorded).length} files in ${relative(TIMINGS_PATH)}`
  );
}
process.exit(result.status === null ? 1 : result.status);
