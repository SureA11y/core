const { launch, runCase, summarize } = require('./harness');
const cases=[
 {id:'native-cb-aria-checked-yes', html:`<label><input type=checkbox data-t=a aria-checked=yes> Agree</label>`},
 {id:'native-cb-checked-aria-checked-yes', html:`<label><input type=checkbox checked data-t=b aria-checked=yes> Agree</label>`},
 {id:'native-radio-aria-checked-on', html:`<label><input type=radio name=r data-t=c aria-checked=on> A</label>`},
 {id:'native-option-aria-selected', html:`<label>X <select><option data-t=d aria-selected=yes>1</option></select></label>`},
 {id:'native-details-expanded', html:`<details><summary data-t=e aria-expanded=yes>More</summary>x</details>`},
 {id:'native-button-pressed', html:`<input type=checkbox role=switch aria-checked=on data-t=f aria-label=s>`},
];
(async () => { const b = await launch(); for (const c of cases) { const out=await runCase(b,c,['aria-valid-attr-value','aria-conditional-attr']);
 const p=await b.newPage(); await p.setContent(c.html); const cdp=await p.context().newCDPSession(p); const {nodes}=await cdp.send('Accessibility.getFullAXTree');
 console.log(summarize(c,out)); console.log('  states:', nodes.filter(n=>['checkbox','radio','option','switch','DisclosureTriangle'].includes(n.role&&n.role.value)).map(n=>n.role.value+' '+JSON.stringify((n.properties||[]).filter(x=>/checked|selected|expanded/.test(x.name)).map(x=>x.name+'='+x.value.value))).join(' ')); await p.close(); }
 await b.close(); })();
