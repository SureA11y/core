process.env.PLAYWRIGHT_BROWSERS_PATH='/tmp/scratch/pw1234';
const { chromium } = require('/home/user/r12-contrast/node_modules/playwright');
const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:400,height:100}});
const src=fs.readFileSync('hid.js','utf8');const W=eval(src.match(/const W=(`[\s\S]*?`);/)[1]);
await p.setContent('<body style="margin:10px;font-size:32px">'+W+'<div class="star-rating" role="img" aria-label="Rated 4.00 out of 5" style="float:none"><span style="width:80%">Rated <strong class="rating">4.00</strong> out of 5</span></div></body>');
fs.writeFileSync('woo.png',await p.screenshot());
console.log(await p.evaluate(()=>{const s=document.querySelector('.star-rating span');const r=s.getBoundingClientRect();const pr=s.parentElement.getBoundingClientRect();const t=document.createRange();t.selectNodeContents(s);const tr=t.getClientRects()[0];return JSON.stringify({span:[r.top,r.bottom],parent:[pr.top,pr.bottom],text:[tr.top,tr.bottom]})}));
await b.close();})();
