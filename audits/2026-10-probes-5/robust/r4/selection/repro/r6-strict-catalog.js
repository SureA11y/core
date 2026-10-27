// The scan throws under strictOptions for an invalid wcagLevel; getRulesForRunOnly neither throws nor warns,
// and lists every level -- i.e. it lists rollups for a scan that cannot run.
const core = require('/home/user/core/src/index.js');
const eo = { strictOptions: true, wcagVersion: '2.2', wcagLevel: 'AA+' };
console.log(core.getRulesForRunOnly({ includeRuleIds: ['contrast-computable'] }, eo).map((x) => x.id));
// non-strict: wcagLevel ' aA ' accepted, but wcagVersion '2.1 ' throws under strict while accepted non-strict
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const dom = new JSDOM('<!doctype html><html><head><title>t</title></head><body></body></html>', { url: 'https://example.test/' });
global.window = dom.window; global.document = dom.window.document;
for (const o of [{ wcagLevel: ' aA ' }, { wcagVersion: '2.1 ' }]) {
  try { const r = core.runDomRulesInPage('https://example.test/', null, { strictOptions: true, ...o }, { includeRuleIds: ['img-alt-present'] }); console.log(JSON.stringify(o), 'strict ok, engine', r.engine.wcagVersion, r.engine.wcagLevel); }
  catch (e) { console.log(JSON.stringify(o), 'strict THROWS', e.message); }
}
