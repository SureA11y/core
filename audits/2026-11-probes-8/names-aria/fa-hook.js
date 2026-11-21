const fs=require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const core = require('/home/user/core-r8/src/index.js');
const BUNDLE = fs.readFileSync('/home/user/core-r8/surea11y.browser.js','utf8');
(async()=>{
 const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
 const ctx = await b.newContext(); await ctx.addInitScript(core.internalsHookScript());
 const page = await ctx.newPage();
 const html = `<!doctype html><html lang="en"><head><title>T</title><script>
 customElements.define('x-in', class extends HTMLElement{static formAssociated=true; constructor(){super(); this.i=this.attachInternals(); this.i.role='textbox'; this.tabIndex=0;}});
 customElements.define('x-lab', class extends HTMLElement{static formAssociated=true; #i; constructor(){super(); this.#i=this.attachInternals(); this.#i.role='checkbox'; this.#i.ariaChecked='false'; this.tabIndex=0;}});
 customElements.define('x-sw', class extends HTMLElement{#i; constructor(){super(); this.#i=this.attachInternals(); this.#i.role='switch'; this.tabIndex=0;}});
 customElements.define('x-tab', class extends HTMLElement{#i; constructor(){super(); this.#i=this.attachInternals(); this.#i.role='tab'; }});
 customElements.define('x-tablist', class extends HTMLElement{#i; constructor(){super(); this.#i=this.attachInternals(); this.#i.role='tablist'; this.#i.ariaLabel='Tabs';}});
 customElements.define('x-list', class extends HTMLElement{#i; constructor(){super(); this.#i=this.attachInternals(); this.#i.role='list';}});
 customElements.define('x-li', class extends HTMLElement{#i; constructor(){super(); this.#i=this.attachInternals(); this.#i.role='listitem';}});
 customElements.define('x-heading', class extends HTMLElement{#i; constructor(){super(); this.#i=this.attachInternals(); this.#i.role='heading'; this.#i.ariaLevel='1';}});
 customElements.define('x-nav', class extends HTMLElement{#i; constructor(){super(); this.#i=this.attachInternals(); this.#i.role='navigation';}});
 </script></head><body><main>
 <x-in></x-in>
 <label>Agree <x-lab id="lab"></x-lab></label>
 <x-sw id="sw"></x-sw>
 <x-tablist><x-tab id="t1">One</x-tab><x-tab id="t2"></x-tab></x-tablist>
 <x-tab id="orphan">Orphan</x-tab>
 <x-list><x-li>a</x-li><x-li>b</x-li></x-list>
 <ul><x-li id="lix">c</x-li></ul>
 <x-heading id="xh"></x-heading>
 <x-nav><a href="#">a</a></x-nav><x-nav><a href="#">b</a></x-nav>
 </main></body></html>`;
 await page.setContent(html);
 await page.evaluate(BUNDLE);
 const r = await page.evaluate(async()=> (await window.a11ycore.runa11yCoreInPage(null,null,{},["textbox-name-present","binary-control-name-present","aria-required-parent","aria-required-children","form-control-programmatic-label-present","listitem-parent-valid","aria-required-attr"])).checksResults.map(x=>x.ruleId+' '+x.outcome+' '+(x.occurrences||[]).filter(o=>true).map(o=>o.selector+':'+(o.data&&o.data.details&&o.data.details.reasonCode)+':'+o.summary).join(' || ')));
 console.log(r.filter(l=>!/^(manual-review|page-title|page-has-heading|region|bypass|heading-order|focus-order|tabindex|target-size|skip-link|widget-keyboard)/.test(l)).join('\n').slice(0,6000));
 const c = await page.context().newCDPSession(page); const {nodes}=await c.send('Accessibility.getFullAXTree');
 console.log(nodes.filter(n=>n.role&&/textbox|checkbox|switch|tab|list|heading|navigation/.test(n.role.value)).map(n=>n.role.value+':'+JSON.stringify(n.name&&n.name.value)).join(', '));
 await b.close();
})();
