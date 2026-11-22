const {chromium}=require('/tmp/surea11y-audit/r12/cms/wt/node_modules/playwright-core');
(async()=>{
 const br=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--allow-file-access-from-files']});
 const pg=await br.newPage({viewport:{width:1280,height:900}});
 await pg.goto('http://127.0.0.1:8765/host.html'); await pg.addScriptTag({path:'/tmp/surea11y-audit/r12/cms/h/panel.js'});
 for (const w of [360,600,800]){
 const r=await pg.evaluate(async(w)=>{
  const P=window.SureA11yPanel;
  const sb=P.createSandbox(document,{engineUrl:'http://127.0.0.1:8765/engine.js',width:w,styles:'<style>.card{width:200px;height:40px;overflow:hidden}</style>'});
  const items=[{id:'b1',html:'<div class="card">This text is far too long to fit inside the little card box and is cut off by its fixed height when the page is zoomed.</div>'},{id:'b2',html:'<p><strong>Opening hours</strong></p><p>We are open every day from 9 to 5, except on public holidays when we close at noon.</p>'}];
  try{ const res=await sb.scan(items,{profile:'cms-content',packs:['@surea11y/pack-cms@0.2.0']}); sb.destroy();
   return res.findings.map(f=>f.ruleId+':'+f.reasonCode+':'+f.group+':'+f.itemId);}catch(e){return 'ERR '+e.message}
 },w); console.log(w, JSON.stringify(r)); }
 await br.close();})();
