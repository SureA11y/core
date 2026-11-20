// Catalog / checksResults / SARIF order of a pack's rules under the process locale.
const P = require('/home/user/core/src/pack.js');
const core = require('/home/user/core/src/index.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const rule = (id) => ({ id, meta: { title: id, description: 'd', tags: ['wcag111', 'wcag2a'], wcagSc: ['1.1.1'] }, runInPage() { return { outcome: 'pass', occurrences: [] }; } });
const pack = P.definePack({ name: 'acme-pack', version: '1.0.0', namespace: 'acme', core: '>=1.10.0', rules: ['acme-ch', 'acme-h', 'acme-i', 'acme-y', 'acme-aa', 'acme-b'].map(rule) });
const cat = core.getChecksCatalog({ packs: [pack] }).map(c => c.ruleId).filter(id => id.startsWith('acme-'));
const r = runa11yCoreOnHtml('<html lang=en><title>t</title><main>x</main></html>', { engineOptions: { packs: [pack] } });
const res = r.checksResults.map(c => c.ruleId).filter(id => id.startsWith('acme-'));
const sarif = JSON.parse(renderSarifReport(r)).runs[0].tool.driver.rules.map(x => x.id).filter(id => id.startsWith('acme-'));
console.log(new Intl.Collator().resolvedOptions().locale.padEnd(6), 'catalog', cat.join(' '), '| checksResults', res.join(' '), '| sarif', sarif.join(' '));
