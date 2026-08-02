'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../src/core'); // must export getRulesCatalog (your build-core does)
const runDomRulesOnHtml = require('./helpers/runDomRulesOnHtml');

function computeExpectedCompositeOutcome(checksIds, atomicById) {
  const ids = Array.isArray(checksIds) ? checksIds : [];
  if (ids.length === 0) return 'cantTell';

  let fail = 0;
  let cantTell = 0;
  let notApplicable = 0;
  let pass = 0;
  let missing = 0;

  for (const tid of ids) {
    const rr = atomicById.get(tid);
    if (!rr) {
      missing += 1;
      continue;
    }
    const out = rr.outcome;
    if (out === 'fail') fail += 1;
    else if (out === 'cantTell') cantTell += 1;
    else if (out === 'notApplicable') notApplicable += 1;
    else if (out === 'pass') pass += 1;
    else cantTell += 1; // defensive
  }

  // Must match your engine rollup precedence
  if (fail > 0) return 'fail';
  if (cantTell > 0) return 'cantTell';
  if (missing > 0) return 'cantTell';
  if (ids.length > 0 && notApplicable === ids.length) return 'notApplicable';
  return 'pass';
}

test('rulesResults are emitted and correspond to composite catalog', async () => {
  assert.equal(typeof core.getRulesCatalog, 'function', 'Expected core.getRulesCatalog to exist');

  const compositeCatalog = core.getRulesCatalog();
  assert.ok(Array.isArray(compositeCatalog), 'Expected composite catalog to be an array');
  assert.ok(compositeCatalog.length > 0, 'Expected at least 1 composite rule in catalog');

  // HTML designed to trigger failures in common "name present" checks:
  const html = `
    <!doctype html>
    <html>
      <head><title>Composite test</title></head>
      <body>
        <button></button>
        <a href="#"></a>
        <input type="checkbox">
        <input type="text">
        <div role="dialog"></div>
        <div role="combobox" aria-expanded="false"></div>
        <div role="listbox"></div>
        <div role="menuitem"></div>
      </body>
    </html>
  `;

  const result = await runDomRulesOnHtml(html, {
    // Ensure no filtering is applied:
    runOnly: null,
    engineOptions: { locale: 'en' }
  });

  // 1) Basic: rulesResults must exist and have entries
  assert.ok(result && typeof result === 'object', 'Expected result to be an object');
  assert.ok(Array.isArray(result.checksResults), 'Expected result.checksResults to be an array');
  assert.ok(Array.isArray(result.rulesResults), 'Expected result.rulesResults to be an array');

  // This is the key assertion you want right now:
  assert.ok(
    result.rulesResults.length === compositeCatalog.length,
    `Expected rulesResults.length (${result.rulesResults.length}) to equal compositeCatalog.length (${compositeCatalog.length})`
  );

  // 2) Validate rollup correctness for each composite
  const atomicById = new Map();
  for (const rr of result.checksResults) {
    if (rr && typeof rr === 'object' && typeof rr.ruleId === 'string') {
      atomicById.set(rr.ruleId, rr);
    }
  }

  const compositeById = new Map();
  for (const cr of result.rulesResults) {
    if (cr && typeof cr === 'object' && typeof cr.ruleId === 'string') {
      compositeById.set(cr.ruleId, cr);
    }
  }

  for (const comp of compositeCatalog) {
    const cid = String(comp.id || '').trim();
    const checksIds = Array.isArray(comp.checksIds) ? comp.checksIds : [];

    assert.ok(cid, 'Composite catalog entry missing id');
    assert.ok(compositeById.has(cid), `Missing composite result for id=${cid}`);

    const expected = computeExpectedCompositeOutcome(checksIds, atomicById);
    const actual = compositeById.get(cid).outcome;

    assert.equal(
      actual,
      expected,
      `Composite ${cid} outcome mismatch: expected ${expected}, got ${actual}`
    );
  }
});

test('composite severity is the max severity of failing contributors', async () => {
  const compositeCatalog = core.getRulesCatalog();

  // Pick a composite that will fail in the fixture HTML.
  // The existing HTML in the other test triggers many "name present" failures,
  // and should cause the WCAG 4.1.2-name composite to exist.
  const compositeId = 'wcag-4.1.2-name';

  // Ensure it exists in the catalog (otherwise test is meaningless)
  assert.ok(
    compositeCatalog.some((c) => String(c.id || '').trim() === compositeId),
    `Expected composite catalog to contain ${compositeId}`
  );

  // HTML designed to trigger accessible-name failures.
  const html = `
    <!doctype html>
    <html>
      <head><title>Composite severity test</title></head>
      <body>
        <button></button>
        <a href="#"></a>
        <input type="checkbox">
        <input type="text">
        <div role="dialog"></div>
        <div role="combobox" aria-expanded="false"></div>
        <div role="listbox"></div>
        <div role="menuitem"></div>
      </body>
    </html>
  `;

  const result = await runDomRulesOnHtml(html, {
    runOnly: null,
    engineOptions: { locale: 'en' }
  });

  assert.ok(Array.isArray(result.checksResults), 'Expected result.checksResults to be an array');
  assert.ok(Array.isArray(result.rulesResults), 'Expected result.rulesResults to be an array');

  // Index atomic results by ruleId
  const atomicById = new Map();
  for (const rr of result.checksResults) {
    if (rr && typeof rr.ruleId === 'string') atomicById.set(rr.ruleId, rr);
  }

  // Find our composite
  const comp = result.rulesResults.find((r) => r && r.ruleId === compositeId);
  assert.ok(comp, `Expected composite result for ${compositeId}`);
  assert.equal(comp.outcome, 'fail', `Expected ${compositeId} to fail in this fixture`);

  // Read contributors from composite details
  const contributors =
    comp && comp.data && comp.data.details && Array.isArray(comp.data.details.contributors)
      ? comp.data.details.contributors
      : [];

  assert.ok(contributors.length > 0, 'Expected contributors list to be non-empty');

  // Compute expected rolled-up severity: max severity among FAIL contributors
  const SEV_RANK = { minor: 1, moderate: 2, serious: 3, critical: 4 };
  function normSev(s) {
    const v = typeof s === 'string' ? s.trim().toLowerCase() : '';
    return SEV_RANK[v] ? v : null;
  }

  let expected = null;
  for (const c of contributors) {
    if (!c || c.outcome !== 'fail') continue;
    const rr = atomicById.get(c.testId);
    const sev = rr ? normSev(rr.severity) : null;
    if (!sev) continue;
    if (!expected || SEV_RANK[sev] > SEV_RANK[expected]) expected = sev;
  }

  // If nothing had a known severity, your engine falls back to composite default.
  // But in practice for these rules we expect at least one failing child w/ known severity.
  assert.ok(expected, 'Expected at least one failing child with a recognized severity');
  assert.equal(comp.severity, expected, `Expected composite severity to roll up to ${expected}`);
});
