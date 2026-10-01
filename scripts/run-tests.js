'use strict';

// Collects tests/**/*.test.js and profiles/*/tests/**/*.test.js manually and passes explicit file paths to
// `node --test`, instead of a glob string -- Node's test runner only gained
// native CLI glob support in newer versions, so a glob string that works
// locally can fail outright on an older (but still supported) Node version.

const { existsSync, readdirSync, statSync } = require('fs');
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
const files = collectTestFiles(testsDir, []);

// Each profile keeps its tests next to it, in profiles/<name>/tests.
const profilesDir = path.join(rootDir, 'profiles');
for (const name of readdirSync(profilesDir).sort()) {
  const dir = path.join(profilesDir, name, 'tests');
  if (existsSync(dir)) collectTestFiles(dir, files);
}

if (files.length === 0) {
  console.error(`No *.test.js files found under ${testsDir} or ${profilesDir}`);
  process.exit(1);
}

// Any CLI args this script itself receives (e.g. from `npm run test:coverage`)
// are forwarded as Node flags ahead of `--test` -- lets one file collector
// back both the plain `npm test` and the coverage-instrumented variant
// without duplicating the collection logic.
const nodeFlags = process.argv.slice(2);

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
