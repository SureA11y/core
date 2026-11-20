const { launch, runCase, summarize } = require('./harness');
const R=['dialog-name-present','aria-role-name-present','tooltip-name-present'];
const cases=[
 {id:'dialog-title', html:`<dialog open title="Prefs" data-t=a><p>x</p></dialog>`},
 {id:'alertdialog-lb', html:`<div role=alertdialog aria-labelledby=t data-t=b><h2 id=t>Delete?</h2></div>`},
 {id:'dialog-labelledby-hidden', html:`<dialog open aria-labelledby=t2 data-t=c><h2 id=t2 hidden>Prefs</h2></dialog>`},
 {id:'tooltip-content', html:`<button aria-describedby=tt>?</button><div role=tooltip id=tt data-t=d>Help text</div>`},
 {id:'tooltip-content-hidden', html:`<button aria-describedby=tt2>?</button><div role=tooltip id=tt2 data-t=e hidden>Help text</div>`},
 {id:'dialog-modal', html:`<dialog id=dm data-t=f><h2>Hi</h2><button>x</button></dialog>`, setup:()=>document.getElementById('dm').showModal()},
 {id:'dialog-modal-labelled', html:`<dialog id=dm2 aria-labelledby=h data-t=g><h2 id=h>Hi</h2><button>x</button></dialog>`, setup:()=>document.getElementById('dm2').showModal()},
];
(async () => { const b = await launch(); for (const c of cases) console.log(summarize(c, await runCase(b,c,R))); await b.close(); })();
