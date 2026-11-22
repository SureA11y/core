const fs=require('fs');const {chromium}=require('/home/user/r12-rules/node_modules/playwright');
const bundle=fs.readFileSync('/home/user/r12-rules/surea11y.browser.js','utf8');
const html=`<!doctype html><html lang=en><head><title>t</title></head><body><main>
<x-card></x-card><x-card></x-card>
<script>
customElements.define('x-inner',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<button style="width:10px;height:10px;padding:0">a</button><button style="width:10px;height:10px;padding:0">b</button><div style="height:20px;width:120px;overflow:hidden">Long text that is clipped by a box inside a nested component</div><div style="height:20px;width:120px;overflow:hidden">Second long text that is clipped by another box in the same root</div><p><b>Opening hours</b></p><p>Mon</p><label><input type=radio name=r>A</label><label><input type=radio name=r>B</label><div onclick="1" style="display:inline-block;padding:4px;background:#0a5">Add</div><div onclick="1" style="display:inline-block;padding:4px;background:#0a5">Buy</div><ul role=navigation><li>x</li><li>y</li></ul><video poster="p.jpg"></video><video poster="q.jpg"></video><a href=# tabindex=2>t</a><a href=# tabindex=3>u</a>'}});
customElements.define('x-card',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<section><x-inner></x-inner></section><section><x-inner></x-inner></section>'}});
</script></main></body></html>`;
const rules=['target-size-minimum','resize-text-content-loss','p-as-heading','form-group-name-present','click-handler-keyboard-operable','listitem-parent-valid','video-poster-text-alternative-present','tabindex','text-spacing-content-loss'];
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:640,height:800}});await p.setContent(html);await p.addScriptTag({content:bundle});
const out=await p.evaluate(async(rules)=>{const r=await window.a11ycore.runa11yCoreInPage(null,null,{rules:{include:rules}},null);const res=[];
 for(const c of r.checksResults){let bad=0,n=0,ex=null;for(const o of c.occurrences||[]){n++;let root=document;for(const hs of (o.shadowHostSelectors||[])){const h=root.querySelectorAll(hs);if(h.length!==1){root=null;break;}root=h[0].shadowRoot;}
  const m=root?root.querySelectorAll(o.selector):[];const ok=m.length===1&&m[0].outerHTML.startsWith(String(o.html||'').slice(0,40));if(!ok){bad++;ex=ex||{sel:o.selector,hosts:o.shadowHostSelectors,count:m.length,html:String(o.html).slice(0,60)};}}
  res.push(c.ruleId+' '+c.outcome+' occ='+n+' bad='+bad+(ex?' ex='+JSON.stringify(ex):''));}return res;},rules);
console.log(out.join('\n'));await b.close();})();
