'use strict';

const { standardsData } = require('../../src/coverage/standards');

// Tags that make a rule opt-in (ruleTag in src/coverage/standards.js).
const OPT_IN_RULE_TAGS = standardsData()
  .filter((s) => s.ruleTag)
  .map((s) => s.ruleTag);

function isOptInRule(tags) {
  return (Array.isArray(tags) ? tags : []).some((t) =>
    OPT_IN_RULE_TAGS.includes(String(t).toLowerCase())
  );
}

// The runOnly that makes a single rule run. Scripts pass `[ruleId]`, which the
// engine reads as no filter at all, so every default rule runs and the one
// asked about is among them. An opt-in rule is not a default rule and has to
// be named.
function runOnlyForRule(ruleId, tags) {
  return isOptInRule(tags) ? { includeRuleIds: [ruleId] } : [ruleId];
}

module.exports = { OPT_IN_RULE_TAGS, isOptInRule, runOnlyForRule };
