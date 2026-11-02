'use strict';

// runOnly.bestPractices beside engineOptions.profile adds the best-practice
// rules to the profile's, for every profile the engine has
// (tests/helpers/bestPracticesProfile.js).

const core = require('../src/core');
const { NORMATIVE_STANDARDS } = require('../src/coverage/standards.js');
const { WCAG_PROFILE_TAGS } = require('../src/core/prepare-catalog');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { checkBestPracticesWithProfile } = require('./helpers/bestPracticesProfile.js');

checkBestPracticesWithProfile({
  core,
  runOnHtml: runa11yCoreOnHtml,
  profiles: [
    ...Object.keys(WCAG_PROFILE_TAGS),
    ...NORMATIVE_STANDARDS.flatMap((s) => Object.keys(s.profiles || {}))
  ]
});
