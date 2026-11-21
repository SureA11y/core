const { runAll } = require('./harness');
const R=['nested-interactive-controls-absent','presentational-children-focusable-absent','aria-prohibited-children'];
const cases = [
 { id:'tab-with-close', html:`<div role="tablist" aria-label="t"><div role="tab" aria-selected="true" tabindex="0" data-t="t">File.js <button aria-label="Close" tabindex="-1">x</button></div></div>` },
 { id:'summary-with-button', html:`<details><summary data-t="s">Q <button>Copy</button></summary>a</details>` },
 { id:'summary-with-link', html:`<details><summary data-t="s">See <a href="#">docs</a></summary>a</details>` },
 { id:'option-with-checkbox', html:`<div role="listbox" aria-label="l"><div role="option" aria-selected="false" data-t="o"><input type="checkbox" tabindex="-1" aria-hidden="true"> A</div></div>` },
 { id:'treeitem-with-checkbox', html:`<ul role="tree" aria-label="t"><li role="treeitem" aria-selected="false" data-t="ti"><input type="checkbox" aria-label="pick"> Node</li></ul>` },
 { id:'row-with-buttons-grid', html:`<table role="grid" aria-label="g"><tr data-t="r"><td>Ann</td><td><button>Edit</button></td></tr></table>` },
 { id:'link-in-button', html:`<button data-t="b">Buy <a href="#">terms</a></button>` },
 { id:'button-in-link-card', html:`<a href="/p" data-t="a"><h3>Product</h3><button>Add to cart</button></a>` },
 { id:'label-with-link', html:`<label><input type="checkbox"> I agree to the <a href="#">terms</a></label>` },
 { id:'menuitem-with-submenu-button', html:`<ul role="menu" aria-label="m"><li role="menuitem" data-t="mi">Share <button tabindex="-1">▶</button></li></ul>` },
 { id:'checkbox-role-with-focusable', html:`<div role="checkbox" aria-checked="false" tabindex="0" data-t="c">Agree <a href="#">terms</a></div>` },
 { id:'img-role-with-link', html:`<div role="img" aria-label="chart" data-t="i"><a href="#">bar</a></div>` },
 { id:'switch-mui-inner-input', html:`<span class="MuiSwitch-root"><span class="MuiSwitch-switchBase" role="presentation"><input type="checkbox" class="MuiSwitch-input" role="switch" aria-label="Wifi"><span class="MuiSwitch-thumb"></span></span></span>` },
 { id:'button-with-hidden-input', html:`<button data-t="b">Upload <input type="file" hidden></button><button data-t="b2">X<input type="hidden" name="a"></button>` },
 { id:'button-with-tabindex-minus1-div', html:`<button data-t="b">Go <span tabindex="-1">!</span></button>` },
 { id:'a-with-disabled-button', html:`<a href="#" data-t="a">Go <button disabled>x</button></a>` },
 { id:'a-with-inert-button', html:`<a href="#" data-t="a">Go <button inert>x</button></a>` },
 { id:'a-with-aria-hidden-button', html:`<a href="#" data-t="a">Go <span aria-hidden="true"><button tabindex="-1">x</button></span></a>` },
];
runAll(cases, R);
