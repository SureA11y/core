const core = require('/home/user/core/src/index.js');
const L = ['en', 'de', 'es', 'fr', 'ja'];
const dicts = Object.fromEntries(L.map(l => [l, require('/home/user/core/src/i18n/review/' + l + '.json')]));
const ph = (s) => (String(s).match(/\{\{[^}]*\}\}/g) || []).map(x => x.replace(/\|.*\}\}/, '}}')).sort().join(',');
const probs = [];
for (const l of L.slice(1)) {
  const d = dicts[l];
  for (const k of Object.keys(dicts.en)) {
    if (!(k in d)) { probs.push(l + ' missing ' + k); continue; }
    const a = dicts.en[k], b = d[k];
    if (Array.isArray(a) !== Array.isArray(b)) probs.push(l + ' type ' + k);
    if (ph(a) !== ph(b)) probs.push(l + ' placeholders ' + k + ' en=' + ph(a) + ' ' + l + '=' + ph(b));
    if (String(b).trim() === '') probs.push(l + ' empty ' + k);
  }
  for (const k of Object.keys(d)) if (!(k in dicts.en)) probs.push(l + ' orphan ' + k);
}
// steps count per entry consistent
const groups = {};
for (const l of L) for (const k of Object.keys(dicts[l])) { const m = k.match(/^(.*)_step(\d+)$/); if (m) { groups[l + '|' + m[1]] = Math.max(groups[l + '|' + m[1]] || 0, +m[2]); } }
for (const [k, n] of Object.entries(groups)) { const [l, e] = k.split('|'); if (l !== 'en' && groups['en|' + e] !== n) probs.push(l + ' step count ' + e + ' ' + n + ' vs en ' + groups['en|' + e]); }
console.log('review dict problems', probs.length, probs.slice(0, 15));
// howToCheckFor for each rule/code in each locale: unfilled placeholder output
let bad = 0, total = 0; const cat = core.getChecksCatalog({ optInRules: true }); const keyOf = {}; for (const c of cat) { const pre = Object.keys(dicts.en).find(k => k.startsWith(c.ruleId.replace(/-([a-z0-9])/g, (_, x) => x.toUpperCase()) + '_review_')); keyOf[c.ruleId.replace(/-([a-z0-9])/g, (_, x) => x.toUpperCase())] = c.ruleId; if (c.i18n && c.i18n.titleKey) keyOf[c.i18n.titleKey.replace(/_title$/, '')] = c.ruleId; }
for (const k of Object.keys(dicts.en)) {
  const m = k.match(/^(.+?)_review_([A-Za-z0-9_]+)_step1$/); if (!m) continue;
  const ruleId = keyOf[m[1]] || m[1];
  for (const l of L) {
    const h = core.howToCheckFor(ruleId, m[2], l); total++;
    if (!h) { bad++; if (bad < 6) console.log('null', ruleId, m[2], l); continue; }
    const s = JSON.stringify(h);
    if (/\{\{|\}\}|undefined/.test(s)) { bad++; if (bad < 10) console.log('unfilled', ruleId, m[2], l, s.slice(0, 200)); }
  }
}
console.log('howToCheckFor checked', total, 'bad', bad);
