import { runDomRulesInPage, EngineOptions, ScanResult, getChecksCatalog, RunOnly } from '@surea11y/core';
const eo: EngineOptions = {
  locale: 'de',
  policyContract: 'generic',
  policy: { coerceManualFailToCantTell: false },
  output: { includeSelector: false },
  rules: { include: 'img-alt-present', 'aria-allowed-attr': { excludeSelectors: ['mat-x'] } },
  probes: { crawl: { pageTitles: { pages: [] } } },
  visibilityMode: 'styleAndGeometry',
  wcagVersion: '2.1',
  optInRules: 'all',
  contrast: { mode: 'auditorAssist' },
  polcyContract: 'typo-not-caught',
};
const r: ScanResult = runDomRulesInPage('u', ['#a', '.b'], eo, ['wcag2a']);
const r2 = runDomRulesInPage(null, null, null, { type: 'tag', values: ['wcag2a'] });
const r3 = runDomRulesInPage(undefined, '#x', { tags: { include: ['wcag2a'] } }, { includeRuleIds: 'a,b', includeMode: 'or' });
for (const c of r.checksResults) {
  const s: string = c.occurrences[0]?.selector ?? '';
  if (c.outcome === 'fail' && c.margin) console.log(c.margin.headroom, s);
  const occOutcome = (c.occurrences[0] as any)?.outcome;
}
const cm = r.contextMatch?.elementCount;
const ro: RunOnly = { tags: ['x'] };
const cat = getChecksCatalog({ mappings: 'en301549' });
console.log(r2.engine.locale.reason, r3.rulesResults[0]?.data.details.metrics.failCount, cm, ro, cat.length);
// Error code typed?
try { runDomRulesInPage(null, '#a['); } catch (e) { const code: string = (e as { code?: string }).code ?? ''; }
