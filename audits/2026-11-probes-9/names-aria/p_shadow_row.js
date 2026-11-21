const { chromium } = require('/home/user/core-r9/node_modules/playwright');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.setContent(`<!doctype html><html lang=en><head><title>t</title></head><body>
<div role=table id=t aria-label="Prices"><x-row id=h></x-row></div>
<script>customElements.define('x-row',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<div role=row><div role=cell>1</div></div>';}})</script>
<div role=list id=l><x-li id=k></x-li></div>
<script>customElements.define('x-li',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<div role=listitem>a</div>';}})</script>
</body></html>`);
await p.addScriptTag({path:'/home/user/core-r9/surea11y.browser.js'});
const r=await p.evaluate(async()=>{const x=await window.a11ycore.runa11yCoreInPage(null,null,{},['aria-required-children','aria-required-parent']);return x.checksResults.map(c=>c.ruleId+' '+c.outcome+' '+(c.occurrences||[]).map(o=>o.selector+':'+o.data.details.reasonCode+' '+o.summary).join(';'))});
console.log(r.join('\n'));
const snap=await p.accessibility.snapshot();console.log(JSON.stringify(snap));
await b.close();})();
