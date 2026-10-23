// Same inline-handler pages in jsdom and Chromium (no hook): do the 2.1.1 rules agree?
import { createRequire } from 'node:module';
import { open, scan } from './h.mjs';
const req = createRequire('/home/user/core/package.json');
const runJsdom = req('/home/user/core/tests/helpers/runa11yCoreOnHtml.js');
const R = ['click-handler-keyboard-operable', 'mouse-only-event-handlers', 'focus-not-removed-by-script', 'widget-keyboard-focusable', 'scrollable-region-focusable', 'aria-expanded-state-mismatch', 'invalid-field-error-message'];
const cases = {
  spanOnclick: `<span role=button onclick="go()">Go</span>`,
  spanOnclickTab: `<span role=button tabindex=0 onclick="go()">Go</span>`,
  divOnclickPointer: `<div style="cursor:pointer" onclick="go()">Go</div>`,
  divOnclickNoCue: `<div onclick="go()">Go</div>`,
  noOp: `<span role=button onclick="return false;">Go</span>`,
  noOpVariants: `<span role=button onclick="return false ; void 0;">Go</span><span role=button onclick="event.preventDefault();return false">Go</span><span role=button onclick="javascript:void(0)">Go</span>`,
  ancestorKey: `<div onkeydown="k()"><span role=button tabindex=0 onclick="go()">Go</span></div>`,
  displayContents: `<span role=button tabindex=0 style="display:contents" onclick="go()">Go</span>`,
  delegateLink: `<div role=button onclick="go()"><a href="/x">Go</a></div>`,
  delegateHiddenLink: `<div role=button onclick="go()"><a href="/x" style="visibility:hidden">Go</a></div>`,
  ariaDisabledAncestor: `<div aria-disabled=true><span role=button onclick="go()">Go</span></div>`,
  roleNoneOnclick: `<div role=none onclick="go()" tabindex=0>x</div>`,
  mouseOver: `<div onmouseover="show()">tip</div>`,
  mouseOverFocusable: `<a href=# onmouseover="show()" onfocus="show()">tip</a>`,
  scrollable: `<div style="height:50px;overflow:auto"><p style="height:300px">long</p></div>`,
  f55: `<a href=# onfocus="this.blur()">x</a>`,
  expanded: `<button aria-expanded=false aria-controls=p>m</button><div id=p style="height:0;overflow:hidden">x</div>`,
  invalid: `<input aria-label=x aria-invalid=true aria-errormessage=e><p id=e style="visibility:hidden">bad</p>`,
  invalidVisChild: `<input aria-label=x aria-invalid=true aria-errormessage=e><div id=e style="visibility:hidden"><span style="visibility:visible">bad</span></div>`
};
const fmt = (rules) => R.map((id) => { const r = rules[id]; return r ? `${id.split('-')[0]}:${r.outcome}${r.occ.length ? '(' + r.occ.map((o) => o.reason).join(',') + ')' : ''}` : ''; }).filter((s) => !/:notApplicable$/.test(s)).join(' ');
const b = await open();
for (const [name, html] of Object.entries(cases)) {
  const c = await scan(b, html, { runOnly: R });
  const jr = runJsdom(html, { runOnly: R });
  const j = {};
  for (const x of jr.checksResults) j[x.ruleId] = { outcome: x.outcome, occ: (x.occurrences || []).map((o) => ({ reason: o.data?.details?.reasonCode })) };
  const a = fmt(c.rules), d = fmt(j);
  console.log((a === d ? 'same ' : 'DIFF ') + name.padEnd(22) + ' chromium: ' + a + (a === d ? '' : '\n' + ' '.repeat(28) + 'jsdom:    ' + d));
}
await b.close();
