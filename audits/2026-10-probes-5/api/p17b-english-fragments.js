// English fragments inside translated messages (params filled with English text).
'use strict';
const fs = require('fs');
const S = process.env.AUDIT_SCRATCH || '/tmp/surea11y-audit';
const seen = new Map();
for (const f of fs.readdirSync(S).filter((f) => /\.(de|es|fr|ja)\.json$/.test(f))) {
  const l = f.split('.').slice(-2)[0];
  const r = JSON.parse(fs.readFileSync(S + f));
  const all = [];
  for (const c of r.checksResults) { all.push([c.ruleId, 'title', c.title], [c.ruleId, 'desc', c.description]); for (const o of c.occurrences || []) all.push([c.ruleId, 'summary', o.summary], [c.ruleId, 'hint', o.hint]); }
  for (const rr of r.rulesResults || []) all.push([rr.ruleId, 'rollup', rr.title], [rr.ruleId, 'rollupDesc', rr.description]);
  for (const [rule, what, t] of all) {
    if (!t) continue;
    const m = String(t).replace(/"[^"]*"|“[^”]*”|«[^»]*»|„[^“]*“|「[^」]*」|<[^>]*>/g, '').match(/\b(the|this|which|with|that|and|or|its|is|are|has|not|an|of|to|be)\b(\s+\w+){2,}/i);
    if (m && (l === 'ja' || /\b(the|this|which|that|its)\b/i.test(m[0]))) {
      const k = l + ' ' + rule + ' ' + what + ' :: ' + m[0].slice(0, 60);
      if (!seen.has(k)) seen.set(k, String(t).slice(0, 160));
    }
  }
}
for (const [k, v] of seen) console.log(k, '\n     ', v);
console.log(seen.size);
