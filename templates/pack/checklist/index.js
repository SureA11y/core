'use strict';

/**
 * __TITLE__: a checklist pack for @surea11y/core.
 *
 * A checklist is an organisation's own policy: profiles that choose which
 * rules run (core's and the pack's), and rollups that group rules into the
 * items of the checklist. Pass the pack to a scan and name a profile:
 *
 *   runDomRulesInPage(url, null, { packs: [pack], profile: '__NAMESPACE__-policy' })
 */

const { definePack, wcagTags } = require('@surea11y/core/pack');
const { name, version } = require('./package.json');

module.exports = definePack({
  name,
  version,
  title: '__TITLE__', // what results and reports call the checklist
  namespace: '__NAMESPACE__', // every rule, rollup and profile id starts with "__NAMESPACE__-"
  core: '__CORE__', // the core versions the pack works with

  // The pack's own rules, one module each. A variant of a core rule (from:)
  // is listed here too.
  rules: [
    require('./rules/automatic/__NAMESPACE__-link-text-specific'),
    require('./rules/automatic/__NAMESPACE__-contrast-enhanced'),
    require('./rules/manual/__NAMESPACE__-new-window-review')
  ],

  // What a scan runs under each profile. A profile selects rules by tag
  // (`tags`), adds rules by id (`rules`), leaves rules out (`exclude`) and may
  // give a rule another severity (`severity`). The pack's own rules, tagged
  // "__NAMESPACE__", run under every profile of the pack.
  profiles: {
    // Core's WCAG 2.2 A and AA rules, two of core's best-practice rules no
    // WCAG tag selects, and the pack's own rules; core's 4.5:1 contrast rule
    // gives way to the pack's 7:1 variant, and a missing alt is critical.
    '__NAMESPACE__-policy': {
      tags: wcagTags('2.2', ['A', 'AA']),
      rules: ['region', 'heading-order'],
      exclude: { rules: ['contrast-minimum'] },
      severity: { 'img-alt-present': 'critical' }
    },
    // Exactly these core rules, and the pack's own: a quick check.
    '__NAMESPACE__-quick': {
      tags: [],
      rules: ['img-alt-present', 'link-name-present', 'page-title-present']
    }
  },

  // The checklist's items: each groups rules into one result, which fails
  // when one of them fails. Results, the HTML report, SARIF and JUnit show
  // them under the checklist's title.
  rollups: [
    {
      id: '__NAMESPACE__-images',
      title: 'Images have a text alternative',
      checksIds: ['img-alt-present']
    },
    {
      id: '__NAMESPACE__-links',
      title: 'Links say where they go',
      checksIds: [
        'link-name-present',
        '__NAMESPACE__-link-text-specific',
        '__NAMESPACE__-new-window-review'
      ]
    },
    {
      id: '__NAMESPACE__-contrast',
      title: 'Text contrast is at least 7:1',
      checksIds: ['__NAMESPACE__-contrast-enhanced']
    }
  ],

  // The rules' messages, per locale. A locale with no dictionary shows them
  // in English.
  dictionaries: { en: require('./i18n/en.json') }
});
