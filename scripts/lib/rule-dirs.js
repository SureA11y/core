'use strict';

/**
 * Where rules live: core's own under src/checks/, and each profile's under
 * the `rulesDir` its entry in profiles/index.js gives (profiles/<name>/rules/).
 * Each folder holds an automatic/ and a manual/ subfolder. The build, the
 * validators and the generated docs read every folder this returns, so a
 * profile's rules are built and checked like core's.
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

module.exports = { ROOT_DIR, CORE_RULES_DIR, ruleDirs, ruleTypeDirs };
