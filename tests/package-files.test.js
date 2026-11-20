'use strict';

/**
 * package.json's `files` names the files the published package carries, one
 * by one. A module added to src/ and required by a packaged one, but left out
 * of the list, works in the repository and breaks every install with "Cannot
 * find module". This packs the package as npm would (a dry run) and fails on
 * any relative require of a packaged file that the package doesn't carry.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');

function packedFiles() {
  const out = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });
  return new Set(JSON.parse(out)[0].files.map((f) => f.path));
}

// What a relative require resolves to, as Node resolves it, relative to the
// package root; null where nothing on disk answers it.
function resolved(fromFile, request) {
  const base = path.join(path.dirname(path.join(ROOT, fromFile)), request);
  for (const candidate of [base, `${base}.js`, `${base}.json`, path.join(base, 'index.js')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.relative(ROOT, candidate).split(path.sep).join('/');
    }
  }
  return null;
}

test('every module a packaged file requires is packaged', () => {
  const files = packedFiles();
  const missing = [];
  for (const file of files) {
    if (!file.endsWith('.js')) continue;
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const m of source.matchAll(/require\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g)) {
      const target = resolved(file, m[1]);
      if (target && !files.has(target)) missing.push(`${file} requires ${m[1]} (${target})`);
    }
  }
  assert.deepEqual(missing, []);
});
