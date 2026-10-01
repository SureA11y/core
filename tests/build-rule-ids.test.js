'use strict';

/**
 * The build refuses a rule id that two rule files define, in one rules folder
 * or across two (core's and a profile's, or two profiles'). Without the check
 * the engine listed and ran both under one id.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { loadRuleModules } = require('../scripts/build-core.js');

const ROOT = path.join(__dirname, '..');
const RULE = path.join(ROOT, 'src', 'checks', 'automatic', 'img-alt-present.js');

function folderWith(names) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'surea11y-rule-ids-'));
  fs.mkdirSync(path.join(dir, 'automatic'));
  for (const name of names) fs.copyFileSync(RULE, path.join(dir, 'automatic', name));
  return dir;
}

test('the real rules folders load, with no id defined twice', () => {
  const ids = loadRuleModules().map((m) => m.ruleId);
  assert.equal(new Set(ids).size, ids.length);
});

test('two files with one rule id fail the build, in one folder or across two', () => {
  assert.throws(
    () => loadRuleModules([folderWith(['a.js', 'b.js'])]),
    /rule id "img-alt-present" is defined twice: .*a\.js and .*b\.js/
  );
  assert.throws(
    () => loadRuleModules([path.join(ROOT, 'src', 'checks'), folderWith(['copy.js'])]),
    /rule id "img-alt-present" is defined twice: src\/checks\/automatic\/img-alt-present\.js and .*copy\.js/
  );
});
