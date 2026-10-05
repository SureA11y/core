const {launch}=require('./lib.cjs');
(async()=>{ const b=await launch(); const p=await b.newPage(); const al=[]; p.on('dialog',async d=>{al.push(d.message());await d.dismiss();}); p.on('pageerror',e=>console.log('PAGEERROR',e.message));
 await p.goto('file://'+process.cwd()+'/out-tampered.html'); await p.evaluate(()=>document.querySelector('details').open=true); await p.waitForTimeout(300);
 console.log('alerts',al, 'rows', await p.evaluate(()=>document.querySelectorAll('#findings-body tr').length), 'imgs', await p.evaluate(()=>document.querySelectorAll('img').length));
 await b.close(); })();
