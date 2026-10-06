const {scan,tryit}=require('./h');
const html='<html lang=en><title>t</title><body><img src=a>';
for (const p of ['constructor','__proto__','toString','hasOwnProperty','nope']) tryit(p,()=>{const r=scan(html,null,{policyContract:p},['img-alt-present']);return r.checksResults[0].outcome});
