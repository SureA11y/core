const p=require('./h');
const A=['aria-roles-valid','aria-prohibited-attr','aria-allowed-attr','aria-allowed-role'];
p('doc-pagebreak','<p>text</p><span role="doc-pagebreak" aria-label="Page 5" id="pg5"></span><p>more</p>',A);
p('doc-pagebreak div hr','<div role="doc-pagebreak" aria-label="5"></div>',A);
p('doc-noteref','<a href="#n1" role="doc-noteref">1</a>',A);
