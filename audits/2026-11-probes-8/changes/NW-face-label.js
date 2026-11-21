// <label> on custom elements: form-associated (labelable per HTML) vs not form-associated (not labelable), and an undefined one.
// Compare the engine (Chromium bundle) with Chromium's AX tree name.
const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const BUNDLE = fs.readFileSync('/home/user/core-r8/surea11y.browser.js', 'utf8');
const defs = `<script>
customElements.define('x-face', class extends HTMLElement { static formAssociated = true; constructor(){ super(); const i = this.attachInternals(); i.role = 'checkbox'; i.ariaChecked = 'false'; this.tabIndex = 0; } });
customElements.define('x-plain', class extends HTMLElement { constructor(){ super(); const i = this.attachInternals(); i.role = 'checkbox'; i.ariaChecked = 'false'; this.tabIndex = 0; } });
</script>`;
const cases = {
  faceFor: '<label for="c">Subscribe</label><x-face id="c"></x-face>',
  faceWrap: '<label>Subscribe <x-face></x-face></label>',
  plainFor: '<label for="c">Subscribe</label><x-plain id="c"></x-plain>',
  plainWrap: '<label>Subscribe <x-plain></x-plain></label>',
  faceRoleFor: '<label for="c">Subscribe</label><x-face id="c" role="checkbox" aria-checked="false"></x-face>',
  faceRoleWrap: '<label>Subscribe <x-face role="checkbox" aria-checked="false"></x-face></label>',
  definedNotFaceRoleFor: '<label for="c">Subscribe</label><x-plain id="c" role="checkbox" aria-checked="false"></x-plain>',
  definedNotFaceRoleWrap: '<label>Subscribe <x-plain role="checkbox" aria-checked="false"></x-plain></label>',
  plainRoleFor: '<label for="c">Subscribe</label><x-undef id="c" role="checkbox" aria-checked="false" tabindex="0"></x-undef>',
  plainRoleWrap: '<label>Subscribe <x-undef role="checkbox" aria-checked="false" tabindex="0"></x-undef></label>',
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [k, body] of Object.entries(cases)) {
    const page = await b.newPage();
    await page.setContent('<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1>' + body + '</main></body></html>');
    await page.addScriptTag({ content: defs.replace(/<\/?script>/g, '') });
    const ctor = await page.evaluate(() => [...document.querySelectorAll('main *')].map(e => e.localName + ':' + e.constructor.name).join(' '));
    const cdp = await page.context().newCDPSession(page);
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const ax = nodes.filter(n => n.role && n.role.value === 'checkbox').map(n => JSON.stringify(n.name && n.name.value));
    await page.addScriptTag({ content: BUNDLE });
    const r = await page.evaluate(async () => (await window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: ['binary-control-name-present'] } }, null)).checksResults.map(c => c.outcome + ' ' + (c.occurrences || []).map(o => o.data && o.data.details && o.data.details.reasonCode).join(',')));
    console.log(k.padEnd(24), 'Chromium name', ax.join(',').padEnd(14), 'engine', r.join(' '));
    await page.close();
  }
  await b.close();
})();
