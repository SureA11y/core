const H = require('./h.js');
const html = H.page('<img src="a.png"><a href="/x"></a>');
const other = H.page('<p>clean</p>', 'other');
const nest = { id: 'a-nest', meta: { title: 'nest', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] }, runInPage(ctx) { H.T.runa11yCoreOnHtml(other, { entryPointParity: false }); return { ruleId: ctx.rule.ruleId, outcome: 'pass', occurrences: [] }; } };
const sum = (r) => r.checksResults.filter(c => c.ruleId !== 'a-nest').map(c => c.ruleId + ':' + c.outcome).sort();
const a = H.scan(html, {}).r; const b = H.scan(html, { customRules: [nest] });
if (b.err) console.log('ERR', b.err.message); else { const A = sum(a), Bs = sum(b.r); console.log('diff', A.filter(x => !Bs.includes(x)), Bs.filter(x => !A.includes(x)), 'title', b.r.checksResults.find(c => c.ruleId === 'page-title-present') && b.r.checksResults.find(c => c.ruleId === 'page-title-present').outcome); }
console.log('global document title after', global.document && global.document.title);
