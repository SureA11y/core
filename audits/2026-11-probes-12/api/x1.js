const H = require('./h.js');
const html = H.page('<div id="ex"><span id="a">A</span><p id="t">text</p><x-h id="host"></x-h></div><div id="ok"><span id="b">B</span></div><script>document.getElementById("host").attachShadow({mode:"open"}).innerHTML="<b id=s>s</b>"</script>');
const mk = (id, body) => ({ id, meta: { title: id, tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'], type: 'automatic' }, runInPage: body });
const rules = [
  mk('org-el', (ctx) => { const h = ctx.helpers; const o = [h.reportOccurrence(document.getElementById('a'), { summary: 'a' }), h.reportOccurrence(document.getElementById('b'), { summary: 'b' })]; return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: o }; }),
  mk('org-selonly', (ctx) => ({ ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [{ selector: '#a', summary: 'sel a' }] })),
  mk('org-text', (ctx) => { const h = ctx.helpers; return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [h.reportOccurrence(document.getElementById('t').firstChild, { summary: 'txt' })] }; }),
  mk('org-shadow', (ctx) => { const h = ctx.helpers; const s = document.getElementById('host').shadowRoot.getElementById('s'); return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [h.reportOccurrence(s, { summary: 'shadow' })] }; }),
  mk('org-mixed', (ctx) => { const h = ctx.helpers; return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [Object.assign(h.reportOccurrence(document.getElementById('a'), { summary: 'f' }), { occurrenceOutcome: 'fail' }), Object.assign(h.reportOccurrence(document.getElementById('b'), { summary: 'p' }), { occurrenceOutcome: 'pass' })] }; }),
  mk('org-ambig', (ctx) => ({ ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [{ selector: 'span', summary: 'any span, meant #b' }] })),
  mk('org-ownexcl', (ctx) => { const h = ctx.helpers; return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [h.reportOccurrence(document.getElementById('b'), { summary: 'b' })] }; }),
];
const { r, logs, err } = H.scan(html, { customRules: rules, excludeSelectors: ['#ex'], includeShadowDom: true, rules: { 'org-ownexcl': { excludeSelectors: ['#ok'] } } }, { type: 'rules', values: rules.map(x => x.id) });
if (err) console.log('ERR', err.stack);
for (const c of (r || { checksResults: [] }).checksResults) console.log(c.ruleId, c.outcome, c.occurrences.map(o => o.summary + '@' + o.selector + ':' + (o.occurrenceOutcome || '')).join(','), JSON.stringify(c.excludedOccurrences), (c.error || '').slice(0, 160));
console.log(logs);
