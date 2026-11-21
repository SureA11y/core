const { runAll } = require('./harness');
const R=['aria-required-children','aria-prohibited-children','aria-required-parent'];
const cases = [
 { id:'radiogroup-native', html:`<div role="radiogroup" aria-label="Size"><label><input type="radio" name="s"> S</label><label><input type="radio" name="s"> M</label></div>` },
 { id:'radiogroup-with-legend-text', html:`<div role="radiogroup" aria-labelledby="l"><p id="l">Size</p><div role="radio" aria-checked="false" tabindex="0">S</div></div>` },
 { id:'radiogroup-with-help-link', html:`<div role="radiogroup" aria-label="Plan"><div role="radio" aria-checked="false" tabindex="0">Basic</div><a href="#">Compare plans</a></div>` },
 { id:'tablist-with-scroll-btn', html:`<div role="tablist" aria-label="t"><button aria-label="Scroll left" tabindex="-1">‹</button><button role="tab" aria-selected="true">A</button></div>` },
 { id:'listbox-native-options-in-div', html:`<div role="listbox" aria-label="x"><div><div role="option" aria-selected="false">a</div></div></div>` },
 { id:'list-with-template-li', html:`<div role="list"><div role="listitem">a</div><template><div role="listitem">b</div></template></div>` },
 { id:'grid-with-caption', html:`<table role="grid" aria-label="g"><caption>Cap</caption><tr><td>a</td></tr></table>` },
 { id:'table-native-in-role-table', html:`<div role="table" aria-label="t"><table><tr><td>x</td></tr></table></div>` },
 { id:'row-with-th', html:`<div role="table" aria-label="t"><div role="row"><div role="columnheader">H</div><div role="cell">c</div></div></div>` },
 { id:'feed-article', html:`<div role="feed" aria-label="f"><article>a</article><div role="article">b</div></div>` },
 { id:'menu-with-heading-group', html:`<div role="menu" aria-label="m"><div role="group" aria-labelledby="g1"><div id="g1" role="presentation">Sort</div><div role="menuitemradio" aria-checked="true">Name</div></div></div>` },
 { id:'menu-with-li-text', html:`<ul role="menu" aria-label="m"><li role="menuitem">A</li><li>Plain li</li></ul>` },
 { id:'tree-with-group-li', html:`<ul role="tree" aria-label="t"><li role="treeitem" aria-expanded="true">P<ul role="group"><li role="treeitem">c</li></ul></li></ul>` },
 { id:'listbox-with-separator', html:`<div role="listbox" aria-label="l"><div role="option" aria-selected="false">a</div><div role="separator"></div><div role="option" aria-selected="false">b</div></div>` },
 { id:'tablist-tab-in-heading', html:`<div role="tablist" aria-label="t"><h3><button role="tab" aria-selected="true">A</button></h3></div>` },
 { id:'combobox-popup-listbox-optgroup', html:`<select aria-label="s"><optgroup label="g"><option>a</option></optgroup></select>` },
 { id:'list-li-with-role-listitem-in-div', html:`<ul><li><div role="listitem">x</div></li></ul>` },
 { id:'row-in-rowgroup-in-grid-with-aria-owns', html:`<div role="grid" aria-label="g" aria-owns="r1"></div><div id="r1" role="row"><div role="gridcell">a</div></div>` },
];
runAll(cases, R);
