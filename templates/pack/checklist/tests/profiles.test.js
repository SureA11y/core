'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const pack = require('..');

const PAGE = `<!doctype html><html lang="en"><head><title>Home</title></head><body>
  <main>
    <h1>Shop</h1>
    <h2>Offers</h2>
    <img src="logo.png">
    <p style="color:#767676;background:#fff">Grey text</p>
    <a href="/offers">Read more</a>
    <a href="/report" target="_blank">Annual report</a>
  </main>
</body></html>`;

const OWN = [
  '__NAMESPACE__-contrast-enhanced',
  '__NAMESPACE__-link-text-specific',
  '__NAMESPACE__-new-window-review'
];

const scan = (profile) => runa11yCoreOnHtml(PAGE, { engineOptions: { packs: [pack], profile } });
const ran = (result) => result.checksResults.map((c) => c.ruleId);
const check = (result, id) => result.checksResults.find((c) => c.ruleId === id);

test('the policy profile: WCAG 2.2 A and AA, two best-practice rules, the 7:1 variant', () => {
  const result = scan('__NAMESPACE__-policy');
  assert.equal(result.engine.profile, '__NAMESPACE__-policy');
  const ids = ran(result);
  for (const id of ['img-alt-present', 'link-name-present', 'region', 'heading-order', ...OWN]) {
    assert.ok(ids.includes(id), `${id} runs`);
  }
  assert.ok(!ids.includes('contrast-minimum'), 'core contrast-minimum is excluded');
  // A missing alt is critical under the policy; the rule's own severity is kept.
  assert.equal(check(result, 'img-alt-present').severity, 'critical');
  assert.equal(check(result, 'img-alt-present').ruleSeverity, 'serious');
  assert.equal(check(result, '__NAMESPACE__-contrast-enhanced').outcome, 'fail');
});

test("the checklist's items are results of their own", () => {
  const items = scan('__NAMESPACE__-policy').rulesResults.filter((r) =>
    r.ruleId.startsWith('__NAMESPACE__-')
  );
  assert.deepEqual(items.map((r) => [r.ruleId, r.outcome]).sort(), [
    ['__NAMESPACE__-contrast', 'fail'],
    ['__NAMESPACE__-images', 'fail'],
    ['__NAMESPACE__-links', 'fail']
  ]);
});

test('the quick profile runs exactly its list and the pack rules', () => {
  const result = scan('__NAMESPACE__-quick');
  assert.deepEqual(
    ran(result).sort(),
    ['img-alt-present', 'link-name-present', 'page-title-present', ...OWN].sort()
  );
});

test('without a profile of the pack, its rules and items stay out of a scan', () => {
  const result = runa11yCoreOnHtml(PAGE, { engineOptions: { packs: [pack] } });
  assert.ok(!ran(result).some((id) => id.startsWith('__NAMESPACE__-')));
  assert.ok(!result.rulesResults.some((r) => r.ruleId.startsWith('__NAMESPACE__-')));
});
