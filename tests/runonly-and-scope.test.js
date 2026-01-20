'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const runDomRulesOnHtml = require('./helpers/runDomRulesOnHtml');
const { getRuleDefById } = require('../src/index.js');

/**
 * Helper: get a rule result by ruleId from domResult
 */
function findRule(domResult, ruleId) {
    const rules = domResult && Array.isArray(domResult.rules) ? domResult.rules : [];
    return rules.find((r) => r && r.ruleId === ruleId) || null;
}

/**
 * Helper: list ruleIds from domResult
 */
function listRuleIds(domResult) {
    const rules = domResult && Array.isArray(domResult.rules) ? domResult.rules : [];
    return rules.map((r) => r.ruleId).filter(Boolean);
}

test('runOnly.includeRuleIds: runs ONLY the included rule IDs', () => {
    const html = `<!doctype html><html><body>
    <img src="x.png">
  </body></html>`;

    const result = runDomRulesOnHtml(html, {
        runOnly: {
            includeRuleIds: ['a11ycore-img-alt-present']
        }
    });

    assert.deepEqual(listRuleIds(result), ['a11ycore-img-alt-present']);
    assert.equal(findRule(result, 'a11ycore-img-alt-present')?.outcome, 'fail');
});

test('runOnly.excludeRuleIds: exclude removes rules (exclude wins even if included)', () => {
    const html = `<!doctype html><html><body>
    <img src="x.png">
  </body></html>`;

    const result = runDomRulesOnHtml(html, {
        runOnly: {
            includeRuleIds: ['a11ycore-img-alt-present', 'a11ycore-area-alt-present'],
            excludeRuleIds: ['a11ycore-area-alt-present']
        }
    });

    const ids = listRuleIds(result);
    assert.ok(ids.includes('a11ycore-img-alt-present'));
    assert.ok(!ids.includes('a11ycore-area-alt-present'));
});

test('runOnly.tags: only runs rules whose tags intersect the provided tags', () => {
    const html = `<!doctype html><html><body>
    <img src="x.png">
    <input type="text">
  </body></html>`;

    const result = runDomRulesOnHtml(html, {
        runOnly: {
            tags: ['images']
        }
    });

    const ids = listRuleIds(result);
    assert.ok(ids.length > 0);

    // Every returned rule must have at least one of the requested tags.
    for (const id of ids) {
        const def = getRuleDefById(id);
        assert.ok(def, `Expected getRuleDefById(${id}) to return a definition`);
        const tags = Array.isArray(def.tags) ? def.tags : [];
        assert.ok(tags.includes('images'), `Expected ${id} to include tag "images"`);
    }
});

test('runOnly legacy shape: { type:"tag", values:[...] } still works', () => {
    const html = `<!doctype html><html><body>
    <img src="x.png">
    <input type="text">
  </body></html>`;

    const result = runDomRulesOnHtml(html, {
        runOnly: { type: 'tag', values: ['images'] }
    });

    const ids = listRuleIds(result);
    assert.ok(ids.length > 0);

    for (const id of ids) {
        const def = getRuleDefById(id);
        assert.ok(def, `Expected getRuleDefById(${id}) to return a definition`);
        const tags = Array.isArray(def.tags) ? def.tags : [];
        assert.ok(tags.includes('images'), `Expected ${id} to include tag "images"`);
    }
});

test('runOnly include + tags: both must match (tags refine include list)', () => {
    const html = `<!doctype html><html><body>
    <img src="x.png">
    <input type="text">
  </body></html>`;

    const result = runDomRulesOnHtml(html, {
        runOnly: {
            includeRuleIds: ['a11ycore-img-alt-present', 'a11ycore-form-control-accessible-name'],
            tags: ['images']
        }
    });

    // Only the image rule should remain after tags filtering.
    assert.deepEqual(listRuleIds(result), ['a11ycore-img-alt-present']);
});

test('contextSelector limits scanning scope (image outside context => notApplicable)', () => {
    const html = `<!doctype html><html><body>
    <main id="ctx"></main>
    <img src="x.png">
  </body></html>`;

    const result = runDomRulesOnHtml(html, {
        contextSelector: '#ctx',
        runOnly: { includeRuleIds: ['a11ycore-img-alt-present'] }
    });

    assert.deepEqual(listRuleIds(result), ['a11ycore-img-alt-present']);
    assert.equal(findRule(result, 'a11ycore-img-alt-present')?.outcome, 'notApplicable');
});

test('engineOptions.excludeSelectors excludes subtrees (image inside excluded => notApplicable)', () => {
    const html = `<!doctype html><html><body>
    <div class="excluded">
      <img src="x.png">
    </div>
  </body></html>`;

    const result = runDomRulesOnHtml(html, {
        engineOptions: { excludeSelectors: ['.excluded'] },
        runOnly: { includeRuleIds: ['a11ycore-img-alt-present'] }
    });

    assert.deepEqual(listRuleIds(result), ['a11ycore-img-alt-present']);
    assert.equal(findRule(result, 'a11ycore-img-alt-present')?.outcome, 'notApplicable');
});

test('contextSelector + excludeSelectors together: excluded inside context is ignored', () => {
    const html = `<!doctype html><html><body>
    <main id="ctx">
      <div class="excluded">
        <img src="x.png">
      </div>
      <img src="y.png">
    </main>
  </body></html>`;

    const result = runDomRulesOnHtml(html, {
        contextSelector: '#ctx',
        engineOptions: { excludeSelectors: ['.excluded'] },
        runOnly: { includeRuleIds: ['a11ycore-img-alt-present'] }
    });

    // The image in excluded subtree is ignored, but the second image should trigger the rule.
    assert.equal(findRule(result, 'a11ycore-img-alt-present')?.outcome, 'fail');
});
