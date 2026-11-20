'use strict';

// aria-role-name-present's setting roles: 'wcag' (the default) checks grid,
// meter, progressbar, radiogroup and tree; 'all', a variant's, also checks
// the other name-from-author roles WAI-ARIA requires a name for, which no
// WCAG rule owns: application, marquee, table, tabpanel and treegrid. A WCAG
// scan is unchanged.

const test = require('node:test');
const assert = require('node:assert/strict');

const { definePack } = require('../../src/pack.js');
const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;

const UNNAMED = [
  '<div role="table" id="t1"><div role="row"><div role="cell">1</div></div></div>',
  '<div role="treegrid" id="t2"><div role="row"><div role="gridcell">1</div></div></div>',
  '<div role="tablist" aria-label="Tabs"><div role="tab" aria-selected="true">One</div></div><div role="tabpanel" id="t3">Panel</div>',
  '<div role="application" id="t4">App</div>',
  '<div role="marquee" id="t5">News</div>'
].join('');

const pack = definePack({
  name: 'roles-pack',
  version: '1.0.0',
  namespace: 'roles',
  core: '*',
  rules: [
    {
      id: 'roles-role-name-present',
      from: 'aria-role-name-present',
      config: { roles: 'all' },
      meta: {
        title: 'Every role that requires a name has one',
        description:
          'aria-role-name-present, for every name-from-author role WAI-ARIA requires a name for.',
        i18n: {
          titleKey: 'rolesRoleNamePresent_title',
          descriptionKey: 'rolesRoleNamePresent_description'
        },
        tags: ['roles']
      }
    }
  ],
  dictionaries: {
    en: {
      rolesRoleNamePresent_title: 'Every role that requires a name has one',
      rolesRoleNamePresent_description:
        'aria-role-name-present, for every role WAI-ARIA requires a name for.'
    }
  }
});

const ids = (check) =>
  (check ? check.occurrences : []).map((o) => (/id="(t\d)"/.exec(o.html) || [])[1]).sort();

test('by default the five roles no WCAG rule owns are left alone', () => {
  const result = runa11yCoreOnHtml(page(UNNAMED), { runOnly: ['aria-role-name-present'] });
  const check = result.checksResults.find((c) => c.ruleId === 'aria-role-name-present');
  assert.equal(check.outcome, 'notApplicable');
});

test("roles: 'all' asks about each of them, with the rule's own reason code", () => {
  const result = runa11yCoreOnHtml(page(UNNAMED), {
    engineOptions: { packs: [pack] },
    runOnly: ['roles-role-name-present']
  });
  const check = result.checksResults.find((c) => c.ruleId === 'roles-role-name-present');
  assert.equal(check.outcome, 'cantTell');
  assert.deepEqual(ids(check), ['t1', 't2', 't3', 't4', 't5']);
  for (const o of check.occurrences) assert.equal(o.data.details.reasonCode, 'name_missing');
});

test("roles: 'all' still accepts a name from aria-label, aria-labelledby, title or a caption", () => {
  const named = [
    '<div role="table" aria-label="Scores"><div role="row"><div role="cell">1</div></div></div>',
    '<span id="l">Panel</span><div role="tabpanel" aria-labelledby="l">Panel</div>',
    '<div role="application" title="Editor">App</div>',
    '<table role="table"><caption>Prices</caption><tr><td>1</td></tr></table>'
  ].join('');
  const result = runa11yCoreOnHtml(page(named), {
    engineOptions: { packs: [pack] },
    runOnly: ['roles-role-name-present']
  });
  const check = result.checksResults.find((c) => c.ruleId === 'roles-role-name-present');
  assert.equal(check.outcome, 'pass');
});

test('the setting is in the catalog', () => {
  const { getChecksCatalog } = require('../../src/index.js');
  const rule = getChecksCatalog().find((r) => r.ruleId === 'aria-role-name-present');
  const roles = rule.variantSettings.find((x) => x.name === 'roles');
  assert.deepEqual([roles.default, roles.values], ['wcag', ['wcag', 'all']]);
});
