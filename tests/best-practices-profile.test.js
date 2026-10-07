'use strict';

// runOnly.bestPractices beside engineOptions.profile adds the best-practice
// rules to the profile's, for every profile the engine has
// (tests/helpers/bestPracticesProfile.js).

const core = require('../src/core');
const { NORMATIVE_STANDARDS } = require('../src/coverage/standards.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { checkBestPracticesWithProfile } = require('./helpers/bestPracticesProfile.js');

checkBestPracticesWithProfile({
  core,
  runOnHtml: runa11yCoreOnHtml,
  profiles: [
    'wcag22-aa',
    'section508',
    ...NORMATIVE_STANDARDS.flatMap((s) => Object.keys(s.profiles || {}))
  ]
});
