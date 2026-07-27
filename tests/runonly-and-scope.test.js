'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const runDomRulesOnHtml = require('./helpers/runDomRulesOnHtml');
const { getCheckDefById } = require('../src/index.js');

/**
 * Helper: get a rule result by ruleId from domResult
 */
function findCheck(domResult, ruleId) {
    const checks = domResult && Array.isArray(domResult.checksResults) ? domResult.checksResults : [];
    return checks.find((r) => r && r.ruleId === ruleId) || null;
}

/**
 * Helper: list ruleIds from domResult
 */
function listCheckIds(domResult) {
    const checks = domResult && Array.isArray(domResult.checksResults) ? domResult.checksResults : [];
    return checks.map((r) => r.ruleId).filter(Boolean);
}

test('runOnly.includeRuleIds: runs ONLY the included rule IDs', () => {
    const html = `<!doctype html><html><body>
    <img src="x.png">
  </body></html>`;

    const result = runDomRulesOnHtml(html, {
        runOnly: {
            includeRuleIds: ['img-alt-present']
        }
    });

    assert.deepEqual(listCheckIds(result), ['img-alt-present']);
    assert.equal(findCheck(result, 'img-alt-present')?.outcome, 'fail');
});

test('runOnly.excludeRuleIds: exclude removes checks (exclude wins even if included)', () => {
    const html = `<!doctype html><html><body>
    <img src="x.png">
  </body></html>`;

    const result = runDomRulesOnHtml(html, {
        runOnly: {
            includeRuleIds: ['img-alt-present', 'area-alt-present'],
            excludeRuleIds: ['area-alt-present']
        }
    });

    const ids = listCheckIds(result);
    assert.ok(ids.includes('img-alt-present'));
    assert.ok(!ids.includes('area-alt-present'));
});

test('runOnly.tags: only runs checks whose tags intersect the provided tags', () => {
    const html = `<!doctype html><html><body>
    <img src="x.png">
    <input type="text">
  </body></html>`;

    const result = runDomRulesOnHtml(html, {
        runOnly: {
            tags: ['images']
        }
    });

    const ids = listCheckIds(result);
    assert.ok(ids.length > 0);

    // Every returned rule must have at least one of the requested tags.
    for (const id of ids) {
        const def = getCheckDefById(id);
        assert.ok(def, `Expected getCheckDefById(${id}) to return a definition`);
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

    const ids = listCheckIds(result);
    assert.ok(ids.length > 0);

    for (const id of ids) {
        const def = getCheckDefById(id);
        assert.ok(def, `Expected getCheckDefById(${id}) to return a definition`);
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
            includeRuleIds: ['img-alt-present', 'form-control-accessible-name'],
            tags: ['images']
        }
    });

    // Only the image rule should remain after tags filtering.
    assert.deepEqual(listCheckIds(result), ['img-alt-present']);
});

test('contextSelector limits scanning scope (image outside context => notApplicable)', () => {
    const html = `<!doctype html><html><body>
    <main id="ctx"></main>
    <img src="x.png">
  </body></html>`;

    const result = runDomRulesOnHtml(html, {
        contextSelector: '#ctx',
        runOnly: { includeRuleIds: ['img-alt-present'] }
    });

    assert.deepEqual(listCheckIds(result), ['img-alt-present']);
    assert.equal(findCheck(result, 'img-alt-present')?.outcome, 'notApplicable');
});

test('engineOptions.excludeSelectors excludes subtrees (image inside excluded => notApplicable)', () => {
    const html = `<!doctype html><html><body>
    <div class="excluded">
      <img src="x.png">
    </div>
  </body></html>`;

    const result = runDomRulesOnHtml(html, {
        engineOptions: { excludeSelectors: ['.excluded'] },
        runOnly: { includeRuleIds: ['img-alt-present'] }
    });

    assert.deepEqual(listCheckIds(result), ['img-alt-present']);
    assert.equal(findCheck(result, 'img-alt-present')?.outcome, 'notApplicable');
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
        runOnly: { includeRuleIds: ['img-alt-present'] }
    });

    // The image in excluded subtree is ignored, but the second image should trigger the rule.
    assert.equal(findCheck(result, 'img-alt-present')?.outcome, 'fail');
});
