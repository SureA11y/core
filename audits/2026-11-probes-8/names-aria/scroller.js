// A scroll container with no focusable content inside aria-hidden: Chromium makes it keyboard-focusable
const fs=require('fs'); const { chromium } = require('/home/user/core/node_modules/playwright');
const BUNDLE = fs.readFileSync('/home/user/core-r8/surea11y.browser.js','utf8');
(async()=>{ const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' }); const p = await b.newPage();
 await p.setContent(`<!doctype html><html lang="en"><head><title>T</title></head><body><main><button id="before">before</button><div aria-hidden="true"><div id="sc" style="overflow:auto;height:30px"><p style="height:200px">long text</p></div></div><button>after</button></main></body></html>`);
 await p.focus('#before'); await p.keyboard.press('Tab');
 console.log('focused after Tab:', await p.evaluate(()=>document.activeElement.id||document.activeElement.tagName));
 console.log('UA:', await p.evaluate(()=>navigator.userAgent.match(/Chrome\/[\d.]+/)[0]));
 await p.evaluate(BUNDLE);
 const r = await p.evaluate(async()=> (await window.a11ycore.runa11yCoreInPage(null,null,{},['aria-hidden-focus','scrollable-region-focusable'])).checksResults.map(x=>x.ruleId+'='+x.outcome+' '+(x.occurrences||[]).map(o=>o.data.details.reasonCode+':'+o.summary).join('|')));
 console.log(r.join('\n')); await b.close(); })();
