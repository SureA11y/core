const out=require('./lib.js');
out('s1','<img src="a.png" role="none presentation">',['img-alt-present']);
out('s4a','<ul><li role="foo">a</li></ul>',['list-children-valid']);
out('s4b','<ul role="foo list"><li>a</li></ul>',['listitem-parent-valid']);
out('s5','<!doctype html><html lang="en" xml:lang="x-foo"><head><title>t</title></head><body><p>x</p></body></html>',['html-xml-lang-mismatch']);
out('s6','<table><tr><th rowspan="0">Group</th><td>a</td><td>b</td><td>c</td></tr><tr><td>a</td><td>b</td><td>c</td></tr><tr><td>a</td><td>b</td><td>c</td></tr><tr><td>a</td><td>b</td><td>c</td></tr></table>',['td-has-header']);
out('s7','<iframe title="f" tabindex="-1" srcdoc="<div tabindex=abc>x</div>"></iframe>',['iframe-focusable-content']);
out('s10','<meta http-equiv="refresh" content=".5; url=/a"><meta http-equiv="refresh" content="30"><p>x</p>',['meta-refresh-timing-absent']);
out('s13a','<input type="email" autocomplete="section- email">',['autocomplete-valid']);
