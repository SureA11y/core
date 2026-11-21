// definePack refuses a wcagSc that names no criterion; customRules takes it and SARIF publishes it.
const P = require('/home/user/core-r8/src/pack.js');
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const meta = { title: 'T', description: 'd', tags: ['wcag2a', 'wcag111'], wcagSc: ['9.9.9', '1.1.1'] };
const run = function () { return { outcome: 'fail', occurrences: [{ selector: 'p' }] }; };
try { P.definePack({ name: 'acme-pack', version: '1.0.0', namespace: 'acme', core: '*', rules: [{ id: 'acme-r', meta, runInPage: run }] }); console.log('definePack ok'); } catch (e) { console.log('definePack THROW', e.message); }
console.warn = (...a) => console.log('warn', String(a[0]).slice(0, 100));
const r = runa11yCoreOnHtml('<html lang="en"><head><title>t</title></head><body><p>x</p></body></html>', { engineOptions: { customRules: [{ id: 'org-r', meta, runInPage: run }] }, runOnly: ['org-r'] });
console.log('customRules: skipped', JSON.stringify(r.skippedCustomRules), '| mappings', JSON.stringify(r.checksResults[0].meta.normativeMappings.map(m => m.requirement)));
console.log('SARIF tags', JSON.stringify(JSON.parse(renderSarifReport(r)).runs[0].tool.driver.rules[0].properties.tags));
