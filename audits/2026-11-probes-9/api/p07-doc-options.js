const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const { getChecksCatalog, getRulesForRunOnly } = require('@surea11y/core');
const engineOptions = {
  strictOptions: true, locale: 'en', wcagVersion: '2.2', wcagLevel: 'AA', profile: 'wcag22-aa', mappings: ['en301549'], optInRules: 'all',
  messages: { de: { } }, includeHiddenElements: false, includeShadowDom: true, fragment: false, embeddedAriaHidden: false, embeddedInert: false,
  topLevelDocument: true, assumeModal: false, excludeSelectors: ['#cookie-banner', '.third-party-widget'],
  styleSheetTexts: [{ href: 'https://cdn.example/site.css', text: '/* its CSS */' }], timestamp: '2026-07-20T12:00:00Z', perfStats: false, profileRules: false,
  contrast: { mode: 'strictConformance', rootCanvasFallback: '#ffffff', rootCanvasFallbackSet: true }, visibilityMode: undefined,
  policyContract: 'a11y', policy: { coerceManualFailToCantTell: true }, output: { includeSelector: true, includeHtml: true, detail: 'full' },
  rules: { 'some-rule-id': { excludeSelectors: ['.some-noisy-widget'] } }, probes: {}, customRules: [], pingWaitTime: 500, frameWaitTime: 60000
};
const html = '<html lang="en"><title>t</title><body><main><h1>x</h1></main></body></html>';
const warn = console.warn; const warns=[]; console.warn=(...a)=>warns.push(a.join(' '));
try { getChecksCatalog(engineOptions); console.log('catalog ok'); } catch(e) { console.log('catalog throws:', e.code, e.message.slice(0,400)); }
const eo2 = {...engineOptions, rules: {}}; 
try { const r = runa11yCoreOnHtml(html, { engineOptions: eo2, entryPointParity:false }); console.log('scan ok', r.engine.profile, r.engine.mappings, r.engine.optInRules); } catch(e) { console.log('scan throws:', e.code, e.message.slice(0,500)); }
const eo3 = {...engineOptions}; delete eo3.rules; delete eo3.optInRules; delete eo3.mappings;
try { const r = runa11yCoreOnHtml(html, { engineOptions: eo3, entryPointParity:false }); console.log('scan3 ok', r.engine.profile); } catch(e) { console.log('scan3 throws:', e.code, e.message.slice(0,500)); }
console.warn=warn; console.log(warns.map(w=>w.slice(0,200)).join('\n'));
