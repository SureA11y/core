const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js','utf8');
let browser;
async function page(html, opts={}) {
  if (!browser) browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(()=>chromium.launch());
  const p = await browser.newPage({viewport: opts.viewport||{width:800,height:600}, ...(opts.ctx||{})});
  const full = /^<!doctype/i.test(html)?html:`<!doctype html><html lang="en"><head><title>Probe page</title><style>html,body{background:#fff;color:#000}</style>${opts.head||''}</head><body>${html}</body></html>`;
  await p.setContent(full);
  await p.addScriptTag({content:BUNDLE});
  return p;
}
async function scan(html, rules, opts={}) {
  const p = await page(html, opts);
  const r = await p.evaluate(({rules,eo})=>a11ycore.runa11yCoreInPage(location.href,null,eo||{},rules),{rules,eo:opts.engineOptions});
  if (opts.shot) await p.screenshot({path:opts.shot});
  const out = r.checksResults.filter(x=>!rules||rules.includes(x.ruleId)).map(x=>({id:x.ruleId,outcome:x.outcome,occ:(x.occurrences||[]).map(o=>({sel:o.selector,out:o.outcome,msg:(o.summary||'').slice(0,260),d:o.data&&o.data.details?JSON.stringify(o.data.details).slice(0,400):undefined}))}));
  if (opts.keep) return {out,p};
  await p.close();
  return out;
}
function show(label,out){ console.log('=== '+label); for (const r of out){ console.log(' ['+r.id+'] '+r.outcome); for (const o of r.occ) console.log('    '+(o.out||'')+' '+o.sel+' :: '+o.msg+(o.d&&process.env.D?'\n       '+o.d:'')); } }
async function run(cases, rules, opts){ for (const [label,html,o] of cases) show(label, await scan(html, rules, {...opts,...(o||{})})); await browser.close(); }
module.exports = { scan, page, show, run, close: async()=>browser&&browser.close() };
