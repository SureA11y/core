'use strict';

/**
 * Where rules live: core's own under src/checks/, and each profile's under
 * the `rulesDir` its entry in profiles/index.js gives (profiles/<name>/rules/).
 * Each folder holds an automatic/ and a manual/ subfolder. The build, the
 * validators and the generated docs read every folder this returns, so a
 * profile's rules are built and checked like core's.
 *
 * Their tests and scenario pages follow the same split: core's in
 * tests/engine-checks/ and tests/fixtures/, a profile's in its tests/rules/
 * and tests/fixtures/, so a test reaches its page at ../../fixtures either way.
 */

const fs = require('fs');
const path = require('path');

const PROFILES = require('../../profiles');

const ROOT_DIR = path.join(__dirname, '..', '..');
const CORE_RULES_DIR = path.join(ROOT_DIR, 'src', 'checks');

// Every rule folder, core's first, then the profiles' in registry order.
function ruleDirs() {
  return [CORE_RULES_DIR].concat(PROFILES.map((p) => p.rulesDir).filter(Boolean));
}

// The folders holding rules of one type ('automatic' or 'manual') that exist.
function ruleTypeDirs(type) {
  return ruleDirs()
    .map((dir) => path.join(dir, type))
    .filter((dir) => fs.existsSync(dir));
}

// The rule tests and scenario pages of every rules folder, core's first:
// [{ testsDir, fixturesDir }].
function ruleTestDirs() {
  return [
    {
      testsDir: path.join(ROOT_DIR, 'tests', 'engine-checks'),
      fixturesDir: path.join(ROOT_DIR, 'tests', 'fixtures')
    }
  ].concat(
    PROFILES.filter((p) => p.rulesDir).map((p) => {
      const tests = path.join(path.dirname(p.rulesDir), 'tests');
      return { testsDir: path.join(tests, 'rules'), fixturesDir: path.join(tests, 'fixtures') };
    })
  );
}

module.exports = { ROOT_DIR, CORE_RULES_DIR, ruleDirs, ruleTypeDirs, ruleTestDirs };
