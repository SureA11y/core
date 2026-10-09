'use strict';
// An element whose id another element also has: its occurrence selector is
// "#id", which resolves to the first one, while structuralPath points at the
// one reported (OUTPUT_SCHEMA.md: the selector is verified to resolve to the
// reported element).
const h = require('./h.js');
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p id="dup">first</p><img id="dup" src="a.png"></main></body></html>';
for (const entry of ['runDomRulesInPage', 'runa11yCoreInPage']) {
  const r = h.scan(html, { runOnly: ['img-alt-present', 'duplicate-id'], entry });
  for (const c of r.value.checksResults) {
    for (const o of c.occurrences) {
      const bySel = document.querySelector(o.selector);
      let byPath = document.documentElement; for (const i of o.structuralPath || []) byPath = byPath.children[i];
      console.log(entry, c.ruleId, c.outcome, 'selector', o.selector, '->', bySel && bySel.outerHTML, '| structuralPath ->', byPath && byPath.outerHTML, '| html', o.html);
    }
  }
}
process.exit(0);
