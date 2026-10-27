// The new rules' message keys in all five locales: missing keys, placeholder mismatches, English left in.
'use strict';
const L = {}; for (const l of ['en', 'de', 'es', 'fr', 'ja']) L[l] = require('/home/user/core/src/i18n/' + l + '.json');
const same = require('/home/user/core/src/i18n-same-as-english.json');
const sameSet = new Set(Array.isArray(same) ? same : Object.keys(same.keys || same).concat(...Object.values(same).filter(Array.isArray)));
const prefixes = ['ariaOwnsValid', 'labelForValid', 'widgetKeyboardFocusable', 'ariaExpandedStateMismatch', 'invalidFieldErrorMessage', 'focusNotRemovedByScript', 'clickHandlerKeyboardOperable', 'controlNameTitleOnly', 'liveRegionAnnouncements', 'movingContentPausable', 'ariaValidAttrValue', 'report_'];
const keys = Object.keys(L.en).filter((k) => prefixes.some((p) => k.toLowerCase().startsWith(p.toLowerCase())));
console.log('keys checked', keys.length);
const ph = (s) => (String(s).match(/\{\{\s*\w+\s*\}\}/g) || []).map((x) => x.replace(/\s/g, '')).sort().join(',');
let probs = 0;
for (const k of keys) for (const l of ['de', 'es', 'fr', 'ja']) {
  const v = L[l][k];
  if (v == null) { console.log('MISSING', l, k); probs++; continue; }
  if (ph(v) !== ph(L.en[k])) { console.log('PLACEHOLDERS', l, k, ph(L.en[k]), '->', ph(v)); probs++; }
  if (v === L.en[k] && v.length > 12 && !sameSet.has(k) && !JSON.stringify(same).includes(k)) { console.log('SAME-AS-EN', l, k, JSON.stringify(v).slice(0, 80)); probs++; }
  if (/\{\s*\w+\s*\}(?!\})/.test(v.replace(/\{\{\s*\w+\s*\}\}/g, ''))) { console.log('SINGLE-BRACE', l, k, v.slice(0, 80)); probs++; }
}
console.log('problems', probs);
console.log('same-as-english shape', Array.isArray(same) ? 'array' : Object.keys(same).slice(0, 5));
