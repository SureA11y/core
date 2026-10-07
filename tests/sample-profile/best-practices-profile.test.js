'use strict';

// runOnly.bestPractices beside the sample profile, which has opt-in rules of
// its own, rules it runs by id (mappedRules), its own rollups and, in 2.0,
// an exclusion: the best-practice rules are added, and the profile's rules,
// opt-in rules and rollups stay as they are
// (tests/helpers/bestPracticesProfile.js).

const { requireSample } = require('../helpers/sampleEngine');

const core = requireSample('src/core.js');
const { runa11yCoreOnHtml } = requireSample('tests/helpers/runDomRulesOnHtml.js');
const { checkBestPracticesWithProfile } = requireSample('tests/helpers/bestPracticesProfile.js');

checkBestPracticesWithProfile({
  core,
  runOnHtml: runa11yCoreOnHtml,
  profiles: ['sample-1.0', 'sample-2.0']
});
