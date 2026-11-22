const root='/home/user/r11-review';
const t = require(root + '/src/testing.js');
const ID='contrast-minimum';
const sum = (r) => { const c = r.checksResults.find((c) => c.ruleId === ID); return c.outcome + ' ' + (c.occurrences||[]).map(o=>/foreground: #\w+, background: #\w+/.exec(o.summary||'')?.[0]||'').join(';'); };
const cases = [
 ['change font color', '<p><font id=f color="#000">Some text here</font></p>', (d)=>d.getElementById('f').setAttribute('color','#eee')],
 ['add first hint to hint-free page', '<p id=f>Some text here</p>', (d)=>{const f=d.createElement('font');f.setAttribute('color','#eee');f.textContent='Faint added text';d.querySelector('main').appendChild(f);}],
 ['remove the only hint', '<p><font id=f color="#eee">Some text here</font></p>', (d)=>d.getElementById('f').removeAttribute('color')],
 ['change td bgcolor', '<table><tr><td id=f bgcolor="#fff" style="color:#777">Cell text here</td></tr></table>', (d)=>d.getElementById('f').setAttribute('bgcolor','#666')],
 ['body text changed', '<p>Body text here</p>', (d)=>d.body.setAttribute('text','#eee')],
];
for (const [label, body, mut] of cases) {
  const dom = t.createDom(`<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`);
  const r1 = sum(t.runa11yCoreOnDom(dom, { runOnly: [ID] }));
  mut(dom.window.document);
  const r2 = sum(t.runa11yCoreOnDom(dom, { runOnly: [ID] }));
  const fresh = t.createDom(dom.serialize());
  const r3 = sum(t.runa11yCoreOnDom(fresh, { runOnly: [ID] }));
  console.log((r2===r3?'OK   ':'STALE ')+label, '|', r1, '|', r2, '| fresh:', r3);
}
