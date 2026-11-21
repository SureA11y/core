// Messages that say untrue things about the markup
const { jrun, jsum } = require('./jsd');
(async()=>{
 console.log(jsum('canvas-with-fallback', await jrun(`<canvas width="10" height="10">Chart of sales</canvas>`, ['img-alt-decorative','canvas-text-alternative-quality'])));
 console.log(jsum('th-with-named-checkbox', await jrun(`<table><thead><tr><th><input type="checkbox" aria-label="Select all rows"></th><th>Name</th></tr></thead><tbody><tr><td><input type="checkbox" aria-label="Select Ann"></td><td>Ann</td></tr></tbody></table>`, ['empty-table-header'])));
 console.log(jsum('option-a-an', await jrun(`<div role="listbox" aria-label="l"><div role="option" aria-selected="false" tabindex="0">A <a href="#">info</a></div></div>`, ['nested-interactive-controls-absent'])));
 console.log(jsum('nav-has-a-role', await jrun(`<div role="menu" aria-label="m"><nav aria-label="n"><div role="menuitem">A</div></nav></div>`, ['aria-prohibited-children','aria-required-parent'])));
})();
