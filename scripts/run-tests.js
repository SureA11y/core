'use strict';

// Collects tests/**/*.test.js and profiles/*/tests/**/*.test.js manually and passes explicit file paths to
// `node --test`, instead of a glob string -- Node's test runner only gained
// native CLI glob support in newer versions, so a glob string that works
// locally can fail outright on an older (but still supported) Node version.

const { existsSync, readdirSync, statSync } = require('fs');
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
// (`node scripts/run-tests.js tests/core tests/sarif.test.js`). Any other
// argument (e.g. from `npm run test:coverage`, or `--test-shard=1/3`) is
// forwarded as a Node flag ahead of `--test` -- lets one file collector back
// the plain run, the coverage-instrumented one and a shard of either without
// duplicating the collection logic.
const nodeFlags = [];
const paths = [];
for (const arg of process.argv.slice(2)) {
  if (!arg.startsWith('-') && existsSync(arg)) paths.push(path.resolve(arg));
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

// The engine copy with the sample profile built in, built once for every test
// file that needs it (tests/helpers/sampleEngine.js).
const { buildSampleEngine } = require('../tests/helpers/sampleEngine');
const sampleEngine = buildSampleEngine();

const result = spawnSync(process.execPath, [...nodeFlags, '--test', ...files], {
  stdio: 'inherit',
  env: { ...process.env, SUREA11Y_SAMPLE_ENGINE: sampleEngine }
});
require('fs').rmSync(sampleEngine, { recursive: true, force: true });
process.exit(result.status === null ? 1 : result.status);
