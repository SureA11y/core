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

for (const [label, code, accepted] of [
  ['a code in the vocabulary', 'spec-only', true],
  ['a misspelled code', 'equivalence-unkown', false],
  ['an invented code', 'probably-fine', false]
]) {
  test(`validate-rule ${accepted ? 'accepts' : 'rejects'} ${label}`, () => {
    const line = `const u = { uncertainty: { code: '${code}' }, data: {} };`;
    assert.equal(validate(line), accepted);
  });
}

function withMeta(line) {
  return SAMPLE_SOURCE.replace('const meta = {', `const meta = {\n  ${line}`);
}

test('validate-rule accepts meta.reasonCodes that the rule reports', () => {
  assert.equal(validateSource(withMeta("reasonCodes: ['SKIP_LINK_TARGET_MISSING'],")), true);
});

for (const [label, line] of [
  ['a declared reason code the source never mentions', "reasonCodes: ['NOT_IN_THIS_RULE'],"],
  ['an empty meta.reasonCodes', 'reasonCodes: [],'],
  ['meta.reasonCodes that is not an array', "reasonCodes: 'SKIP_LINK_TARGET_MISSING',"]
]) {
  test(`validate-rule rejects ${label}`, () => {
    assert.equal(validateSource(withMeta(line)), false);
  });
}

const MARGIN = "margin: { measure: 'contrast-ratio', unit: 'ratio', limit: 'min' },";
const withCandidates = (source) =>
  source.replace(
    'function runInPage(ctx) {',
    'function runInPage(ctx) {\n  const marginCandidates = [];'
  );

test('validate-rule accepts meta.margin on a rule that returns marginCandidates', () => {
  assert.equal(validateSource(withCandidates(withMeta(MARGIN))), true);
});

for (const [label, source] of [
  ['meta.margin on a rule that never returns marginCandidates', withMeta(MARGIN)],
  [
    'meta.margin with an unknown unit',
    withCandidates(withMeta("margin: { measure: 'contrast-ratio', unit: 'em', limit: 'min' },"))
  ],
  [
    'meta.margin with an unknown limit',
    withCandidates(
      withMeta("margin: { measure: 'contrast-ratio', unit: 'ratio', limit: 'at-least' },")
    )
  ],
  [
    'meta.margin without a measure',
    withCandidates(withMeta("margin: { unit: 'ratio', limit: 'min' },"))
  ]
]) {
  test(`validate-rule rejects ${label}`, () => {
    assert.equal(validateSource(source), false);
  });
}

// The outcome contract on its own: the script looks rules up by id, so a
// modified copy of a built-in rule would run the built-in one.
const { validateOutcomeOccurrenceInvariants } = require('../scripts/validate-rule.js');
const accepts = (outcome, occurrences, isAutomatic) => {
  try {
    validateOutcomeOccurrenceInvariants({ outcome, occurrences }, isAutomatic);
    return true;
  } catch {
    return false;
  }
};
const OCC = [{ selector: 'html', html: '<html>' }];

test('a manual rule may pass, with no occurrences, as RULE_TAXONOMY.md §1.1 allows', () => {
  assert.equal(accepts('pass', [], false), true);
  assert.equal(accepts('pass', OCC, false), false);
});

test('a manual rule never fails, and asks with at least one occurrence', () => {
  assert.equal(accepts('fail', OCC, false), false);
  assert.equal(accepts('cantTell', OCC, false), true);
  assert.equal(accepts('cantTell', [], false), false);
  assert.equal(accepts('notApplicable', [], false), true);
});

test('an automatic rule may give any outcome, with occurrences only on fail or cantTell', () => {
  for (const o of ['fail', 'cantTell']) assert.equal(accepts(o, OCC, true), true, o);
  for (const o of ['pass', 'notApplicable']) assert.equal(accepts(o, [], true), true, o);
  assert.equal(accepts('fail', [], true), false);
  assert.equal(accepts('pass', OCC, true), false);
});
