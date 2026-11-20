const { sd, base, mkPack, runa11yCoreOnHtml, TILDE } = require('./lib.js');
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
function rollups(d, label) {
  const p = mkPack(sd.standardFromData(d));
  const r = runa11yCoreOnHtml(html, { engineOptions: { packs: [p], profile: 'base-1' } });
  const rs = (r.rulesResults || r.results || []).filter((x) => /^base-1-/.test(x.ruleId || x.id));
  console.log(label, rs.map((x) => `${x.ruleId || x.id}=${x.outcome}`).join(' '));
}
let d = base(); rollups(d, 'plain           ');
d = base(); d.data[1].ruleMap['img-alt-present'] = { requirements: [], asks: ['B'] }; rollups(d, 'asks B, req []  ');
d = base(); d.data[1].ruleMap['img-alt-present'] = { requirements: ['A'], asks: ['B'] }; rollups(d, 'asks B, req [A] ');
// same with a test (two-level) to compare
d = base(); d.data[1].tests = { 'A.1': { title: 'a1', requirements: ['A'] }, 'B.1': { title: 'b1', requirements: ['B'] } };
d.data[1].ruleMap = { 'img-alt-present': { requirements: [], asks: ['B.1'] }, 'form-control-programmatic-label-present': { requirements: ['B.1'] } }; rollups(d, 'two-level asks B.1');
