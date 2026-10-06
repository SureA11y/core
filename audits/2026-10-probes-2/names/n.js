const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const { createDomHelpers } = require('/home/user/core/src/core/dom-helpers.js');
module.exports=function(html, id, fn='getContentNameInfo'){
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, { pretendToBeVisual: true });
  const { window } = dom; const { document } = window;
  const helpers = createDomHelpers({ window, document, root: document });
  const el=document.getElementById(id);
  const r=helpers[fn](el,{helpers});
  console.log(JSON.stringify(html).slice(0,110),'=>',JSON.stringify(r));
};
