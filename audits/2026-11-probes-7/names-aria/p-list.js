const { launch, runCase, summarize } = require('./harness');
const R=['aria-required-children','listitem-parent-valid','list-children-valid','aria-required-parent'];
const cases=[
 {id:'divlist-li', html:`<div role=list data-t=L><li data-t=I>a</li><li>b</li></div>`},
 {id:'divlist-li-only', html:`<div role=list><li>a</li></div>`},
 {id:'ul-rolelist-li', html:`<ul role=list><li>a</li></ul>`},
 {id:'ol-role-list-spanli', html:`<div role=list><span role=listitem>a</span></div>`},
 {id:'section-rolelist-li', html:`<section role=list aria-label=x><li>a</li></section>`},
];
(async () => { const b = await launch(); for (const c of cases) console.log(summarize(c, await runCase(b, c, R))); await b.close(); })();
