const {px}=require('./px');const h=require('./h');
(async()=>{
 const html='<span id=t style="display:inline-block;padding:4px 8px;opacity:.6;background:#000;color:#fff;font-size:16px">New feature tag</span>';
 h.show('engine', await h.scan(html,['contrast-minimum']));
 console.log('pixels', JSON.stringify(await px(html,'#t')));
 const svg='<svg id=t width="200" height="40"><rect width="200" height="40" fill="#000"/><text x="10" y="25" fill="#ddd" font-size="16">Badge label</text></svg>';
 console.log('svg pixels', JSON.stringify(await px(svg,'#t')));
 await h.close();
})();
