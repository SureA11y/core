'use strict';
// Does any focusing rule other than aria-hidden-focus replace the page's selection?
const { serve, launch, addBundle } = require('./lib');
const mk=(extra)=>`<!doctype html><html lang="en"><title>t</title><style>.ce:focus{opacity:0} input:focus{outline:none;visibility:hidden} textarea:focus{clip-path:inset(50%)}</style>
<main><h1>x</h1><p id=p>Para text here</p>${extra}</main><script>const r=document.createRange();r.selectNodeContents(document.getElementById('p'));getSelection().addRange(r);</script>`;
const pages={'/ce':{body:mk('<div class=ce contenteditable aria-label="ed" role=textbox>Editable</div>')},
 '/input':{body:mk('<input aria-label="f" value="abc">')},
 '/textarea':{body:mk('<textarea aria-label="f">abc</textarea>')},
 '/frame':{body:mk('<iframe title="f" srcdoc="<input aria-label=x autofocus value=q><div contenteditable>e</div>"></iframe>')},
 '/blur':{body:mk('<input aria-label="f" value="abc" onfocus="this.blur()"><div contenteditable onfocus="this.blur()">e</div>')}};
(async()=>{const s=await serve(pages);const {browser,context}=await launch();
for(const p of Object.keys(pages)){const page=await context.newPage();await page.goto(s.base+p);await page.waitForTimeout(100);await addBundle(page,s.base);
const sel=()=>page.evaluate(()=>{const s=getSelection();return `${s.rangeCount}/${s.type}/"${String(s)}"/active=${document.activeElement.nodeName}`});
for (const rule of [null,'css-hidden-focus','focus-not-removed-by-script','iframe-focusable-content','aria-hidden-focus']){
 await page.evaluate(()=>{getSelection().removeAllRanges();const r=document.createRange();r.selectNodeContents(document.getElementById('p'));getSelection().addRange(r);});
 const b=await sel();const out=await page.evaluate(async(rule)=>{const r=await window.a11ycore.runa11yCoreInPage(null,null,{},rule?[rule]:null);return rule?r.checksResults.map(c=>c.outcome).join():''},rule);const a=await sel();
 console.log(p.padEnd(10),(rule||'ALL').padEnd(30),out.padEnd(14),b===a?'kept':'CHANGED '+b+' => '+a);}
await page.close();}
await browser.close();s.close();})();
