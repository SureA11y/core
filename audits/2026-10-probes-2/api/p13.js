const { run } = require('./h');
const html = '<html><head><title>t</title></head><body><main id="a.b"><img src="1.png"><section id="123"><img src="2.png"></section></main><div class="x:y"><img src="3.png"></div></body></html>';
const s = r => JSON.stringify(r.contextMatch) + ' ' + r.checksResults.filter(c=>c.outcome!=='notApplicable').map(c=>c.ruleId+':'+c.outcome+':'+c.occurrences.length).join(',');
const t = (ctx) => { try { console.log(JSON.stringify(ctx), s(run(html, ctx, {}, ['img-alt-present','html-lang-attr-present','duplicate-id']))); } catch (e) { console.log(JSON.stringify(ctx), 'THROW', e.code, e.message); } };
t('#a\\.b'); t('#\\31 23'); t('.x\\:y'); t(['main', 'main']); t('main, main img'); t(['main', 'section']); t('html'); t(':root'); t('body'); t(['#nope', 'main']); t('img'); t([' main ', '']);
