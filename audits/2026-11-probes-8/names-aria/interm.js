// An intermediate role between a child role and its required context
const { runAll } = require('./harness');
const R=['aria-required-parent','aria-prohibited-children','aria-required-children','listitem-parent-valid'];
const cases = [
 ['tab-in-h3', `<div role="tablist" aria-label="t" data-t="c"><h3 data-t="m"><button role="tab" aria-selected="true" data-t="x">A</button></h3></div>`],
 ['tab-in-div-heading', `<div role="tablist" aria-label="t" data-t="c"><div role="heading" aria-level="3" data-t="m"><button role="tab" aria-selected="true" data-t="x">A</button></div></div>`],
 ['option-in-h3', `<div role="listbox" aria-label="l" data-t="c"><h3 data-t="m"><div role="option" aria-selected="false" data-t="x">A</div></h3></div>`],
 ['listitem-in-p', `<div role="list" data-t="c"><p data-t="m"><span role="listitem" data-t="x">A</span></p></div>`],
 ['listitem-in-article', `<div role="list" data-t="c"><article data-t="m"><div role="listitem" data-t="x">A</div></article></div>`],
 ['li-in-ul-in-nav-in-section', `<ul data-t="c"><section aria-label="s" data-t="m"><li data-t="x">A</li></section></ul>`],
 ['menuitem-in-region', `<div role="menu" aria-label="m" data-t="c"><div role="region" aria-label="r" data-t="m"><div role="menuitem" data-t="x">A</div></div></div>`],
 ['tab-in-group', `<div role="tablist" aria-label="t" data-t="c"><div role="group" aria-label="g" data-t="m"><button role="tab" aria-selected="true" data-t="x">A</button></div></div>`],
 ['tab-in-strong', `<div role="tablist" aria-label="t" data-t="c"><strong data-t="m"><button role="tab" aria-selected="true" data-t="x">A</button></strong></div>`],
];
runAll(cases.map(([id,html])=>({id,html})), R);
