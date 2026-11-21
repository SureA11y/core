// A native element with a role of its own (h3, article, p) between a role and its required context is read as transparent
const { jrun, jsum } = require('./jsd');
const R=['aria-required-parent','aria-prohibited-children'];
(async()=>{ for (const [id,h] of [
 ['tab-in-h3', `<div role="tablist" aria-label="t"><h3><button role="tab" aria-selected="true">A</button></h3></div>`],
 ['tab-in-div-role-heading', `<div role="tablist" aria-label="t"><div role="heading" aria-level="3"><button role="tab" aria-selected="true">A</button></div></div>`],
 ['option-in-h3', `<div role="listbox" aria-label="l"><h3><div role="option" aria-selected="false">A</div></h3></div>`],
 ['listitem-in-article', `<div role="list"><article><div role="listitem">A</div></article></div>`],
 ['menuitem-in-nav', `<div role="menu" aria-label="m"><nav aria-label="n"><div role="menuitem">A</div></nav></div>`],
]) console.log(jsum(id, await jrun(h, R))); })();
