// jsdom: <label> on a form-associated custom element with role=checkbox, vs a defined non-form-associated one
const { createDom, runa11yCoreOnDom } = require('/home/user/core-r8/src/testing.js');
for (const [k, body] of [['faceFor', '<label for="c">Subscribe</label><x-face id="c" role="checkbox" aria-checked="false" tabindex="0"></x-face>'], ['plainFor', '<label for="c">Subscribe</label><x-plain id="c" role="checkbox" aria-checked="false" tabindex="0"></x-plain>'], ['faceWrap', '<label>Subscribe <x-face role="checkbox" aria-checked="false" tabindex="0"></x-face></label>'], ['plainWrap', '<label>Subscribe <x-plain role="checkbox" aria-checked="false" tabindex="0"></x-plain></label>']]) {
  const dom = createDom('<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1>' + body + '</main></body></html>', { runScripts: 'outside-only' });
  dom.window.eval(`customElements.define('x-face', class extends HTMLElement { static get formAssociated() { return true; } });customElements.define('x-plain', class extends HTMLElement {});`);
  const r = runa11yCoreOnDom(dom, { runOnly: ['binary-control-name-present'] });
  const c = r.checksResults[0];
  console.log(k.padEnd(10), c.outcome, c.occurrences.map(o => o.data.details.reasonCode).join(','));
}
