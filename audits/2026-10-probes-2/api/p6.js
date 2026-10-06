const { run } = require('./h');
const { buildBaselineEntries, matchBaseline } = require('/home/user/core/src/baseline.js');
const page = (body, head='') => `<html><head>${head}<meta name="viewport" content="width=device-width, user-scalable=no"></head><body>${body}</body></html>`;
const b1 = '<div>intro text</div><div role="navigation"><a href="#">x</a></div><ul><li>a</li></ul><table><tr><td>1</td></tr></table><select><option>1</option></select><input type="text"><div id="d">dup</div><div id="d">dup2</div><h3>h</h3><p>para one</p>';
const b2 = '<div>intro text CHANGED</div><div role="navigation"><a href="#">x</a></div><ul><li>a</li><li>b</li></ul><table><tr><td>1</td></tr></table><select><option>1</option></select><input type="text"><div id="d">dup</div><div id="d">dup2</div><h3>h</h3><p>para one</p><p>new para</p>';
const r1 = run(page(b1)); const r2 = run(page(b2));
const e1 = buildBaselineEntries(r1);
const m = matchBaseline(r2, e1);
console.log('entries', e1.length, 'new', m.newCount, 'stale', m.staleCount);
for (const n of m.newOccurrences) console.log('NEW', n.ruleId, n.reasonCode, n.html.slice(0,150));
console.log(e1.map(e=>e.ruleId+' '+e.reasonCode+' '+e.html.slice(0,100)));
// collect all fail rules on big fixture set
const fs=require('fs'); const path=require('path');
