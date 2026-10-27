// Prints Chromium's computed role and name for every element with an id.
const { chromium } = require('/home/user/core/node_modules/playwright');
module.exports = async function axNames(html) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  try {
    const p = await b.newPage();
    await p.setContent(html);
    await p.waitForTimeout(30);
    const cdp = await p.context().newCDPSession(p);
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
    const out = [];
    const visit = (n) => { if (n.attributes) { const i = n.attributes.indexOf('id'); if (i >= 0 && i % 2 === 0) { const ax = nodes.find((x) => x.backendDOMNodeId === n.backendNodeId); out.push(`${n.attributes[i + 1]}: ${ax ? (ax.ignored ? 'ignored(' + (ax.ignoredReasons || []).map((r) => r.name).join(',') + ')' : ax.role.value) : 'absent'} ${JSON.stringify(ax?.name?.value ?? null)}`); } } (n.children || []).forEach(visit); (n.shadowRoots || []).forEach(visit); };
    visit(root);
    return out;
  } finally { await b.close(); }
};
if (require.main === module) module.exports(process.argv[2]).then((o) => console.log(o.join('\n')));
