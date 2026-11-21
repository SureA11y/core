const fs=require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const core = require('/home/user/core-r8/src/index.js');
const BUNDLE = fs.readFileSync('/home/user/core-r8/surea11y.browser.js','utf8');
const RULES=["textbox-name-present","binary-control-name-present","aria-required-parent","aria-required-children","tab-name-present","listitem-parent-valid","empty-heading"];
async function go(b, label, defs, body, mode){
 const ctx = await b.newContext(); await ctx.addInitScript(core.internalsHookScript());
 const page = await ctx.newPage();
 if (mode==='goto') { await page.goto('data:text/html,'+encodeURIComponent(`<!doctype html><html lang="en"><head><title>T</title><script>${defs}</script></head><body><main>${body}</main></body></html>`)); }
 else await page.setContent(`<!doctype html><html lang="en"><head><title>T</title><script>${defs}</script></head><body><main>${body}</main></body></html>`);
 await page.evaluate(BUNDLE);
 const r = await page.evaluate(async(R)=> (await window.a11ycore.runa11yCoreInPage(null,null,{},R)).checksResults.filter(x=>x.outcome!=='notApplicable').map(x=>x.ruleId+' '+x.outcome+' '+(x.occurrences||[]).map(o=>(o.occurrenceOutcome||x.outcome)+':'+o.selector+':'+(o.data&&o.data.details&&o.data.details.reasonCode)).join(' | ')), RULES);
 console.log('== '+label+' ['+mode+']\n  '+r.join('\n  '));
 await ctx.close();
}
(async()=>{
 const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
 const D = (n, role, extra='') => `customElements.define('${n}', class extends HTMLElement{#i; constructor(){super(); this.#i=this.attachInternals(); this.#i.role='${role}'; ${extra}}});`;
 for (const mode of ['setContent','goto']) {
 await go(b,'switch no name', D('x-sw','switch'), `<x-sw></x-sw>`, mode);
 await go(b,'switch content name', D('x-sw','switch'), `<x-sw>Wifi</x-sw>`, mode);
 await go(b,'textbox no name', D('x-tb','textbox'), `<x-tb></x-tb>`, mode);
 await go(b,'tab orphan', D('x-tab','tab'), `<x-tab>Orphan</x-tab>`, mode);
 await go(b,'tab in tablist', D('x-tab','tab'), `<div role="tablist" aria-label="t"><x-tab></x-tab></div>`, mode);
 await go(b,'heading', D('x-h','heading'), `<x-h></x-h>`, mode);
 }
 await b.close();
})();
