// focus-not-removed-by-script (F55): what is caught and what slips.
import { open, scan, show } from './h.mjs';
const R = ['focus-not-removed-by-script'];
const cases = {
  thisBlur: `<a href="#" onfocus="this.blur()">x</a>`,
  bareBlur: `<a href="#" onfocus="blur()">x</a>`,
  condBlur: `<a href="#" onfocus="if (window.x) this.blur()">x</a>`,
  focusElsewhere: `<a href="#" onfocus="document.getElementById('o').focus()">x</a><button id=o>o</button>`,
  bodyFocus: `<input aria-label=a onfocus="document.body.focus()">`,
  bracketBlur: `<a href="#" onfocus="this['blur']()">x</a>`,
  labelPrefix: `<a href="#" onfocus="javascript:this.blur()">x</a>`,
  windowBlur: `<a href="#" onfocus="window.blur()">x</a>`,
  activeElementBlur: `<a href="#" onfocus="document.activeElement.blur()">x</a>`,
  timeoutBlur: `<a href="#" onfocus="setTimeout(() => this.blur())">x</a>`,
  // a function named blurb / myblur: false match?
  blurbFn: `<script>function unblur(){} </script><a href="#" onfocus="unblur()">x</a>`,
  stringBlur: `<a href="#" onfocus="log('blur()')">x</a>`,
  commentBlur: `<a href="#" onfocus="/* no blur() here */ track()">x</a>`,
  onblurAttrOnly: `<a href="#" onblur="this.blur()">x</a>`,
  focusinAttr: `<a href="#" onfocusin="this.blur()">x</a>`,
  nonFocusable: `<div onfocus="this.blur()">x</div>`,
  disabledButton: `<button disabled onfocus="this.blur()">x</button>`,
  tabindexMinus: `<div tabindex=-1 onfocus="this.blur()">x</div>`,
  // listener via hook
  hookListener: `<a id=a href="#">x</a><script>a.addEventListener('focus', e => e.target.blur())</script>`,
  hookProperty: `<a id=a href="#">x</a><script>a.onfocus = function(){ this.blur() }</script>`,
  // body onfocus forwards to window: not about an element
  bodyOnfocus: `<body onfocus="blur()"><a href="#">x</a></body>`
};
const b = await open();
for (const [name, html] of Object.entries(cases)) {
  const r = await scan(b, html, { runOnly: R, hooks: ['listener'] });
  console.log(show(name, r, R).replace(/\n/g, ' |'));
}
await b.close();
