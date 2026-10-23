// Name from content across shadow roots (9bbfd91c): engine outcome for
// button-name-present / link-name-present vs Chrome's accessibility tree
// (CDP Accessibility.getPartialAXTree) for each case's #t element.
const h = require('./harness');
const fs = require('fs'), path = require('path');
const DEF = `<script>
function def(name, html, mode){ customElements.define(name, class extends HTMLElement{ constructor(){ super(); const r=this.attachShadow({mode: mode||'open'}); r.innerHTML=html; } }) }
def('x-icon','<img alt="Save">'); def('x-icon-closed','<img alt="Save">','closed');
def('x-slot','<slot></slot>'); def('x-named','<slot name="n"></slot>');
def('x-fallback','<slot>Fallback name</slot>'); def('x-hidden','<span hidden>Secret</span>');
def('x-ariahidden','<span aria-hidden="true">Secret</span><span>Shown</span>');
def('x-svg','<svg aria-label="Close" role="img"></svg>'); def('x-svgtitle','<svg><title>Menu</title></svg>');
def('x-nested','<x-icon></x-icon>'); def('x-wrapslot','<x-slot><slot></slot></x-slot>');
def('x-labelled','<span aria-label="Inner label">ignored text</span>');
def('x-displaynone','<style>:host{display:none}</style>Gone');
def('x-hostcontents','<style>:host{display:contents}</style><b>Contents</b>');
def('x-textarea','<input value="typed">');
def('x-pres','<img alt="Pres" role="presentation">');
def('x-manual',''); 
def('x-delegates','<button>Inner</button>');
</script>`;
const CASES = {
  descendantHost: '<button id="t"><x-icon></x-icon></button>',
  closedShadowIcon: '<button id="t"><x-icon-closed></x-icon-closed></button>',
  slottedText: '<button id="t"><x-slot>Slotted</x-slot></button>',
  unslottedLight: '<button id="t"><x-icon>Light text not slotted</x-icon></button>',
  namedSlotMatch: '<button id="t"><x-named><span slot="n">Named</span></x-named></button>',
  namedSlotNoMatch: '<button id="t"><x-named><span slot="m">Wrong slot</span></x-named></button>',
  fallbackUsed: '<button id="t"><x-fallback></x-fallback></button>',
  fallbackWhitespaceAssigned: '<button id="t"><x-fallback> </x-fallback></button>',
  fallbackCommentOnly: '<button id="t"><x-fallback><!-- c --></x-fallback></button>',
  shadowHidden: '<button id="t"><x-hidden></x-hidden></button>',
  shadowAriaHidden: '<button id="t"><x-ariahidden></x-ariahidden></button>',
  shadowSvgLabel: '<button id="t"><x-svg></x-svg></button>',
  shadowSvgTitle: '<button id="t"><x-svgtitle></x-svgtitle></button>',
  nestedHosts: '<button id="t"><x-nested></x-nested></button>',
  reslotted: '<button id="t"><x-wrapslot>Twice slotted</x-wrapslot></button>',
  innerAriaLabel: '<button id="t"><x-labelled></x-labelled></button>',
  hostDisplayNone: '<button id="t"><x-displaynone></x-displaynone></button>',
  hostDisplayContents: '<button id="t"><x-hostcontents></x-hostcontents></button>',
  embeddedInputInShadow: '<button id="t"><x-textarea></x-textarea></button>',
  presImgInShadow: '<button id="t"><x-pres></x-pres></button>',
  buttonIsHost: '<x-slot id="t" role="button" tabindex="0">Host text</x-slot>',
  linkHostIcon: '<a id="t" href="#"><x-icon></x-icon></a>',
  linkClosed: '<a id="t" href="#"><x-icon-closed></x-icon-closed></a>',
  dsdOpen: '<button id="t"><span><template shadowrootmode="open"><img alt="DSD"></template></span></button>',
  dsdClosed: '<button id="t"><span><template shadowrootmode="closed"><img alt="DSD closed"></template></span></button>',
  dsdSlotFallback: '<button id="t"><span><template shadowrootmode="open"><slot>FB</slot></template></span></button>',
  manualSlot: '<button id="t"><x-man><b id="m1">Manual</b></x-man></button><script>customElements.define("x-man",class extends HTMLElement{constructor(){super();const r=this.attachShadow({mode:"open",slotAssignment:"manual"});const s=document.createElement("slot");r.append(s);queueMicrotask(()=>s.assign(this.querySelector("#m1")))}})</script>',
  manualSlotUnassigned: '<button id="t"><x-man2><b>Not assigned</b></x-man2></button><script>customElements.define("x-man2",class extends HTMLElement{constructor(){super();const r=this.attachShadow({mode:"open",slotAssignment:"manual"});r.append(document.createElement("slot"))}})</script>',
  delegatesFocusHostButton: '<x-delegates id="t" role="button" tabindex="0"></x-delegates>',
  slotInsideButtonInShadow: '<x-btn id="h">Slotted btn text</x-btn><script>customElements.define("x-btn",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<button id=t><slot></slot></button>"}})</script>',
  slotInsideButtonEmpty: '<x-btn2 id="h"></x-btn2><script>customElements.define("x-btn2",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<button id=t><slot></slot></button>"}})</script>',
  slotFallbackInsideButton: '<x-btn3 id="h"></x-btn3><script>customElements.define("x-btn3",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<button id=t><slot>Fallback in btn</slot></button>"}})</script>',
  slotIsTarget: '<x-sl></x-sl><script>customElements.define("x-sl",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<slot id=t role=button tabindex=0>FB slot</slot>"}})</script>',
};
(async () => {
  const b = await h.browser();
  const rows = [];
  for (const [name, body] of Object.entries(CASES)) {
    const html = `<!doctype html><html lang="en"><head><title>t</title>${DEF}</head><body><main><h1>H</h1>${body}</main></body></html>`;
    const ctx = await b.newContext(); const page = await ctx.newPage();
    const f = path.join(__dirname, 'tmp', 'sn.html'); fs.writeFileSync(f, html);
    await page.goto('file://' + f); await page.waitForTimeout(50);
    const cdp = await ctx.newCDPSession(page);
    // Chrome's name: find #t in document or in an open shadow root
    const { result } = await cdp.send('Runtime.evaluate', { expression: `(function(){let t=document.getElementById('t');if(!t){for(const e of document.querySelectorAll('*')){if(e.shadowRoot&&e.shadowRoot.getElementById('t')){t=e.shadowRoot.getElementById('t');break}}}return t})()` });
    let chromeName = '?', chromeRole = '?';
    if (result.objectId) {
      await cdp.send('Accessibility.enable');
      const ax = await cdp.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false });
      const n = ax.nodes[0];
      chromeName = n && n.name ? n.name.value : '(none)'; chromeRole = n && n.role ? n.role.value : '?';
    }
    await h.cdpEval(cdp, fs.readFileSync(h.BUNDLE, 'utf8') + ';void 0', 60000);
    const r = await h.cdpEval(cdp, 'a11ycore.runa11yCoreInPage(location.href,null,{},null)', 60000);
    const pick = (id) => { const c = r.checksResults.find((x) => x.ruleId === id); return c.outcome + '#' + c.occurrences.length; };
    rows.push({ name, chromeRole, chromeName, button: pick('button-name-present'), link: pick('link-name-present'), aria: pick(r.checksResults.find((x)=>x.ruleId==='aria-command-name')?'aria-command-name':'button-name-present') });
    await ctx.close();
  }
  for (const r of rows) console.log(JSON.stringify(r));
  await h.closeBrowser();
})();
