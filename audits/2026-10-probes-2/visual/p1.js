const {px}=require('./px');const h=require('./h');
(async()=>{
 const cases=[
 ['own opacity','<p id=t style="opacity:.5;background:#000;color:#fff;font-size:30px">Large heading text</p>','#t'],
 ['fill','<p id=t style="color:#eee;-webkit-text-fill-color:#000">Readable black text</p>','#t'],
 ['first-line','<style>.f{color:#bbb}.f::first-line{color:#000}</style><p id=t class="f">Single line paragraph black</p>','#t'],
 ['stroke','<p id=t style="color:#ddd;-webkit-text-stroke:2px #000;font-size:30px">Stroked text</p>','#t'],
 ];
 for (const [l,h1,s] of cases) console.log(l, JSON.stringify(await px(h1,s)));
 await h.close();
})();
