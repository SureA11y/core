'use strict';
// Prints Chromium's computed accessible name for #t in a given HTML snippet.
// usage: node axname.js '<html>'
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent(process.argv[2]);
  const cdp = await p.context().newCDPSession(p);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const doc = await cdp.send('DOM.getDocument');
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#t' });
  const { node } = await cdp.send('DOM.describeNode', { nodeId });
  const ax = nodes.find((n) => n.backendDOMNodeId === node.backendNodeId);
  console.log(JSON.stringify({ role: ax && ax.role && ax.role.value, name: ax && ax.name && ax.name.value }));
  await b.close();
})();
