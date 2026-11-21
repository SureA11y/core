// Chromium differential harness for core-r8
const fs = require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const BUNDLE = fs.readFileSync('/home/user/core-r8/surea11y.browser.js', 'utf8');
async function launch(){ return chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
async function runCase(browser, c, rules = null, opts = {}) {
  const page = await browser.newPage();
  const doc = /<html/i.test(c.html) ? c.html : `<!doctype html><html lang="en"><head><title>T</title></head><body><main>${c.html}</main></body></html>`;
  await page.setContent(doc);
  if (c.setup) await page.evaluate(c.setup);
  await page.evaluate(BUNDLE);
  const res = await page.evaluate(async ({ rules, opts }) => {
    const r = await window.a11ycore.runa11yCoreInPage(null, null, opts, rules);
    function tOf(sel, hosts){ try { let root=document; for (const h of (hosts||[])) { const e=root.querySelector(h); root = e && e.shadowRoot || root; } const el=root.querySelector(sel); if(!el) return '?'; const t = el.closest('[data-t]'); return el.getAttribute('data-t') || (t? '~'+t.getAttribute('data-t') : el.tagName.toLowerCase()); } catch(e){ return 'ERR'; } }
    return r.checksResults.map(x => ({ ruleId: x.ruleId, outcome: x.outcome, error: x.error && String(x.error.message||x.error), occ: (x.occurrences||[]).map(o => { const d=(o.data&&o.data.details)||{}; return { sel: o.selector, t: tOf(o.selector, o.shadowHostSelectors), oc: o.occurrenceOutcome || x.outcome, sum: o.summary, hint: o.hint, lean: o.lean, rc: d.reasonCode, name: d.refs && d.refs.accessibleName && d.refs.accessibleName.value }; }) }));
  }, { rules, opts });
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  let dom; try { dom = await cdp.send('DOM.getDocument', { depth: -1, pierce: true }); } catch { dom = { root: {} }; }
  const tmap = {};
  (function walk(n){ if (n.attributes){ for (let i=0;i<n.attributes.length;i+=2) if (n.attributes[i]==='data-t') tmap[n.backendNodeId]=n.attributes[i+1]; } (n.children||[]).concat(n.shadowRoots||[]).concat(n.contentDocument?[n.contentDocument]:[]).concat(n.templateContent?[]:[]).forEach(walk); })(dom.root);
  const ax = {};
  for (const n of nodes) if (n.backendDOMNodeId && tmap[n.backendDOMNodeId]) { const props={}; (n.properties||[]).forEach(p=>props[p.name]=p.value&&p.value.value); ax[tmap[n.backendDOMNodeId]] = { role: n.role && n.role.value, name: n.name && n.name.value, ignored: n.ignored||undefined, ...(c.props? {props}:{}) }; }
  await page.close();
  return { res, ax };
}
const NOISE=new Set((process.env.NOISE||'manual-review,page-has-heading-one,page-title-patterns,region,bypass-blocks-present,landmark-one-main,heading-order,page-zones-landmark,focus-order-semantics,tabindex,widget-keyboard-focusable,css-focus-indicator-suppressed,target-size-minimum,target-size-enhanced,contrast-minimum,contrast-enhanced,contrast-computable,skip-link,text-spacing-content-loss,reflow-horizontal-scroll,focus-not-obscured-minimum,focus-not-obscured-enhanced,identical-links-same-purpose,link-name-quality,link-name-quality-link-only,heading-quality').split(','));
function summarize(c, out, showPass=false) {
  const lines = [];
  for (const r of out.res) {
    if (NOISE.has(r.ruleId)) continue;
    if (r.error) lines.push(`  ERR ${r.ruleId}: ${r.error.slice(0,300)}`);
    for (const o of r.occ) if (showPass || (o.oc !== 'pass' && o.oc !== 'notApplicable')) lines.push(`  ${r.ruleId} [${o.oc}${o.lean?'/'+o.lean:''}] ${o.rc} t=${o.t} name=${JSON.stringify(o.name)} :: ${o.sum} ${o.hint? '| '+String(o.hint).slice(0,200):''}`);
  }
  return `== ${c.id}: AX ${JSON.stringify(out.ax)}\n` + lines.join('\n');
}
async function runAll(cases, rules=null, opts={}, showPass=false){ const b = await launch(); for (const c of cases){ try { const out = await runCase(b, c, c.rules||rules, c.opts||opts); console.log(summarize(c,out,showPass)); } catch(e){ console.log('== '+c.id+' CRASH '+e.message.slice(0,500)); } } await b.close(); }
module.exports = { launch, runCase, summarize, runAll, BUNDLE };
