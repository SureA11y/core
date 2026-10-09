'use strict';
// Every fixture page in every shipped locale: look for raw placeholders,
// "undefined"/"NaN"/"[object", empty quotes and stray spaces left by an empty
// parameter, English text in a non-English scan, and keys that resolve to
// nothing. Writes out-03.json with the scans' strings for later probes.
const fs = require('fs');
const path = require('path');
const h = require('./h.js');
const { main } = h.load();
const LOCALES = ['en', 'es', 'fr', 'de', 'ja'];
const en = require(h.ROOT + '/src/i18n/en.json');
const files = fs.readdirSync(path.join(h.ROOT, 'tests/fixtures')).filter((f) => f.endsWith('.html'));
const issues = {};
function flag(kind, detail) {
  (issues[kind] = issues[kind] || new Map());
  const m = issues[kind];
  m.set(detail, (m.get(detail) || 0) + 1);
}
const BAD = [
  [/\{\{|\}\}/, 'raw-placeholder'], [/\bundefined\b/, 'undefined'], [/\bNaN\b/, 'NaN'], [/\[object /, 'object-string'],
  [/(^|[^\\])""|「」|“”|«\s*»|„“/, 'empty-quotes'], [/ {2,}/, 'double-space'], [/ [.,;:)]( |$)/, 'space-before-punct'], [/\(\s*\)/, 'empty-parens'],
  [/\bnull\b/, 'null-word']
];
function check(locale, fixture, where, ruleId, s, key) {
  if (typeof s !== 'string') { flag('non-string', `${locale} ${where} ${ruleId} ${typeof s}`); return; }
  if (!s.trim()) flag('empty', `${locale} ${where} ${ruleId} key=${key}`);
  for (const [re, kind] of BAD) if (re.test(s)) flag(kind, `${locale} ${where} ${ruleId} key=${key} :: ${s.slice(0, 140)}`);
}
const t0 = Date.now();
for (const f of files) {
  const html = fs.readFileSync(path.join(h.ROOT, 'tests/fixtures', f), 'utf8');
  const byLocale = {};
  for (const locale of LOCALES) {
    h.setDom(html);
    const r = h.capture(() => main.runDomRulesInPage('https://example.test/', null, { locale, wcagVersion: '2.1' }, null));
    if (r.error) { flag('scan-error', `${locale} ${f} ${r.error.message}`); continue; }
    byLocale[locale] = r.value;
    for (const c of r.value.checksResults) {
      check(locale, f, 'title', c.ruleId, c.title, c.i18n && c.i18n.titleKey);
      check(locale, f, 'description', c.ruleId, c.description, c.i18n && c.i18n.descriptionKey);
      if (c.i18n && c.i18n.titleKey && !en[c.i18n.titleKey]) flag('key-not-in-en', c.i18n.titleKey);
      for (const o of c.occurrences || []) {
        check(locale, f, 'summary', c.ruleId, o.summary, o.i18n && o.i18n.summaryKey);
        check(locale, f, 'hint', c.ruleId, o.hint, o.i18n && o.i18n.hintKey);
        if (!o.i18n) flag('occurrence-without-i18n', `${c.ruleId} :: ${String(o.summary).slice(0, 80)}`);
        else {
          for (const k of [o.i18n.summaryKey, o.i18n.hintKey]) if (k && !en[k]) flag('key-not-in-en', `${c.ruleId} ${k}`);
        }
        if (o.uncertainty && o.uncertainty.needed) check(locale, f, 'needed', c.ruleId, o.uncertainty.needed, '');
      }
    }
    for (const c of r.value.rulesResults) check(locale, f, 'rollup-title', c.ruleId, c.title, c.i18n && c.i18n.titleKey);
  }
  // English leakage: an occurrence text identical to English in another locale
  // (when the English text has letters).
  if (byLocale.en) {
    for (const locale of LOCALES.slice(1)) {
      const L = byLocale[locale];
      if (!L) continue;
      L.checksResults.forEach((c, i) => {
        const e = byLocale.en.checksResults[i];
        if (!e || e.ruleId !== c.ruleId) { flag('order-differs', `${locale} ${f}`); return; }
        (c.occurrences || []).forEach((o, j) => {
          const eo = e.occurrences[j];
          if (!eo) { flag('occ-count-differs', `${locale} ${f} ${c.ruleId}`); return; }
          for (const fld of ['summary', 'hint']) {
            if (o[fld] && o[fld] === eo[fld] && /[a-z]{4}/i.test(o[fld])) flag('english-leak', `${locale} ${c.ruleId} ${fld} key=${o.i18n && o.i18n[fld + 'Key']} :: ${o[fld].slice(0, 100)}`);
          }
        });
        if (c.outcome !== e.outcome) flag('outcome-differs-by-locale', `${locale} ${f} ${c.ruleId} ${e.outcome}->${c.outcome}`);
      });
    }
  }
}
const out = {};
for (const [k, m] of Object.entries(issues)) out[k] = [...m.entries()].sort((a, b) => b[1] - a[1]).map(([d, n]) => n + 'x ' + d);
fs.writeFileSync(path.join(__dirname, 'out-03.json'), JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out)) console.log(k, v.length);
console.log('ms', Date.now() - t0);
process.exit(0);
