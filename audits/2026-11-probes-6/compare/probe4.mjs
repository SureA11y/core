import { createRequire } from 'node:module';
import path from 'node:path';
const { chromium } = createRequire('/home/user/core/package.json')('playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const lorem = 'We are open on weekdays and on most Saturdays, and closed on public holidays.';
const pages = {
  'P11-bold-then-br': `<p><strong>Opening hours</strong><br>${lorem}</p><p>${lorem}</p>`,
  'P12-bold-lead-in-li': `<ul><li><strong>Opening hours</strong></li><li>${lorem}</li></ul>`,
  'P13-bold-label-colon': `<p><strong>Opening hours:</strong></p><p>${lorem}</p>`,
  'P14-bold-address-first': `<p><b>Acme Ltd</b></p><p><b>1 High Street</b></p><p>${lorem}</p>`,
  'P15-span-bold-in-div-text': `<div class="h">Opening hours</div><p>${lorem}</p>`,
};
for (const [id, body] of Object.entries(pages)) {
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.setContent(`<!doctype html><html lang=en><head><title>t</title><style>body{font:16px sans-serif}.h{font-weight:700}</style></head><body><main>${body}</main></body></html>`);
  await p.addScriptTag({ path: '/home/user/core/surea11y.browser.js' });
  const ours = await p.evaluate(() => { const c = window.a11ycore.runa11yCoreInPage(null, null, {}, ['p-as-heading']).checksResults[0]; return c.outcome + ' ' + (c.occurrences||[]).map(o=>o.data.details.reasonCode+':'+o.html.slice(0,40)).join(' | '); });
  await p.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  const axe = await p.evaluate(async () => { const r = await axe.run(document,{runOnly:{type:'rule',values:['p-as-heading']}}); return ['violations','incomplete','passes'].map(k=>k+':'+r[k].reduce((n,x)=>n+x.nodes.length,0)).join(' '); });
  await p.addScriptTag({ path: 'node_modules/accessibility-checker-engine/ace.js' });
  const ibm = await p.evaluate(async () => { const r = await new ace.Checker().check(document, ['IBM_Accessibility']); return r.results.filter(x=>x.ruleId==='text_block_heading').map(x=>x.value[1]+':'+x.path.dom.split('/').pop()).join(' '); });
  await p.addScriptTag({ path: 'node_modules/html_codesniffer/build/HTMLCS.js' });
  const h = await p.evaluate(() => new Promise(r => HTMLCS.process('WCAG2AAA', document, () => r(HTMLCS.getMessages().filter(m=>/H42/.test(m.code)).map(m=>m.element.nodeName).join(',')))));
  console.log(JSON.stringify({ id, ours, axe, ibm, htmlcs: h }));
  await p.close();
}
await b.close();
