// WCAG rollups the engine calls notApplicable ("rules find every case") on pages that do have such a case.
'use strict';
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const page = (b) => `<!doctype html><html lang=en><head><title>t</title></head><body><main><h1>h</h1>${b}</main></body></html>`;
const cases = {
  '1.3.5 email field, no autocomplete': page('<label for=e>Your email</label><input type=email id=e name=email>'),
  '1.3.5 name field, no autocomplete': page('<label for=n>Your name</label><input id=n name=name>'),
  '1.3.5 contenteditable textbox for name': page('<div id=l>Your name</div><div role=textbox contenteditable aria-labelledby=l></div>'),
  '2.4.3 only a scroller': page('<div style="overflow:auto;height:30px"><p>a</p><p>b</p><p>c</p><p>d</p></div>'),
  '2.5.3 button labelled by image of text': page('<button aria-label="Go"><img src="go.png" alt="Search now"></button>'),
  '2.4.4 link via onclick span': page('<span onclick="location=\'/x\'" style="cursor:pointer">Read more</span>'),
  '3.3.2 custom combobox no label': page('<div role=combobox tabindex=0 aria-expanded=false></div>'),
  '2.5.8 div with click handler': page('<div onclick="1" style="width:10px;height:10px;background:red"></div>')
};
for (const [k, html] of Object.entries(cases)) {
  const r = runa11yCoreOnHtml(html, {});
  const sc = k.split(' ')[0];
  const rr = r.rulesResults.filter((x) => (x.meta?.wcagSc || x.data?.details?.wcagSc || []).includes(sc) || x.ruleId.includes('-' + sc + '-'));
  console.log(k.padEnd(42), rr.map((x) => x.ruleId + '=' + x.outcome + (x.data?.details?.reasonCode ? '(' + x.data.details.reasonCode.replace('composite.rollup.', '') + ')' : '')).join(' '));
}
