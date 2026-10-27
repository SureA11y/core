const { scan, scanIP, brief } = require('./h.js');
function show(name, eo, pick) { const r = scan(eo); console.log(name, r.ok ? String(JSON.stringify(pick(r.v))).slice(0, 400) : 'THROW ' + r.msg, JSON.stringify(r.warns.slice(0,3)).slice(0,400)); }
const img = (v) => { const c = v.checksResults.find((c) => c.ruleId === 'img-alt-present'); return { loc: v.engine.locale, title: c.meta && c.meta.title, sum: c.occurrences[0] && c.occurrences[0].summary }; };
show('wcagLevel=__proto__', { wcagLevel: '__proto__' }, (v) => v.engine.wcagLevel);
show('policy.allowedOutcomes=bogus', { policy: { allowedOutcomes: ['bogus'] } }, (v) => v.checksResults.slice(0,2).map(c=>c.outcome));
show('policy.allowedOutcomes=str', { policy: { allowedOutcomes: 'fail' } }, (v) => v.checksResults.slice(0,2).map(c=>c.outcome));
show('policy.allowedOutcomes=pass-only', { policy: { allowedOutcomes: ['pass'] } }, (v) => [...new Set(v.checksResults.map(c=>c.outcome))]);
show('policyContract obj id proto', { policyContract: { id: '__proto__' } }, (v) => [...new Set(v.checksResults.map(c=>c.outcome))]);
show('timestamp huge', { timestamp: 'x'.repeat(1e6) }, (v) => v.timestamp.length);
show('perfStats=NaN', { perfStats: NaN }, (v) => !!v.perfStats);
show('perfStats=-0', { perfStats: -0 }, (v) => !!v.perfStats);
show('perfStats=" TRUE "', { perfStats: ' TRUE ' }, (v) => !!v.perfStats);
show('includeShadowDom=new Boolean(false)', { includeShadowDom: new Boolean(false) }, (v) => v.checksResults[0].engineOptions.includeShadowDom);
show('includeShadowDom=new String("false")', { includeShadowDom: new String('false') }, (v) => v.checksResults[0].engineOptions.includeShadowDom);
show('profile=" wcag22-aa "', { profile: ' wcag22-aa ' }, (v) => v.engine.profile);
show('profile=WCAG22-AA', { profile: 'WCAG22-AA' }, (v) => v.engine.profile);
show('eoMap', new Map([['locale','de']]), (v) => v.engine.locale);
for (const f of ['notacolor', 'rgb(1,2,3,4,5)', 'rgb(1,2,3,)', '#12', '#12345', 'rgba(0,0,0,0.5)', 'red', 'RED', '  #000  ', 'hsl(0 0% 0%)', 'color(srgb 0 0 0)', 'inherit', 'currentColor', '#ffffff00', 'rgb(300,300,300)', 'rgb(-5,0,0)'])
  show('fallback=' + f, { contrast: { mode: 'auditorAssist', rootCanvasFallback: f } }, (v) => v.checksResults[0].engineOptions.contrast.rootCanvasFallback);
