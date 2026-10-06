const fs = require('fs');
const dir = '/home/user/core/src/i18n/';
const en = JSON.parse(fs.readFileSync(dir + 'en.json', 'utf8'));
const ph = (s) => [...new Set((String(s).match(/\{\{\s*[^}]*\}\}/g) || []))].sort().join(',');
for (const loc of ['de', 'es', 'fr', 'ja']) {
  const d = JSON.parse(fs.readFileSync(dir + loc + '.json', 'utf8'));
  const missing = Object.keys(en).filter((k) => !(k in d));
  const extra = Object.keys(d).filter((k) => !(k in en));
  console.log(loc, 'missing', missing.length, missing.slice(0, 10), 'extra', extra.slice(0, 10));
  for (const k of Object.keys(en)) {
    if (!(k in d)) continue;
    if (typeof d[k] !== 'string') { console.log(loc, k, 'non-string'); continue; }
    if (ph(en[k]) !== ph(d[k])) console.log(loc, k, '| en:', ph(en[k]), '| loc:', ph(d[k]));
    if (/\{[^{]*\}/.test(d[k].replace(/\{\{[^}]*\}\}/g, '')) ) console.log(loc, k, 'odd brace', d[k]);
  }
}
// en internal: odd placeholders
for (const k of Object.keys(en)) { const s = en[k]; if (typeof s!=='string') {console.log('en nonstring',k); continue;} if (/\{\{[^}]*\s[^}]*\}\}|\{[^{}]*\}\}|\{\{[^{}]*\}(?!\})/.test(s)) console.log('en odd', k, s); }
