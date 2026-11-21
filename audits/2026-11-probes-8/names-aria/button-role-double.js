// A <button> whose role attribute gives it another role is still judged as a button by button-name-present,
// so one unnamed control is reported twice, once as "This button"
const { jrun, jsum } = require('./jsd');
const R=['button-name-present','tab-name-present','binary-control-name-present','menuitem-name-present','combobox-name-present','option-name-present','treeitem-name-present','link-name-present'];
(async()=>{ for (const [id,h] of [
 ['tab', `<div role="tablist" aria-label="t"><button role="tab" aria-selected="true"><svg aria-hidden="true"></svg></button></div>`],
 ['switch', `<button role="switch" aria-checked="false"><span class="knob"></span></button>`],
 ['menuitem', `<div role="menu" aria-label="m"><button role="menuitem"><svg aria-hidden="true"></svg></button></div>`],
 ['link', `<button role="link"><svg aria-hidden="true"></svg></button>`],
 ['option', `<div role="listbox" aria-label="l"><button role="option" aria-selected="false"></button></div>`],
]) console.log(jsum(id, await jrun(h, R))); })();
// Symmetry: other native elements with a role attribute
(async()=>{ for (const [id,h] of [
 ['a-href-role-button', `<a href="#" role="button"><svg aria-hidden="true"></svg></a>`],
 ['a-href-role-tab', `<div role="tablist" aria-label="t"><a href="#" role="tab" aria-selected="true"><svg aria-hidden="true"></svg></a></div>`],
 ['input-checkbox-role-switch', `<input type="checkbox" role="switch">`],
]) console.log(jsum(id, await jrun(h, R.concat(['form-control-programmatic-label-present'])))); })();
