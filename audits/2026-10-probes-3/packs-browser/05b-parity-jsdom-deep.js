'use strict';
// Deep equality of whole results, in jsdom, between runa11yCoreInPage on a
// registered pack (packScript) and runDomRulesInPage with the pack objects,
// over option combinations the repo's test does not cover. Layout is the
// same on both sides here, so any difference is the pack path's.
const path = require('path');
const util = require('util');
const L = require('./lib');
const sample = require(path.join(L.ROOT, 'tests/fixtures/packs/sample.js'));
const { packScript } = L.packApi;
const checklist = L.packApi.definePack({
  name: '@acme/policy', version: '2.0.0', namespace: 'acme', core: '*', title: 'Acme Policy',
  overrides: ['page-title-present'],
  rules: [
    { id: 'acme-always-fail', meta: { title: 'Acme always fails', tags: ['acme'], i18n: { titleKey: 'acmeAlwaysFail_title', descriptionKey: 'acmeAlwaysFail_description' } }, runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body, i18n: { summaryKey: 'acmeAlwaysFail_summary', params: { n: 1 } } }] }) },
    { id: 'page-title-present', runInPage: () => ({ outcome: 'pass' }) }
  ],
  variants: [{ id: 'acme-contrast', from: 'contrast-minimum', config: { normalTextRatio: 7, largeTextRatio: 4.5 }, meta: { title: 'c7', tags: ['acme'], i18n: { titleKey: 'acmeContrast_title', descriptionKey: 'acmeContrast_description' } } }],
  profiles: { 'acme-policy': { tags: ['wcag2a', 'wcag2aa'], rules: ['region'], exclude: { criteria: ['2.5.8'] }, severity: { 'img-alt-present': 'critical' } } },
  rollups: [{ id: 'acme-item', title: 'Acme item', checksIds: ['acme-always-fail', 'img-alt-present'] }],
  dictionaries: {
    en: { acmeAlwaysFail_title: 'Always', acmeAlwaysFail_description: 'd', acmeAlwaysFail_summary: 'Fails {n}', acmeContrast_title: 'c7', acmeContrast_description: 'd7' },
    fr: { acmeAlwaysFail_title: 'Toujours', acmeAlwaysFail_description: 'd', acmeAlwaysFail_summary: 'Échoue {n}', acmeContrast_title: 'c7', acmeContrast_description: 'd7' }
  }
});
const HTML = '<!doctype html><html><head><title>t</title></head><body><main><img src="a.png"><a href="/x">click here</a><p style="color:#767676;background:#fff">Grey</p></main></body></html>';

function scan(fn, eo, runOnly) {
  const dom = new L.JSDOM(HTML, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    return fn('https://example.test/', null, { timestamp: L.TS, ...eo }, runOnly);
  } catch (e) {
    return { threw: e.message.slice(0, 200) };
  } finally {
    dom.window.close();
  }
}
const firstDiff = (a, b, p = '') => {
  if (util.isDeepStrictEqual(a, b)) return null;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const d = firstDiff(a[k], b[k], `${p}.${k}`);
      if (d) return d;
    }
  }
  return `${p}: node ${JSON.stringify(a) && JSON.stringify(a).slice(0, 150)} | page ${JSON.stringify(b) && JSON.stringify(b).slice(0, 150)}`;
};

const combos = [
  [[checklist], { profile: 'acme-policy' }],
  [[checklist], { profile: 'acme-policy', locale: 'fr' }],
  [[checklist], { profile: 'acme-policy', locale: 'de' }],
  [[checklist], { profile: 'acme-policy', output: { detail: 'findings' } }],
  [[checklist], { optInRules: ['acme'] }],
  [[checklist], {}, ['acme-always-fail', 'acme-contrast']],
  [[checklist], { wcag: { version: '2.1', level: 'A' } }],
  [[sample], { profile: 'sample-2.0', locale: 'ja' }],
  [[sample, checklist], { mappings: ['sample', 'en301549'], locale: 'fr' }],
  [[sample, checklist], { profile: 'sample-1.0', strictOptions: true }],
  [[checklist], { profile: 'no-such-profile' }],
  [[checklist], { profile: 'acme-policy', excludeSelectors: ['img'] }]
];
for (const [packs, eo, runOnly] of combos) {
  const names = packs.map((p) => `${p.name}@${p.version}`);
  delete globalThis.__surea11yPacks;
  new Function(packScript(packs))();
  const w = console.warn;
  const warns = { node: [], page: [] };
  console.warn = (...a) => warns.node.push(a.join(' ').slice(0, 120));
  const node = scan(L.main.runDomRulesInPage, { packs, ...eo }, runOnly);
  console.warn = (...a) => warns.page.push(a.join(' ').slice(0, 120));
  const page = scan(L.main.runa11yCoreInPage, { packs: names, ...eo }, runOnly);
  console.warn = w;
  delete globalThis.__surea11yPacks;
  L.log(`${names.join('+')} ${JSON.stringify(eo)} ${runOnly ? JSON.stringify(runOnly) : ''}`, { equal: util.isDeepStrictEqual(node, page), firstDiff: firstDiff(node, page), warnsEqual: util.isDeepStrictEqual(warns.node, warns.page), warns: util.isDeepStrictEqual(warns.node, warns.page) ? warns.node.slice(0, 2) : warns });
}
