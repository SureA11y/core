const { chromium } = require('/home/user/core/node_modules/playwright');
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'}); const p = await b.newPage();
  await p.setContent(`<style>html{background:#000}body{margin:0}</style><div style="opacity:.5"><p id=t style="margin:0;background:#fff;color:#000;font:bold 60px Arial">HHHH</p></div><div style="background:oklch(0.2 0 0);height:30px"></div>`);
  const buf = await p.screenshot({ clip: { x: 0, y: 0, width: 300, height: 100 } });
  require('fs').writeFileSync('/tmp/scratchpad/rules-b/pix.png', buf);
  console.log(await p.evaluate(() => getComputedStyle(document.querySelectorAll('div')[1]).backgroundColor));
  await b.close();
})();
;(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});const p=await b.newPage();
const d='data:image/png;base64,'+require('fs').readFileSync('/tmp/scratchpad/rules-b/pix.png').toString('base64');
console.log(await p.evaluate(async(d)=>{const i=new Image();i.src=d;await i.decode();const c=document.createElement('canvas');c.width=300;c.height=100;const x=c.getContext('2d');x.drawImage(i,0,0);const m={};const D=x.getImageData(0,0,300,68).data;for(let k=0;k<D.length;k+=4){const s=D[k]+','+D[k+1]+','+D[k+2];m[s]=(m[s]||0)+1}return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,3)},d));await b.close()})();
