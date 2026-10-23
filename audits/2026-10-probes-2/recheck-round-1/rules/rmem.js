const {page,close}=require('../../visual/h.js');
(async()=>{
 let h='<main><h1>T</h1>'; for(let i=0;i<300;i++) h+=`<p style="color:#555">Para ${i} <a href="#${i}">link ${i}</a> <img src="x${i}.png" alt="img ${i}"> <button>b${i}</button></p>`; h+='</main>';
 const p=await page(h);
 const cdp=await p.context().newCDPSession(p);
 await cdp.send('HeapProfiler.enable');
 const heap=async()=>{await cdp.send('HeapProfiler.collectGarbage');await cdp.send('HeapProfiler.collectGarbage');return (await cdp.send('Runtime.getHeapUsage')).usedSize;};
 const scan=()=>p.evaluate(()=>Promise.resolve(a11ycore.runa11yCoreInPage(location.href,null,{},null)).then(()=>0));
 for(let i=0;i<5;i++) await scan();
 const h0=await heap();
 const N=40; for(let i=0;i<N;i++) await scan();
 const h1=await heap();
 for(let i=0;i<N;i++) await scan();
 const h2=await heap(); const hs=[h2]; for(let k=0;k<3;k++){for(let i=0;i<N;i++) await scan(); hs.push(await heap());} console.log("later batches KB/scan", hs.slice(1).map((v,i)=>((v-hs[i])/N/1024).toFixed(1)).join(" "));
 console.log('heap', h0, h1, h2, 'per scan KB', ((h1-h0)/N/1024).toFixed(1), ((h2-h1)/N/1024).toFixed(1));
 const dom=await p.evaluate(()=>({els:document.querySelectorAll('*').length, styles:document.querySelectorAll('style').length, attrs:[...document.querySelectorAll('[data-surea11y]')].length}));
 console.log(dom);
 await close();
})();
