import { runDomRulesInPage, getChecksForRunOnly, getRulesForRunOnly, getProfileWcagTarget, addHowToCheck, proceduresFor, listProcedures, procedureChecklist, renderProcedures, relatedRequirements, procedureLanguages, getLocaleCoverage, leaningFailures, getChecksCatalog, getCheckDefById, howToCheckFor, flattenCrossFrameResult, occurrenceOutcome, reviewGroupOf } from '@surea11y/core';
import type { EngineOptions, StrictEngineOptions, ScanResult } from '@surea11y/core';
import { buildBaselineEntries, matchBaseline, migrateBaselineEntries } from '@surea11y/core/baseline';
import { renderSarifReport } from '@surea11y/core/sarif';
import { renderJunitReport } from '@surea11y/core/junit';
import { renderHtmlReport } from '@surea11y/core/report';
import { definePack, wcagTags, standardFromData, deriveStandard, standardDataOf, checkPack, describePacks, packScript } from '@surea11y/core/pack';
import { applyHowToCheck } from '@surea11y/core/how-to-check';
import { proceduresFrom, procedureChecklistFrom, renderProceduresFrom } from '@surea11y/core/procedures';
import en from '@surea11y/core/procedures/en';
import ren from '@surea11y/core/review/en';
declare const url: string;
// ENGINE_OPTIONS examples
runDomRulesInPage(url, null, {}, { wcag: { version: '2.2', level: 'AA' }, bestPractices: true });
runDomRulesInPage(url, null, {}, { wcag: { version: '2.2', level: 'aa' } });
runDomRulesInPage(url, null, { profile: 'wcag21-aa' }, null);
runDomRulesInPage(url, null, { profile: ['wcag22-aa', 'wai-aria-1.2'] });
runDomRulesInPage(url, null, { optInRules: 'all' }, null);
runDomRulesInPage(url, null, { mappings: ['en301549:V3.2.1'] }, null);
runDomRulesInPage(url, null, {}, { includeRuleIds: ['img-alt-present', 'button-name-present'], excludeRuleIds: ['region'], tags: ['wcag412'], excludeTags: ['best-practice'], includeMode: 'and' });
runDomRulesInPage(url, null, {}, ['img-alt-present', 'button-name-present']);
runDomRulesInPage(url, null, {}, { type: 'tag', values: ['wcag2a', 'wcag2aa'] });
runDomRulesInPage(url, null, {}, { type: 'rule', values: new Set(['img-alt-present']) });
runDomRulesInPage(url, null, {}, { includeRuleIds: 'img-alt-present, button-name-present' });
runDomRulesInPage(url, null, { wcagVersion: '2.2', wcagLevel: 'AA' }, { includeRuleIds: ['contrast-computable'] });
runDomRulesInPage(url, null, { rules: { include: 'img-alt-present, button-name-present', exclude: 'region' }, tags: { include: 'wcag412', exclude: 'best-practice' }, includeMode: 'and' }, null);
runDomRulesInPage(url, null, { strictOptions: true, locale: 'de' }, null);
const strict: StrictEngineOptions = { strictOptions: 'true' as any, locale: 'de' };
runDomRulesInPage(url, null, { excludeSelectors: ['#cookie-banner'], rules: { 'aria-required-children': { excludeSelectors: ['mat-select'] } } });
runDomRulesInPage(url, '#checkout-form', { includeShadowDom: false }, { includeRuleIds: ['form-control-programmatic-label-present', 'button-name-present'] });
runDomRulesInPage(url, null, { timestamp: '2026-01-01T00:00:00Z', perfStats: true, profileRules: true }, null);
runDomRulesInPage(url, null, { customRules: [{ id: 'org-no-inline-onclick', meta: { title: 'No inline onclick handlers', defaultSeverity: 'moderate' }, runInPage(ctx) { const dom = ctx.helpers.dom; const els = ctx.helpers.queryAllSmart('[onclick]'); const occurrences = els.map((el: any) => ({ selector: ctx.helpers.buildSelector(el), html: dom.outerHTML(el), summary: 'x', hint: 'y' })); return { ruleId: ctx.rule.ruleId, outcome: occurrences.length ? 'fail' : 'pass', severity: 'moderate', occurrences }; } }] }, null);
runDomRulesInPage(url, null, { contrast: { mode: 'auditorAssist', rootCanvasFallback: '#ffffff' }, visibilityMode: 'styleOnly', policyContract: { id: 'my', allowedConfidence: ['high','medium'] }, policy: { coerceManualFailToCantTell: false }, output: { includeSelector: false, detail: 'findings' } });
runDomRulesInPage(url, null, { locale: 'de', messages: { de: { img_altPresent_title: 'Eigener Text' } } }, null);
runDomRulesInPage(url, null, { strictOptions: '' }, null);   // docs: '' is off
runDomRulesInPage(url, null, { wcagVersion: '2.1 ' as '2.1' }, null);
runDomRulesInPage(url, null, { probes: { crawl: { pageTitles: { pages: [{ url: 'a', title: 'b' }] } } } });
runDomRulesInPage(url, null, { includeHiddenElements: 'true' }, null);   // docs: 'true' accepted
runDomRulesInPage(url, null, { perfStats: 1 }, null);                    // docs: 1 accepted
getChecksForRunOnly({ wcag: { version: '2.2', level: 'AA' } }, {});
getRulesForRunOnly({ includeRuleIds: ['link-name-present'] }, { wcagLevel: 'AA' });
const t = getProfileWcagTarget('wcag22-aa'); if (t) runDomRulesInPage(url, null, {}, { wcag: t });
// baseline
declare const result: ScanResult;
const entries = buildBaselineEntries(result, { leanFail: true });
matchBaseline(result, { version: 1, entries }, { leanFail: true });
migrateBaselineEntries({ entries }, result);
// reporters
renderSarifReport(result, { baselineEntries: entries, leanFailAs: 'error', category: 'w390' });
renderJunitReport(result, { cantTellAs: 'failure', includeNotApplicable: true });
renderHtmlReport(result, { title: 'My scan report', manualChecks: true });
// procedures
proceduresFor('1.4.12', { locale: 'fr' });
proceduresFrom({ en }, '1.4.12', { locale: 'fr' });
listProcedures({ version: '2.1', levels: ['A', 'AA'] });
listProcedures({ standard: 'best-practice' });
const cl = procedureChecklist({ levels: ['A', 'AA'], automation: ['manual', 'partial'] });
if (cl) renderProcedures(cl, { title: 'What the scan leaves to you', record: false });
const l = listProcedures({ levels: ['A', 'AA'] }); if (l) renderProcedures(l, { format: 'markdown' });
const p = proceduresFor('1.4.12', { locale: 'de' }); if (p) renderProcedures(p, { locale: 'de', fragment: true });
listProcedures({ levels: ['A', 'AA'], tools: 'screen-reader' });
const c2 = procedureChecklistFrom({ en }, { levels: ['A', 'AA'], locale: 'fr' }); if (c2) renderProceduresFrom({ en }, c2);
relatedRequirements('1.4.3', { packs: [] });
procedureLanguages();
applyHowToCheck(result, { en: ren });
addHowToCheck(result, { locale: 'fr' });
// pack
const pack = definePack({ name: '@acme/a11y-pack', version: '0.1.0', namespace: 'acme', core: '^1.17.0', title: 'Acme', rules: [], profiles: { 'acme-policy': { tags: wcagTags('2.2', ['A', 'AA']), rules: ['region'], exclude: { rules: ['contrast-minimum'] }, severity: { 'img-alt-present': 'critical' } } }, rollups: [{ id: 'acme-images', title: 'Images', checksIds: ['img-alt-present'] }], dictionaries: { en: {} } });
runDomRulesInPage(url, null, { packs: [pack], profile: 'acme-policy' });
describePacks([pack]); checkPack(pack); packScript([pack]);
