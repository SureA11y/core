'use strict';
// A custom element class that overrides one DOM accessor (as a class member, so instances shadow the prototype the
// engine reads through). Which rules error? Is a scan with the element named the same as without? Chromium.
// node ce-getters.js [bundle]
const fs = require('fs');
const C = require('./chrome-lib.js');
const BUNDLE = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : C.BUNDLE;
const members = {
  tagName: `get tagName(){throw new Error('tagName')}`,
  localName: `get localName(){throw new Error('localName')}`,
  attributes: `get attributes(){throw new Error('attributes')}`,
  getAttribute: `getAttribute(){throw new Error('getAttribute')}`,
  hasAttribute: `hasAttribute(){throw new Error('hasAttribute')}`,
  getAttributeNames: `getAttributeNames(){throw new Error('getAttributeNames')}`,
  id: `get id(){throw new Error('id')}`,
  className: `get className(){throw new Error('className')}`,
  shadowRoot: `get shadowRoot(){throw new Error('shadowRoot')}`,
  textContent: `get textContent(){throw new Error('textContent')}`,
  innerText: `get innerText(){throw new Error('innerText')}`,
  childNodes: `get childNodes(){throw new Error('childNodes')}`,
  children: `get children(){throw new Error('children')}`,
  parentNode: `get parentNode(){throw new Error('parentNode')}`,
  parentElement: `get parentElement(){throw new Error('parentElement')}`,
  firstChild: `get firstChild(){throw new Error('firstChild')}`,
  nextSibling: `get nextSibling(){throw new Error('nextSibling')}`,
  getBoundingClientRect: `getBoundingClientRect(){throw new Error('gbcr')}`,
  getClientRects: `getClientRects(){throw new Error('gcr')}`,
  matches: `matches(){throw new Error('matches')}`,
  closest: `closest(){throw new Error('closest')}`,
  querySelectorAll: `querySelectorAll(){throw new Error('qsa')}`,
  getRootNode: `getRootNode(){throw new Error('grn')}`,
  hidden: `get hidden(){throw new Error('hidden')}`,
  tabIndex: `get tabIndex(){throw new Error('tabIndex')}`,
  outerHTML: `get outerHTML(){throw new Error('outerHTML')}`,
  nodeType: `get nodeType(){throw new Error('nodeType')}`,
  ownerDocument: `get ownerDocument(){throw new Error('ownerDocument')}`,
  focus: `focus(){throw new Error('focus')}`,
  checkVisibility: `checkVisibility(){throw new Error('cv')}`,
  role: `get role(){throw new Error('role')}`,
  ariaLabel: `get ariaLabel(){throw new Error('ariaLabel')}`,
  assignedSlot: `get assignedSlot(){throw new Error('assignedSlot')}`,
  style: `get style(){throw new Error('style')}`,
  labels: `get labels(){throw new Error('labels')}`,
  dataset: `get dataset(){throw new Error('dataset')}`,
  contains: `contains(){throw new Error('contains')}`,
  isConnected: `get isConnected(){throw new Error('isConnected')}`,
  namespaceURI: `get namespaceURI(){throw new Error('ns')}`,
  computedStyleMap: `computedStyleMap(){throw new Error('csm')}`
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
