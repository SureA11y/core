const {scan,close}=require('./h.js');
(async()=>{
 for (const body of [
  '<p>Read the <a href="#z" style="color:#000;text-decoration:none"></a> now and also more words here.</p>',
  '<p>Read the <a href="#z" style="color:#000;text-decoration:none" aria-label="docs"><svg width=12 height=12><rect width=12 height=12 /></svg></a> now and also more words.</p>',
  '<p>Read the <x-link role=link tabindex=0></x-link> now and also more words here.</p>',
 ]){
 const o=await scan(`<!doctype html><html lang=en><title>x</title><body style="background:#fff;color:#000"><main><h1>x</h1>${body}</main>`,{rules:['link-in-text-block','link-name-present']});
 console.log(body.slice(0,80)); for(const k in o) console.log('  ',k,o[k].outcome,o[k].occ.map(x=>x.msg.slice(0,100)).join('|'));}
 await close();})();
