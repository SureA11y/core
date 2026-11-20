// Chromium differential harness: engine findings vs Chromium AX tree
const fs = require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const NAME_RULES = ['button-name-present','link-name-present','form-control-programmatic-label-present','img-alt-present','input-image-alt-present','aria-role-name-present','binary-control-name-present','combobox-name-present','dialog-name-present','iframe-name-present','landmark-role-name-present','listbox-name-present','menuitem-name-present','meter-name-present','option-name-present','progressbar-name-present','role-img-text-alternative-present','searchbox-name-present','slider-name-present','spinbutton-name-present','summary-name-present','svg-image-text-alternative-present','svg-text-alternative-present','tab-name-present','textbox-name-present','tooltip-name-present','treeitem-name-present','empty-heading','area-alt-present','label-in-name','aria-allowed-role','aria-allowed-attr','aria-prohibited-attr','aria-required-parent','aria-required-children','listitem-parent-valid','list-children-valid','aria-roles-valid','aria-valid-attr-value','form-control-single-label','nested-interactive-controls-absent','control-name-title-only','label-title-only'];
async function launch(){ const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); return browser; }
async function runCase(browser, c, rules = NAME_RULES, extraOpts = {}) {
  const page = await browser.newPage();
  const doc = c.html.includes('<html') ? c.html : `<!doctype html><html lang="en"><head><title>T</title></head><body><main>${c.html}</main></body></html>`;
  await page.setContent(doc);
  if (c.setup) await page.evaluate(c.setup);
  await page.addScriptTag({ content: BUNDLE });
  const res = await page.evaluate(async ({ rules, extraOpts }) => {
    const r = await window.a11ycore.runa11yCoreInPage(null, null, Object.assign({ rules: { include: rules } }, extraOpts), null);
    return r.checksResults.map(x => ({ ruleId: x.ruleId, outcome: x.outcome, verdicts: x.verdicts, occ: (x.occurrences||[]).map(o => ({ sel: o.selector, oc: o.occurrenceOutcome || x.outcome, sum: o.summary, hint: o.hint, rc: o.data && o.data.details && o.data.details.reasonCode, name: o.data && o.data.details && o.data.details.refs && o.data.details.refs.accessibleName && o.data.details.refs.accessibleName.value, aria: o.waiAria || o.ariaVerdict || (o.verdicts) , unc: o.uncertainty || (o.data && o.data.uncertainty) })), error: x.error }));
  }, { rules, extraOpts });
  // Chromium AX for [data-t]
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const dom = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const tmap = {};
  (function walk(n){ if (n.attributes){ for (let i=0;i<n.attributes.length;i+=2) if (n.attributes[i]==='data-t') tmap[n.backendNodeId]=n.attributes[i+1]; } (n.children||[]).concat(n.shadowRoots||[]).concat(n.contentDocument?[n.contentDocument]:[]).forEach(walk); })(dom.root);
  const ax = {};
  for (const n of nodes) if (n.backendDOMNodeId && tmap[n.backendDOMNodeId]) ax[tmap[n.backendDOMNodeId]] = { role: n.role && n.role.value, name: n.name && n.name.value, ignored: n.ignored };
  await page.close();
  return { res, ax };
}
function summarize(c, out) {
  const lines = [];
  for (const r of out.res) {
    if (r.error) lines.push(`  ERR ${r.ruleId}: ${String(r.error).slice(0,200)}`);
    for (const o of r.occ) if (o.oc !== 'pass' && o.oc !== 'notApplicable') lines.push(`  ${r.ruleId} [${o.oc}] ${o.rc} sel=${o.sel} name=${JSON.stringify(o.name)} unc=${JSON.stringify(o.unc)} :: ${o.sum} ${o.hint? '| '+o.hint.slice(0,160):''}`);
  }
  return `== ${c.id}: AX ${JSON.stringify(out.ax)}\n` + lines.join('\n');
}
module.exports = { launch, runCase, summarize, NAME_RULES, BUNDLE };
