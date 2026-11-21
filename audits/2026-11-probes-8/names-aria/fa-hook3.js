const fs=require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const core = require('/home/user/core-r8/src/index.js');
const BUNDLE = fs.readFileSync('/home/user/core-r8/surea11y.browser.js','utf8');
const RULES=["textbox-name-present","binary-control-name-present","form-control-programmatic-label-present"];
(async()=>{
 const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
 const variants = {
  'private, no tabindex': `#i; constructor(){super(); this.#i=this.attachInternals(); this.#i.role='textbox';}`,
  'private + tabIndex': `#i; constructor(){super(); this.#i=this.attachInternals(); this.#i.role='textbox'; this.tabIndex=0;}`,
  'formAssociated private': `static formAssociated=true; #i; constructor(){super(); this.#i=this.attachInternals(); this.#i.role='textbox';}`,
  'formAssociated this.i': `static formAssociated=true; constructor(){super(); this.i=this.attachInternals(); this.i.role='textbox';}`,
  'formAssociated this.internals': `static formAssociated=true; constructor(){super(); this.internals=this.attachInternals(); this.internals.role='textbox';}`,
  'formAssociated checkbox': `static formAssociated=true; #i; constructor(){super(); this.#i=this.attachInternals(); this.#i.role='checkbox';}`,
 };
 for (const [k,body] of Object.entries(variants)) {
  const ctx = await b.newContext(); await ctx.addInitScript(core.internalsHookScript()); const page = await ctx.newPage();
  await page.setContent(`<!doctype html><html lang="en"><head><title>T</title><script>customElements.define('x-e', class extends HTMLElement{${body}});</script></head><body><main><x-e></x-e></main></body></html>`);
  await page.evaluate(BUNDLE);
  const r = await page.evaluate(async(R)=> (await window.a11ycore.runa11yCoreInPage(null,null,{},R)).checksResults.map(x=>x.ruleId+'='+x.outcome+(x.occurrences||[]).map(o=>':'+(o.data&&o.data.details&&o.data.details.reasonCode)).join('')).join('  '), RULES);
  const c = await page.context().newCDPSession(page); const {nodes}=await c.send('Accessibility.getFullAXTree');
  const ax = nodes.filter(n=>n.role&&/textbox|checkbox/.test(n.role.value)).map(n=>n.role.value+':'+JSON.stringify(n.name&&n.name.value)).join(',');
  console.log(k.padEnd(32), 'AX', ax.padEnd(14), r);
  await ctx.close();
 }
 await b.close();
})();
