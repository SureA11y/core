const { launch, runCase, summarize } = require('./harness');
const R=['list-children-valid','listitem-parent-valid'];
const cases=[
 {id:'ul-div-li', html:`<ul data-t=L><div><li data-t=a>One</li><li>Two</li></div><div><li>Three</li></div></ul>`},
 {id:'ul-div-contents-li', html:`<ul data-t=L><div style="display:contents"><li data-t=a>One</li><li>Two</li></div><div style="display:contents"><li>Three</li></div></ul>`},
 {id:'ul-custom-el-li', html:`<ul data-t=L><app-item><li data-t=a>One</li></app-item><app-item><li>Two</li></app-item></ul>`},
];
(async () => { const b = await launch(); for (const c of cases) { console.log(summarize(c, await runCase(b,c,R)));
 const p=await b.newPage(); await p.setContent(c.html); const cdp=await p.context().newCDPSession(p); const {nodes}=await cdp.send('Accessibility.getFullAXTree');
 console.log('   AX:', nodes.filter(n=>!n.ignored && ['list','listitem','generic'].includes(n.role&&n.role.value)).map(n=>n.role.value+((n.properties||[]).filter(x=>/setsize|posinset|level/i.test(x.name)).map(x=>' '+x.name+'='+x.value.value).join(''))).join(' | ')); await p.close(); }
 await b.close(); })();
