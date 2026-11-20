const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
(async()=>{
const r = await runa11yCoreOnHtml(`<html lang=en><head><title>x</title></head><body><main><button id=t></button><a href="/x" id=u><img src=a.png alt=""></a></main></body></html>`, { rules: { include: ['button-name-present','link-name-present'] } });
console.log(JSON.stringify(r.checksResults, null, 1).slice(0, 5000));
})();
