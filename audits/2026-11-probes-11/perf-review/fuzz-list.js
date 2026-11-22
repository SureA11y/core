// Does el.matches(a, b, ...) equal OR of el.matches(each) in jsdom and Chromium?
const sels=['a','button','.x','#i','[type=text]','input:not([type])',':is(a,button)',':where(.x) a',':has(> span)','a:has(span)',
'div > a','div a','a + a','a ~ button',':not(a)',':not(.x, .y)','*','body *',':nth-child(2)',':nth-child(2 of .x)',':first-child',':last-of-type',
'[href^="h"]','[class~=x i]','input:checked','input:disabled','a:link','a:any-link',':root a','html a',':is(:not(a))','button:not(:has(span))',
'.x.y','div:has(a) > button','a:not(:hover)','*:focus','svg a','[data-a="b,c"]','button[aria-pressed]',':is(div, span) > :is(a,button)','a:not(.x):not(.y)',
':nth-last-child(1)',':only-child','input:read-write','input:placeholder-shown','button:enabled','a:visited',':empty','div:not(:empty) a',':lang(en) a','[dir] a',':dir(ltr)'];
const html=`<!doctype html><html lang="en"><body><div class="x"><a href="h1" class="x y">a<span>s</span></a><button>b</button><a href="h2">c</a></div>
<p><input type="text" id="i"><input><input type=checkbox checked disabled><button aria-pressed=true class="y"><span>z</span></button></p><svg><a href="#">q</a></svg><div data-a="b,c" dir="rtl"></div></body></html>`;
function test(doc){const els=[...doc.querySelectorAll('*')];const bad=[];
 const valid=sels.filter(s=>{try{doc.documentElement.matches(s);return true}catch{return false}});
 // random subsets
 let seed=1;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let t=0;t<3000;t++){const k=2+Math.floor(rnd()*8);const sub=[];for(let i=0;i<k;i++)sub.push(valid[Math.floor(rnd()*valid.length)]);
  const list=sub.join(', ');for(const el of els){let a;try{a=el.matches(list)}catch(e){a='ERR'};const b=sub.some(s=>el.matches(s));if(a!==b){bad.push({list,el:el.outerHTML.slice(0,40),a,b});break;}}
  if(bad.length>5)break;}
 return {valid:valid.length,invalid:sels.filter(s=>!valid.includes(s)),bad};}
(async()=>{const {JSDOM}=require('/home/user/core-r11/node_modules/jsdom');const d=new JSDOM(html);console.log('jsdom',JSON.stringify(test(d.window.document),null,1));
const {chromium}=require('/home/user/core-r11/node_modules/playwright');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();await p.setContent(html);
console.log('chrome',JSON.stringify(await p.evaluate(`(${test.toString().replace('function test','function')})(document)`.replace('sels.',JSON.stringify(sels)+'.').replace('sels.',JSON.stringify(sels)+'.'))));await b.close();})();
