const {JSDOM}=require('/home/user/core-r11/node_modules/jsdom');
const B=require('/home/user/core-r11/src/core.js'),A=require('/home/user/r11-perf-review/src/core.js');
const pool=['button',':nth-child(2 of .x)','div > :nth-child(2 of .x)',':nth-last-child(1 of .x)','a:nth-child(2 of .x)',':is(a, .y)',':where(.x) button',':has(> span)','a:has(span)','div a','a + button',':not(a)',':not(.x, .y)','*','.x','.y',':first-child','[href^="#"]',':is(:not(a))','button:not(:has(span))',':nth-child(odd)','input',':nth-child(3 of button, a)','li:nth-of-type(2)',':only-child',':empty',':has(+ a)',':has(~ .y)'];
const kids=['<a class="x" href="#a">A</a>','<button type="button">B</button>','<a class="x y" href="#c"><span>C</span></a>','<button class="y" type="button"><span>D</span></button>','<input aria-label="e">','<a href="#f">F</a>','<button class="x" type="button">G</button>'];
let seed=Number(process.argv[2]||7);const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;const pick=a=>a[Math.floor(rnd()*a.length)];
const sig=r=>JSON.stringify(r.checksResults.map(c=>[c.outcome,(c.occurrences||[]).map(o=>o.selector)]));
let diffs=0;const N=Number(process.argv[3]||150);
for(let t=0;t<N;t++){const n=2+Math.floor(rnd()*6);const css=[];for(let i=0;i<n;i++)css.push(pick(pool)+':focus{outline:none}');
 const groups=[];for(let g=0;g<2+Math.floor(rnd()*2);g++){const k=[];for(let i=0;i<1+Math.floor(rnd()*5);i++)k.push(pick(kids));groups.push('<div>'+k.join('')+'</div>');}
 const html=`<!doctype html><html lang="en"><head><title>t</title><style>${css.join('\n')}</style></head><body><main>${groups.join('')}</main></body></html>`;
 const out=[];for(const core of [B,A]){const dom=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true});global.window=dom.window;global.document=dom.window.document;
  out.push(sig(core.runDomRulesInPage(dom.window.location.href,null,{rules:{include:['css-focus-indicator-suppressed']}},null)));dom.window.close();}
 if(out[0]!==out[1]){diffs++;if(diffs<=3)console.log('DIFF\n',html,'\n before',out[0],'\n after ',out[1]);}}
console.log('cases',N,'diffs',diffs);
