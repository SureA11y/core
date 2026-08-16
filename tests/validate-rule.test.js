'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT_DIR = path.join(__dirname, '..');
const VALIDATOR = path.join(ROOT_DIR, 'scripts', 'validate-rule.js');

// skip-link-manual is the sample because it carries both shapes the
// free-variable scan has to survive: an apostrophe inside a double-quoted
// hint, and a regex literal built from a quote character.
const SAMPLE = path.join(ROOT_DIR, 'src', 'checks', 'manual', 'skip-link-manual.js');
const SAMPLE_SOURCE = fs.readFileSync(SAMPLE, 'utf8');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-rule-test-'));
const target = path.join(dir, path.basename(SAMPLE));

function validateSource(source) {
  fs.writeFileSync(target, source, 'utf8');
  return spawnSync(process.execPath, [VALIDATOR, target], { encoding: 'utf8' }).status === 0;
}

function validate(injectedLine) {
  return validateSource(
    injectedLine
      ? SAMPLE_SOURCE.replace(
          'function runInPage(ctx) {',
          `function runInPage(ctx) {\n  ${injectedLine}`
        )
      : SAMPLE_SOURCE
  );
}

function withExports(exportsLine, extra = '') {
  return SAMPLE_SOURCE.replace('module.exports = { id, meta, runInPage };', extra + exportsLine);
}

test('validate-rule accepts an unmodified rule', () => {
  assert.equal(validate(null), true);
});

for (const [label, line] of [
  ['a bare id reference', 'const x = id;'],
  ['a bare meta reference', 'const x = meta;'],
  ['shorthand { id }', 'const o = { id };'],
  ['require()', "const fs2 = require('fs');"],
  ['import', 'import x from "y";']
]) {
  test(`validate-rule rejects ${label} in runInPage`, () => {
    assert.equal(validate(line), false);
  });
}

for (const [label, line] of [
  ['the word "id" inside a string', 'const s = "an id in prose";'],
  ['a regex literal containing a quote', 'const r = /"/g;'],
  ['.id property access', 'const v = ctx.rule.id;'],
  ['id used as an object key', 'const o = { id: ctx.rule.ruleId };']
]) {
  test(`validate-rule accepts ${label}`, () => {
    assert.equal(validate(line), true);
  });
}

test('validate-rule accepts a rule exporting applicability', () => {
  const source = withExports(
    'module.exports = { id, meta, runInPage, applicability };',
    'function applicability() {\n  return true;\n}\n\n'
  );

  assert.equal(validateSource(source), true);
});

test('validate-rule rejects an export outside the module contract', () => {
  const source = withExports(
    'module.exports = { id, meta, runInPage, helper };',
    'const helper = () => true;\n\n'
  );

  assert.equal(validateSource(source), false);
});
