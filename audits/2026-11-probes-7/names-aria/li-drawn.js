const { launch, runCase, summarize } = require('./harness');
const R=['listitem-parent-valid','list-children-valid'];
const cases=[
 {id:'li-in-div-default', html:`<div><li data-t=a>x</li></div>`},
 {id:'li-in-div-nostyle', html:`<div><li style="list-style:none" data-t=a>x</li></div>`},
 {id:'li-in-div-display-block', html:`<div><li style="display:block" data-t=a>x</li></div>`},
 {id:'li-in-ul-role-none', html:`<ul role=none><li data-t=a>x</li></ul>`},
 {id:'li-in-ul-role-presentation-nav', html:`<nav aria-label=n><ul role=presentation><li data-t=a><a href=/a>A</a></li></ul></nav>`},
 {id:'li-in-ol-role-menu-style-none', html:`<ul role=menu style="list-style:none"><li data-t=a>x</li></ul>`},
 {id:'li-in-ul-role-tablist', html:`<ul role=tablist><li role=presentation data-t=a><a role=tab href=#a aria-selected=true>A</a></li></ul>`},
 {id:'ul-with-div-flex', html:`<ul style="display:flex"><div data-t=a>x</div></ul>`},
 {id:'ul-li-display-contents', html:`<ul><div style="display:contents"><li data-t=a>x</li></div></ul>`},
];
(async () => { const b = await launch(); for (const c of cases) console.log(summarize(c, await runCase(b,c,R))); await b.close(); })();
