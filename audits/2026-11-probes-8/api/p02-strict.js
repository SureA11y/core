const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const core = require('/home/user/core-r8/src/index.js');
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a"><button></button></main></body></html>';
const S = (o) => Object.assign({ strictOptions: true }, o);
const cases = {
  mapUnknown: S({ mappings: ['nope'] }),
  mapUnknownVersion: S({ mappings: ['en301549:V9'] }),
  mapCase: S({ mappings: ['EN301549:v4.1.1'] }),
  mapProto: S({ mappings: ['__proto__'] }),
  mapCtor: S({ mappings: ['constructor'] }),
  mapToString: S({ mappings: 'toString' }),
  mapHasOwn: S({ mappings: 'hasOwnProperty:V1' }),
  optInProto: S({ optInRules: ['__proto__'] }),
  optInCtor: S({ optInRules: 'constructor' }),
  optInALL: S({ optInRules: 'ALL' }),
  optInAllList: S({ optInRules: ['all'] }),
  optInEmpty: S({ optInRules: '' }),
  optInEmptyArr: S({ optInRules: [] }),
  exclBad: S({ excludeSelectors: ['main['] }),
  exclEmptyStr: S({ excludeSelectors: [''] }),
  exclWs: S({ excludeSelectors: ['  '] }),
  exclComma: S({ excludeSelectors: 'main, ' }),
  exclPseudoEl: S({ excludeSelectors: ['p::before'] }),
  exclHas: S({ excludeSelectors: [':has(img)'] }),
  ruleExclBad: S({ rules: { 'img-alt-present': { excludeSelectors: ['[[['] } } }),
  ruleExclBadUnknownRule: S({ rules: { 'no-such-rule': { excludeSelectors: ['[[['] } } }),
  ruleExclNum: S({ rules: { 'img-alt-present': { excludeSelectors: 5 } } }),
  ruleUpperId: S({ rules: { 'IMG-ALT-PRESENT': { excludeSelectors: ['[[['] } } }),
  strictStr: { strictOptions: 'true', bogus: 1 },
  strictStrYes: { strictOptions: 'yes', bogus: 1 },
  strictTRUE: { strictOptions: 'TRUE', bogus: 1 },
  strict2: { strictOptions: 2, bogus: 1 },
  localeBad: S({ locale: 'xx-YY' }),
  localeProto: S({ locale: '__proto__' }),
  localeNum: S({ locale: 5 }),
  wcagVersion3: S({ wcagVersion: '3.0' }),
  wcagVersionNum: S({ wcagVersion: 2.1 }),
  wcagLevelBad: S({ wcagLevel: 'AAAA' }),
  timestampBad: S({ timestamp: 'yesterday' }),
  timestampNum: S({ timestamp: 5 }),
  outputBad: S({ output: { detail: 'all' } }),
  outputExtra: S({ output: { foo: 1 } }),
  contrastExtra: S({ contrast: { bogus: 1 } }),
  contrastMode: S({ contrast: { mode: 'x' } }),
  policyBad: S({ policyContract: 'nope' }),
  policyKey: S({ policy: { bogus: 1 } }),
  policyOutcome: S({ policy: { allowedOutcomes: ['fail', 'maybe'] } }),
  tagsExclBad: S({ tags: { exclude: ['nope-tag'] } }),
  rulesExclBad: S({ rules: { exclude: ['nope-rule'] } }),
  testsBad: S({ tests: { foo: 1 } }),
  visBad: S({ visibilityMode: 'x' }),
  includeModeBad: S({ includeMode: 'xor' }),
  profileProto: S({ profile: '__proto__' }),
  profileArrEmpty: S({ profile: [] }),
  profileArrDup: S({ profile: ['wcag22-aa', 'WCAG22-AA'] }),
  styleSheetBad: S({ styleSheetTexts: [{ href: 5 }] }),
  messagesBad: S({ messages: { en: 'x' } }),
  messagesProto: S({ messages: JSON.parse('{"__proto__":{"a":"b"}}') }),
  perfStr: S({ perfStats: 'yes' }),
  customRulesObj: S({ customRules: {} }),
  packsObj: S({ packs: {} }),
  probesFn: S({ probes: () => 1 }),
  pingNeg: S({ pingWaitTime: -1 }),
  pingNaN: S({ pingWaitTime: NaN }),
  fragmentStr: S({ fragment: 'yes' }),
  logUntested: S({ logUntestedWcag: 'no' }),
};
(async () => {
  const origWarn = console.warn; let warns = [];
  console.warn = (...a) => warns.push(a.join(' '));
  for (const [k, eo] of Object.entries(cases)) {
    warns = [];
    let line;
    try { const r = await runa11yCoreOnHtml(html, { engineOptions: eo, runOnly: ['img-alt-present'] }); line = 'OK  mappings=' + JSON.stringify(r.engine.mappings) + ' optIn=' + JSON.stringify(r.engine.optInRules) + ' locale=' + JSON.stringify(r.engine.locale && (r.engine.locale.resolved||r.engine.locale)); }
    catch (e) { line = 'THROW ' + (e.code || '') + ' ' + e.message.slice(0, 150).replace(/\n/g,' '); }
    let cat; try { core.getChecksCatalog(eo); cat='catOK'; } catch(e) { cat = 'catTHROW'; }
    console.log(k.padEnd(22), cat, line, warns.length ? ' WARN:' + warns.map(w=>w.slice(0,90)).join(' | ') : '');
  }
})();
