const {JSDOM}=require('/home/user/core-r11/node_modules/jsdom');
const html=`<!doctype html><html lang="en"><body><div class="x"><a href="h1" class="x y">a<span>s</span></a><button>b</button><a href="h2">c</a></div></body></html>`;
const tryList=(sub)=>{const d=new JSDOM(html).window.document;const el=d.querySelector('button');return [el.matches(sub.join(', ')), sub.some(s=>el.matches(s))];};
let sub=[':nth-child(2 of .x)','a:any-link','input:read-write','button','.x','a:any-link','a:not(:hover)','a',':nth-child(2 of .x)'];
console.log(tryList(sub));
let changed=true;while(changed){changed=false;for(let i=0;i<sub.length;i++){const s2=sub.filter((_,j)=>j!==i);const [a,b]=tryList(s2);if(a!==b){sub=s2;changed=true;break;}}}
console.log(sub, tryList(sub));
console.log('jsdom', require('/home/user/core-r11/node_modules/jsdom/package.json').version, require('/home/user/core-r11/node_modules/@asamuzakjp/dom-selector/package.json').version);
