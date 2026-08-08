/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const STUB = path.join(__dirname, '..', 'bin', 'surea11y-core.js');

function run(args = []) {
  try {
    const stdout = execFileSync('node', [STUB, ...args], { encoding: 'utf8' });
    return { stdout, stderr: '', status: 0 };
  } catch (err) {
    return { stdout: err.stdout || '', stderr: err.stderr || '', status: err.status };
  }
}

test('moved-CLI stub exits 2 and points at @surea11y/cli', () => {
  const { stderr, status } = run(['scan', './index.html']);
  assert.strictEqual(status, 2);
  assert.match(stderr, /no longer part of @surea11y\/core/);
  assert.match(stderr, /npx @surea11y\/cli scan/);
});

test('moved-CLI stub says the same thing with no arguments', () => {
  const { stderr, status } = run();
  assert.strictEqual(status, 2);
  assert.match(stderr, /@surea11y\/cli/);
});

test('moved-CLI stub writes nothing to stdout, so pipelines see only the error', () => {
  const { stdout } = run(['scan', './index.html']);
  assert.strictEqual(stdout, '');
});

test('package.json bin is not named surea11y, which belongs to @surea11y/cli', () => {
  const pkg = require('../package.json');
  assert.deepStrictEqual(Object.keys(pkg.bin), ['surea11y-core']);
});
