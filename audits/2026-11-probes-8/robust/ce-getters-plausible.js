'use strict';
// Plausible, non-throwing overrides: a custom element class whose members reuse DOM names for its own data.
// A custom element class that overrides one DOM accessor (as a class member, so instances shadow the prototype the
// engine reads through). Which rules error? Is a scan with the element named the same as without? Chromium.
// node ce-getters.js [bundle]
const fs = require('fs');
const C = require('./chrome-lib.js');
const BUNDLE = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : C.BUNDLE;
const members = {
  attributesConfig: `get attributes(){return {variant:'primary'}}`,
  childrenData: `get children(){return [{label:'a'},{label:'b'}]}`,
  childNodesEmpty: `get childNodes(){return []}`,
  parentNodeLogical: `get parentNode(){return null}`,
  hiddenProp: `get hidden(){return false}`,
  localNameUpper: `get localName(){return 'X-BAD'}`,
  textContentProp: `get textContent(){return ''}`,
  getAttributeProps: `getAttribute(n){return n==='role'?null:HTMLElement.prototype.getAttribute.call(this,n)}`,
  focusNoop: `focus(){}`,
  matchesStub: `matches(){return false}`
};
const body = `<main><h1>T</h1><x-bad role="button" tabindex="0" aria-label="Go" id="b1" class="c">Go</x-bad>
<label for="b1">L</label><x-bad>text</x-bad><x-bad role="img"></x-bad><p><x-bad role="link" tabindex="0">l</x-bad></p>
<ul><x-bad role="listitem">i</x-bad></ul><span aria-labelledby="b1">x</span></main>`;
(async () => {
  const b = await C.launch();
  async function run(member) {
    const p = await b.newPage();
    await p.setContent(`<!DOCTYPE html><html lang="en"><head><title>T</title></head><body>${body}<script>customElements.define('x-bad',class extends HTMLElement{${member || ''}})</script></body></html>`);
    await p.evaluate(BUNDLE);
    const r = await p.evaluate(() => {
      try {
        const r = window.a11ycore.runa11yCoreInPage(null, null, {}, null);
        return { rules: r.checksResults.map((c) => [c.ruleId, c.outcome + '/' + c.occurrences.length, c.error ? String(c.error).slice(0, 60) : ''] ) };
      } catch (e) { return { thrown: String(e.message).slice(0, 150) }; }
    });
    await p.close();
    return r;
  }
  const clean = await run('');
  const base = new Map(clean.rules.map((x) => [x[0], x[1]]));
  let totalErr = 0;
  for (const [name, m] of Object.entries(members)) {
    const r = await run(m);
    if (r.thrown) { console.log(name, 'THROWN', r.thrown); continue; }
    const errs = r.rules.filter((x) => x[2]);
    const diffs = r.rules.filter((x) => !x[2] && base.get(x[0]) !== x[1]);
    totalErr += errs.length;
    if (errs.length || diffs.length) console.log(JSON.stringify({ member: name, errors: errs.map((x) => x[0] + ': ' + x[2]), changed: diffs.map((x) => x[0] + ' ' + base.get(x[0]) + '->' + x[1]).slice(0, 6) }));
  }
  console.log('members', Object.keys(members).length, 'rule errors total', totalErr);
  await b.close();
})();
