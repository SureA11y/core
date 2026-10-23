// The new rules' messages as scanned in five locales: unfilled placeholders, keys shown, English left in.
'use strict';
const fs = require('fs');
const S = process.env.AUDIT_SCRATCH || '/tmp/surea11y-audit';
const ids = ['aria-owns-valid', 'label-for-valid', 'widget-keyboard-focusable', 'aria-expanded-state-mismatch', 'invalid-field-error-message', 'focus-not-removed-by-script', 'click-handler-keyboard-operable', 'control-name-title-only', 'live-region-announcements', 'moving-content-pausable', 'hostile'];
let problems = 0, checked = 0;
for (const id of ids) {
  const en = JSON.parse(fs.readFileSync(S + id + '.en.json'));
  for (const l of ['de', 'es', 'fr', 'ja']) {
    const r = JSON.parse(fs.readFileSync(S + id + '.' + l + '.json'));
    for (const c of r.checksResults) {
      const ce = en.checksResults.find((x) => x.ruleId === c.ruleId);
      const texts = [['title', c.title, ce.title], ['description', c.description, ce.description]];
      (c.occurrences || []).forEach((o, i) => { const oe = (ce.occurrences || [])[i] || {}; texts.push(['summary', o.summary, oe.summary], ['hint', o.hint, oe.hint]); });
      for (const [what, t, te] of texts) {
        if (t == null) continue; checked++;
        if (/\{\{|\}\}/.test(t)) { problems++; console.log('PLACEHOLDER', l, c.ruleId, what, t.slice(0, 120)); }
        if (/^[a-z]+[A-Z]\w*_\w+$/.test(t)) { problems++; console.log('KEY SHOWN', l, c.ruleId, what, t); }
        if (te && t === te && t.length > 25 && /[a-z]{4} [a-z]{3}/.test(t)) { problems++; console.log('ENGLISH', l, c.ruleId, what, t.slice(0, 100)); }
      }
    }
  }
}
console.log('texts checked', checked, 'problems', problems);
