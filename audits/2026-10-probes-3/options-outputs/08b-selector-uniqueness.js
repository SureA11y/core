'use strict';
// The selector builder counts ids (and data-testid, name, aria-label) only
// among the elements queryAllSmart returns: hidden ones, excluded ones and
// ones outside the scope don't count, so "#id" is used although
// document.querySelector("#id") returns another element.
const h = require('./h.js');
const cases = [
  ['duplicate hidden', '<main><p id="a" hidden>x</p><img id="a" src="a.png"></main>', {}, null],
  ['duplicate excluded', '<div class="ad"><span id="a">x</span></div><main><img id="a" src="a.png"></main>', { excludeSelectors: '.ad' }, null],
  ['duplicate outside scope', '<p id="a">x</p><main><img id="a" src="a.png"></main>', {}, 'main'],
  ['data-testid hidden', '<main><p data-testid="t" style="display:none">x</p><img data-testid="t" src="a.png"></main>', {}, null],
  ['aria-label outside scope', '<nav><button aria-label="Go">x</button></nav><main><button aria-label="Go" aria-pressed="banana">y</button></main>', {}, 'main']
];
for (const [name, body, eo, ctx] of cases) {
  const r = h.scan(`<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`, { engineOptions: eo, contextSelector: ctx, runOnly: ['img-alt-present', 'aria-valid-attr-value'] });
  for (const c of r.value.checksResults) for (const o of c.occurrences) {
    const got = document.querySelector(o.selector);
    const ok = got && got.outerHTML === o.html;
    console.log(name.padEnd(26), c.ruleId.padEnd(22), 'selector', JSON.stringify(o.selector).padEnd(22), ok ? 'resolves to the reported element' : 'RESOLVES TO ' + (got ? got.outerHTML : 'nothing'));
  }
}
process.exit(0);
