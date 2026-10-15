const {scan,brief,close}=require('./h.js');
(async()=>{const o=await scan('<!doctype html><html lang=en><title>x</title><body><main><h1>x</h1><p>hi</p></main>');console.log(brief(o,['contrast-computable','contrast-minimum']));console.log(JSON.stringify(o['contrast-computable'].occ[0]).slice(0,1000));await close();})();
