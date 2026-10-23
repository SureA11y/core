const p=require('./h.js');
const R=['list-children-valid','listitem-parent-valid','definition-list-children-valid','dlitem-parent-valid'];
const cases=[
 ['li role=foo','<ul><li role="foo">a</li></ul>'],
 ['li role="foo listitem"','<ul><li role="foo listitem">a</li></ul>'],
 ['ul role=foo','<ul role="foo"><li>a</li></ul>'],
 ['ul role="foo list"','<ul role="foo list"><li>a</li></ul>'],
 ['ul role=LIST','<ul role="LIST"><li>a</li></ul>'],
 ['li role=none','<ul><li role="none">a</li></ul>'],
 ['ol role=directory','<ol role="directory"><li>a</li></ol>'],
 ['menu','<menu><li>a</li></menu>'],
 ['menu child div','<menu><div>a</div></menu>'],
 ['dl role=foo','<dl role="foo"><dt>a</dt><dd>b</dd></dl>'],
 ['dl div role=none','<dl><div role="none"><dt>a</dt><dd>b</dd></div></dl>'],
 ['dl script/template','<dl><script></script><template></template><dt>a</dt><dd>b</dd></dl>'],
 ['dl empty div','<dl><div></div><dt>a</dt><dd>b</dd></dl>'],
 ['dl div with p','<dl><div><dt>a</dt><dd>b</dd><p>c</p></div></dl>'],
 ['dl hidden p','<dl><p hidden>x</p><dt>a</dt><dd>b</dd></dl>'],
 ['dl div role=list','<dl><div role="list"><dt>a</dt><dd>b</dd></div></dl>'],
 ['dl > div role=listitem dt','<dl role="list"><div role="listitem"><dt>a</dt></div></dl>'],
];
for (const [l,h] of cases) p(l,`<!doctype html><html lang="en"><head><title>t</title></head><body>${h}</body></html>`,R);
