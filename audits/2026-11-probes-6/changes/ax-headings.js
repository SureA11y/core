const { chromium } = require('/home/user/core/node_modules/playwright');
const vals = ['2.5', ' 3', '+2', '0', '-1', '1e1', '', 'abc', '3x', '10', '99', '4294967297', '99999999999999999999', '\t2', '٣', '２'];
const cases = [];
for (const v of vals) { cases.push(['div', v]); cases.push(['h3', v]); cases.push(['h3r', v]); }
const html = '<!doctype html><html lang="en"><body>' + cases.map(([k, v], i) => {
  const a = `aria-level="${v}"`;
  if (k === 'div') return `<div role="heading" ${a} id="c${i}">c${i}</div>`;
  if (k === 'h3') return `<h3 ${a} id="c${i}">c${i}</h3>`;
  return `<h3 role="heading" ${a} id="c${i}">c${i}</h3>`;
}).join('') + '<h3 role="heading" id="x1">x1</h3><div role="heading" id="x2">x2</div><h1 role="heading" id="x3">x3</h1></body></html>';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.setContent(html);
  const s = await p.context().newCDPSession(p);
  const { nodes } = await s.send('Accessibility.getFullAXTree');
  const lv = {};
  for (const n of nodes) {
    if (n.role && n.role.value === 'heading') {
      const name = n.name && n.name.value;
      const l = (n.properties || []).find(pp => pp.name === 'level');
      lv[name] = l ? l.value.value : null;
    }
  }
  const out = cases.map(([k, v], i) => `${k}\t${JSON.stringify(v)}\t${lv['c' + i]}`);
  console.log(out.join('\n'));
  console.log('x1', lv.x1, 'x2', lv.x2, 'x3', lv.x3);
  console.log('version', b.version());
  await b.close();
})();
