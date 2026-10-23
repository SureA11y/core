const {contrastRun,report}=require('./ch.js');const {close}=require('./h.js');
(async()=>{
 const html=`<!doctype html><html lang=en><head><title>c</title><style>html,body{background:#fff;color:#000;margin:0;font:16px sans-serif} select{margin:10px;font-size:16px;border:0;outline:0;appearance:none;padding:4px}</style></head><body><main>
 <label>A <select data-t id=sel_dark_opt_light style="color:#000;background:#fff"><option style="color:#bbb">Choose one option</option><option style="color:#bbb">Other</option></select></label><br>
 <label>B <select data-t id=sel_light_opt_dark style="color:#bbb;background:#fff"><option style="color:#000">Choose one option</option></select></label><br>
 <label>C <select data-t id=lb_opt_light size=3 style="color:#000;background:#fff"><option style="color:#bbb">Option light</option><option>Option dark</option></select></label><br>
 <label>D <select data-t id=sel_hidden_opt style="color:#000;background:#fff"><option>Visible choice</option><option style="color:#ddd">Not shown until opened</option></select></label>
 </main></body></html>`;
 const r=await contrastRun(html);
 console.log(report('select options',r,{sel_dark_opt_light:'pass (drawn #000)',sel_light_opt_dark:'fail (drawn #bbb)',lb_opt_light:'fail (listbox shows #bbb option)',sel_hidden_opt:'pass (closed dropdown shows only selected option)'}));
 await close();})();
