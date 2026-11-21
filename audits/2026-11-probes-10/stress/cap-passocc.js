const { runa11yCoreOnHtml } = require('/home/user/core-r10/src/testing.js');
const frags = ['<img src="x.png">','<img src="z.png" alt="photo of a cat">','<a href="/a"></a>','<a href="/b">Products</a>','<button></button>','<button>Go</button>','<input type="text">','<label>Name <input></label>','<input type="email" autocomplete="nope">','<input autocomplete="email">','<p lang="xx-">bad</p>','<p lang="fr">bonjour</p>','<div id="d1">dup</div><div id="d1">dup</div>','<table><tr><th>h</th></tr><tr><td>a</td></tr></table>','<a href="#" role="img"></a>','<h3>skip</h3>','<h2>ok</h2>','<span tabindex="3">t</span>','<span tabindex="0" role="button">t</span>'];
const W = console.warn; console.warn = () => {};
const r = runa11yCoreOnHtml(`<!doctype html><html lang="en"><head><title>p</title></head><body><main>${frags.map(f=>f.repeat(3)).join('')}</main></body></html>`, { entryPointParity:false });
console.warn = W;
for (const c of r.checksResults) { if (!['fail','cantTell'].includes(c.outcome)) continue; const p = (c.occurrences||[]).filter(o=>o.occurrenceOutcome==='pass').length; if (p) console.log(c.ruleId, c.outcome, 'occ', c.occurrences.length, 'pass occ', p); }
