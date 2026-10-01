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
 *
 * So do the docs and records generated from them (ruleSources): core's
 * describe core's rules only, and a profile's sit in its own folder, laid out
 * as core's are at the repository root.
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

function source(key, root, rulesDir, testsDir) {
  return {
    key,
    root,
    rulesDir,
    testsDir,
    fixturesDir: path.join(root, 'tests', 'fixtures'),
    docsDir: path.join(root, 'docs'),
    dataDir: path.join(root, 'scripts', 'data')
  };
}

// Every set of rules with its own tests, docs and records, core's first, then
// each profile with rules, in registry order: { key, root, rulesDir, testsDir,
// fixturesDir, docsDir, dataDir }. A profile's paths are its folder's, in the
// same places under it as core's are under the repository root. A profile
// whose rules folder holds no rule yet, as profile:new leaves it, has none.
function ruleSources() {
  return [
    source('core', ROOT_DIR, CORE_RULES_DIR, path.join(ROOT_DIR, 'tests', 'engine-checks'))
  ].concat(
    PROFILES.filter((p) => p.rulesDir)
      .map((p) => {
        const root = path.dirname(p.rulesDir);
        return source(p.standard.key, root, p.rulesDir, path.join(root, 'tests', 'rules'));
      })
      .filter((src) => ruleIdsOf(src).size > 0)
  );
}

// The rule tests and scenario pages of every rules folder, core's first:
// [{ testsDir, fixturesDir }].
function ruleTestDirs() {
  return ruleSources().map(({ testsDir, fixturesDir }) => ({ testsDir, fixturesDir }));
}

// The ids of the rules a source holds (its rules folder's modules), in a Set.
function ruleIdsOf(src) {
  const ids = new Set();
  for (const type of ['automatic', 'manual']) {
    const dir = path.join(src.rulesDir, type);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.js')) continue;
      const mod = require(path.join(dir, file));
      if (mod && typeof mod.id === 'string') ids.add(mod.id);
    }
  }
  return ids;
}

module.exports = {
  ROOT_DIR,
  CORE_RULES_DIR,
  ruleDirs,
  ruleTypeDirs,
  ruleTestDirs,
  ruleSources,
  ruleIdsOf
};
