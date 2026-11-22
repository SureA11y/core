const fs=require('fs');const {chromium}=require('/home/user/core-r11/node_modules/playwright');
const bundles=[fs.readFileSync('/home/user/core-r11/surea11y.browser.js','utf8'),fs.readFileSync('/home/user/r11-perf-review/surea11y.browser.js','utf8')];
const pool=['button',':nth-child(2 of .x)','div > :nth-child(2 of .x)','a:nth-child(2 of .x)',':is(a, .y)',':where(.x) button',':has(> span)','a:has(span)','div a','a + button',':not(a)',':not(.x, .y)','*','.x','.y',':first-child','[href^="#"]','button:not(:has(span))',':nth-child(odd)',':nth-child(3 of button, a)',':only-child',':has(+ a)',':has(~ .y)',':scope a','div:scope > a',':host a',':host(.z) button',':host-context(.z) a',':defined',':is(main) a','main a','body > main > div > button','svg|a','[data-x="a,b"]','a:not([href="#a"])','button:enabled','a:any-link','.x:is(:focus-visible)'];
const kids=['<a class="x" href="#a">A</a>','<button type="button">B</button>','<a class="x y" href="#c"><span>C</span></a>','<button class="y" type="button"><span>D</span></button>','<a href="#f">F</a>','<button class="x" type="button">G</button>'];
let seed=Number(process.argv[2]||11);const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;const pick=a=>a[Math.floor(rnd()*a.length)];
const N=Number(process.argv[3]||60);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});let diffs=0;
for(let t=0;t<N;t++){const n=2+Math.floor(rnd()*7);const css=[];for(let i=0;i<n;i++)css.push(pick(pool)+':focus{outline:none}');
 const groups=[];const G=2+Math.floor(rnd()*4);for(let g=0;g<G;g++){const k=[];for(let i=0;i<1+Math.floor(rnd()*6);i++)k.push(pick(kids));groups.push('<div>'+k.join('')+'</div>');}
 const shadow=rnd()<0.5;const shadowKids=groups.slice(0,2).join('');
 const html=`<!doctype html><html lang="en"><head><title>t</title><style>${css.join('\n')}</style></head><body class="${rnd()<.5?'z':''}"><main>${groups.join('')}${shadow?'<div id="h" class="z"></div>':''}</main>${shadow?`<script>const r=document.getElementById('h').attachShadow({mode:'open'});r.innerHTML=${JSON.stringify('<style>'+css.join('\n')+'</style>'+shadowKids)};</script>`:''}</body></html>`;
 const out=[];for(const B of bundles){const p=await b.newPage();await p.setContent(html);await p.addScriptTag({content:B});
  out.push(await p.evaluate(async()=>{const r=await window.a11ycore.runa11yCoreInPage(null,null,{includeShadowDom:true,rules:{include:['css-focus-indicator-suppressed']}},null);return JSON.stringify(r.checksResults.map(c=>[c.outcome,(c.occurrences||[]).map(o=>o.selector+'|'+(o.message||'').slice(0,60))]));}));await p.close();}
 if(out[0]!==out[1]){diffs++;if(diffs<=3)console.log('DIFF\n',html,'\n before',out[0],'\n after ',out[1]);}}
console.log('cases',N,'diffs',diffs);await b.close();})();
