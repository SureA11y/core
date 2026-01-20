'use strict';

const test = require('node:test');
const assert = require('node:assert');

// This test validates the rule-tag taxonomy described in A11yCore-Rule-Taxonomy.md.
//
// Notes:
// - The engine runs `npm run build` before tests, so src/core.js is generated.
// - We validate *catalog* entries (RULE_DEFS), not implementation modules.

const { RULE_DEFS } = require('../../src/core.js');

const WORKFLOW_TAGS = ['automatic', 'manual'];

// Content categories (exactly one for WCAG-mapped rules)
const CATEGORY_TAGS = ['nontext', 'forms', 'media', 'structure', 'navigation'];

// Tags that represent outcomes (forbidden as rule tags)
const FORBIDDEN_OUTCOME_TAGS = ['pass', 'fail', 'canttell', 'notapplicable', 'inapplicable'];

// Optional level tags (not required)
const WCAG_LEVEL_TAGS = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21', 'wcag22'];

// Detect if a rule is WCAG-mapped in normative mappings
function isWcagMapped(ruleDef) {
  const maps = Array.isArray(ruleDef && ruleDef.normativeMappings) ? ruleDef.normativeMappings : [];
  return maps.some((m) => m && typeof m === 'object' && String(m.standard || '').toUpperCase() === 'WCAG');
}

// Detect SC tags like wcag111, wcag131, wcag243
function hasWcagScTag(tags) {
  return tags.some((t) => /^wcag\d{3,4}$/i.test(t)); // allow 3-4 digits
}

// Return lowercase tags array (defensive)
function normalizeTags(ruleDef) {
  const tags = Array.isArray(ruleDef && ruleDef.tags) ? ruleDef.tags : [];
  return tags.map((t) => String(t).trim()).filter(Boolean);
}

function xor(a, b) {
  return (a && !b) || (!a && b);
}

test('rule taxonomy: tags are lowercase + workflow tags are well-formed', () => {
  assert.ok(Array.isArray(RULE_DEFS), 'RULE_DEFS must be an array');

  for (const def of RULE_DEFS) {
    const tags = normalizeTags(def);

    // 1) tags must be lowercase (engine already lowercases at build time; enforce anyway)
    for (const t of tags) {
      assert.strictEqual(
        t,
        t.toLowerCase(),
        `Rule ${def.ruleId}: tag "${t}" must be lowercase`
      );
    }

    // 2) must not include outcome tags
    for (const bad of FORBIDDEN_OUTCOME_TAGS) {
      assert.ok(
        !tags.includes(bad),
        `Rule ${def.ruleId}: forbidden outcome tag "${bad}" (outcomes are not taxonomy tags)`
      );
    }

    // 3) exactly one workflow tag: automatic XOR manual
    const hasAutomatic = tags.includes('automatic');
    const hasManual = tags.includes('manual');
    assert.ok(
      xor(hasAutomatic, hasManual),
      `Rule ${def.ruleId}: must include exactly one of ${WORKFLOW_TAGS.join(' / ')}`
    );
  }
});

test('rule taxonomy: WCAG-mapped rules must include SC tag + exactly one content category', () => {
  for (const def of RULE_DEFS) {
    const tags = normalizeTags(def);

    if (!isWcagMapped(def)) {
      // Not WCAG-mapped: do not enforce WCAG-specific taxonomy constraints.
      continue;
    }

    // 4) Must include a WCAG SC tag (wcag111, wcag131, etc.)
    assert.ok(
      hasWcagScTag(tags),
      `Rule ${def.ruleId}: WCAG-mapped rules must include a WCAG SC tag like "wcag111"`
    );

    // 5) Must include exactly one primary content category tag
    const presentCats = CATEGORY_TAGS.filter((c) => tags.includes(c));
    assert.strictEqual(
      presentCats.length,
      1,
      `Rule ${def.ruleId}: WCAG-mapped rules must include exactly one content category tag (${CATEGORY_TAGS.join(', ')}). Got: ${presentCats.join(', ') || '(none)'}`
    );

    // 6) WCAG level tags are optional, but if present must be from allow-list
    const presentLevels = tags.filter((t) => /^wcag2\d[a]{0,2}$/.test(t) || t === 'wcag21' || t === 'wcag22');
    for (const lvl of presentLevels) {
      assert.ok(
        WCAG_LEVEL_TAGS.includes(lvl),
        `Rule ${def.ruleId}: unexpected WCAG level tag "${lvl}". Allowed: ${WCAG_LEVEL_TAGS.join(', ')}`
      );
    }
  }
});
