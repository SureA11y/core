const root = process.argv[2];
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require(root + '/src/index.js');
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
for (const eo of [{ profile: 'section508' }, { profile: 'section508-1.0' }, { mappings: ['section508'] }, { profile: 'section508', mappings: ['section508'] }]) {
  const dom = new JSDOM(html, { url: 'https://e.test/' }); global.window = dom.window; global.document = dom.window.document;
  const w = []; const ow = console.warn; console.warn = (...a) => w.push(a.join(' '));
  const r = core.runDomRulesInPage('https://e.test/', null, eo, null); console.warn = ow;
  console.log(JSON.stringify(eo), 'n=', r.checksResults.length, 'engine.profile=', r.engine.profile, 'mappings=', JSON.stringify(r.engine.mappings), 'wcag=', r.engine.wcagVersion, 'rollups=', r.rulesResults.filter(x=>/section508/i.test(x.ruleId)).length, w);
}
