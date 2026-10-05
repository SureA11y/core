const { JSDOM } = require('/home/user/core/node_modules/jsdom'); const core = require('/home/user/core/src/index.js');
const n = +process.argv[2]; const kind = process.argv[3] || 'mixed';
const runOnly = process.argv[4] ? process.argv[4].split(',') : null;
const body = kind === 'mixed' ? '<span>a</span>'.repeat(n / 2) + '<a href="/">l</a>'.repeat(n / 2)
  : kind === 'spans' ? '<span>a</span>'.repeat(n)
  : kind === 'links' ? '<a href="/">l</a> '.repeat(n)
  : kind === 'li' ? '<ul>' + '<li>a</li>'.repeat(n) + '</ul>'
  : kind === 'opt' ? '<label>x<select>' + '<option>a</option>'.repeat(n) + '</select></label>'
  : kind === 'tr' ? '<table><tr><th>A</th><th>B</th><th>C</th></tr>' + '<tr><td>1</td><td>2</td><td>3</td></tr>'.repeat(n / 4) + '</table>'
  : kind === 'lab' ? Array.from({ length: n / 2 }, (_, i) => `<label for="i${i}">L${i}</label><input id="i${i}" aria-describedby="i${(i + 1) % (n / 2)}">`).join('')
  : kind === 'h' ? Array.from({ length: n }, (_, i) => `<h${(i % 6) + 1}>H${i}</h${(i % 6) + 1}>`).join('')
  : kind === 'lm' ? '<nav><a href="/">n</a></nav><aside>a</aside><section aria-label="s">x</section>'.repeat(n / 7)
  : kind === 'ifr' ? Array.from({ length: n }, (_, i) => `<iframe srcdoc="" title="f${i % 50}"></iframe>`).join('')
  : kind === 'img' ? '<img src="x.png" alt="">'.repeat(n)
  : kind === 'btn' ? '<button><svg aria-hidden="true"></svg>Go</button>'.repeat(n / 2)
  : '';
const dom = new JSDOM(`<!doctype html><html lang=en><head><title>S</title></head><body><main><h1>x</h1>${body}</main></body></html>`, { url: 'https://example.test/', pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document;
const t = Date.now();
const r = core.runDomRulesInPage('https://example.test/', null, { profileRules: true, perfStats: true }, null);
const bad = r.checksResults.filter(c => c.error || !['pass','fail','cantTell','notApplicable'].includes(c.outcome) || (c.outcome==='fail' && !c.occurrences.length)).map(c=>c.ruleId);
console.log(kind, n, Date.now() - t, 'ms', Object.entries(r.perfStats.ruleTimings).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+':'+Math.round(v)).join(' '), bad.length ? 'BAD:' + bad : '');
