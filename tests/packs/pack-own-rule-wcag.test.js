'use strict';

// A checklist pack's own rule (tagged with the namespace) that names the WCAG
// criteria it checks in `meta.wcagSc`, as PACKS.md's example does, passed
// definePack and checkPack and then made every scan skip the pack: EN 301 549
// maps every rule by its WCAG criteria, so it claimed the pack's rule, and
// the check that one standard doesn't map another's rules refused the pack.
// A standard's own rule now counts only in its own standard; only a standard
// that names it by id couples the two.

const test = require('node:test');
const assert = require('node:assert/strict');

const { definePack } = require('../../src/pack.js');
const { runa11yCoreOnHtml } = require('../../src/testing.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>x</main></body></html>';

const pack = definePack({
  name: '@aaa/policy',
  version: '1.2.0',
  namespace: 'aaa',
  core: '*',
  title: 'AAA policy',
  profiles: { 'aaa-policy': { tags: [] } },
  rules: [
    {
      id: 'aaa-images',
      meta: { title: 'Images', tags: ['aaa'], wcagSc: ['1.1.1'] },
      runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body }] })
    }
  ]
});

test("a checklist pack's own rule that names WCAG criteria runs, and EN 301 549 doesn't claim it", () => {
  const warnings = [];
  const warn = console.warn;
  console.warn = (...a) => warnings.push(a.join(' '));
  let result;
  try {
    result = runa11yCoreOnHtml(PAGE, {
      engineOptions: { packs: [pack], profile: 'aaa-policy' },
      entryPointParity: false
    });
  } finally {
    console.warn = warn;
  }
  assert.ok(!warnings.some((w) => /skipp/i.test(w)), warnings.join('\n'));
  const check = result.checksResults.find((c) => c.ruleId === 'aaa-images');
  assert.ok(check, 'the rule ran');
  assert.equal(check.outcome, 'fail');
  const standards = (check.meta.normativeMappings || []).map((m) => m.standard || 'WCAG');
  assert.ok(standards.includes('WCAG'));
  assert.ok(!standards.includes('EN 301 549'), JSON.stringify(standards));
});
