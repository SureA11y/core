// invalid-field-error-message: when does it fail, and is the fail right?
import { open, scan, show } from './h.mjs';
const R = ['invalid-field-error-message'];
const f = (msg, extra = '') => `<label for=i>Email</label><input id=i aria-invalid="true" aria-errormessage="e" ${extra}>${msg}`;
const cases = {
  shownText: f('<p id=e>Enter a valid email</p>'),
  hiddenMsg: f('<p id=e hidden>Enter a valid email</p>'),
  emptyMsg: f('<p id=e></p>'),
  // text from CSS generated content only
  pseudoBefore: `<style>#e::before{content:"Enter a valid email"}</style>` + f('<p id=e></p>'),
  pseudoAttr: `<style>#e::after{content:attr(data-msg)}</style>` + f('<p id=e data-msg="Enter a valid email"></p>'),
  // web-component message whose text is in its shadow root
  shadowText: f('<x-err id=e></x-err>') + `<script>customElements.define('x-err',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<span>Enter a valid email</span>'}})</script>`,
  shadowSlot: f('<x-err2 id=e>Enter a valid email</x-err2>') + `<script>customElements.define('x-err2',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<b>Error: </b><slot></slot>'}})</script>`,
  declShadow: f('<div id=e><template shadowrootmode="open"><span>Enter a valid email</span></template></div>'),
  // text inside the message only visual, aria-hidden
  ariaHiddenText: f('<p id=e><span aria-hidden="true">Enter a valid email</span></p>'),
  // message element itself aria-hidden
  ariaHiddenMsg: f('<p id=e aria-hidden="true">Enter a valid email</p>'),
  // message given by aria-label only: nothing shown
  ariaLabelOnly: f('<p id=e aria-label="Enter a valid email"></p>'),
  // visually hidden via clip
  srOnly: `<style>.sr{position:absolute;clip:rect(0 0 0 0);width:1px;height:1px;overflow:hidden}</style>` + f('<p id=e class=sr>Enter a valid email</p>'),
  opacity0: f('<p id=e style="opacity:0">Enter a valid email</p>'),
  // message is text of an image
  imgAlt: f('<p id=e><img alt="Enter a valid email" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="></p>'),
  svgTitle: f('<p id=e><svg role=img width=10 height=10><title>Enter a valid email</title></svg></p>'),
  // two ids (ARIA 1.3 list): one hidden, one shown
  twoIdsOneShown: `<label for=i>Email</label><input id=i aria-invalid="true" aria-errormessage="e1 e2"><p id=e1 hidden>x</p><p id=e2>Enter a valid email</p>`,
  // describedby pointing at the same hidden message
  describedSameHidden: f('<p id=e hidden>Enter a valid email</p>', 'aria-describedby="e"'),
  // aria-invalid values
  invalidGrammar: `<input aria-label=x aria-invalid="grammar" aria-errormessage="e"><p id=e hidden>x</p>`,
  invalidGarbage: `<input aria-label=x aria-invalid="yes" aria-errormessage="e"><p id=e hidden>x</p>`,
  invalidUpper: `<input aria-label=x aria-invalid="TRUE" aria-errormessage="e"><p id=e hidden>x</p>`,
  invalidFalse: `<input aria-label=x aria-invalid="false" aria-errormessage="e"><p id=e hidden>x</p>`,
  // error inside a closed details next to it
  closedDetails: f('<details><summary>Errors</summary><p id=e>Enter a valid email</p></details>'),
  // readonly / hidden field
  readonlyField: `<input aria-label=x readonly aria-invalid="true" aria-errormessage="e"><p id=e hidden>x</p>`,
  // within a disabled fieldset
  disabledFieldset: `<fieldset disabled><input aria-label=x aria-invalid="true" aria-errormessage="e"></fieldset><p id=e hidden>x</p>`,
  // aria-disabled field
  ariaDisabled: `<input aria-label=x aria-disabled="true" aria-invalid="true" aria-errormessage="e"><p id=e hidden>x</p>`,
  // custom element field with role textbox and the message via element reflection
  reflected: `<input id=i aria-label=x aria-invalid="true"><p id=e>Enter a valid email</p><script>i.ariaErrorMessageElements=[e]</script>`,
  // error summary at the top, inline message hidden: WCAG 3.3.1 met by text?
  summaryAlert: `<div role=alert><p>Email: enter a valid email</p></div>` + f('<p id=e hidden>Enter a valid email</p>'),
  // message in the field's own label
  inLabel: `<label for=i>Email <span>(enter a valid email)</span></label><input id=i aria-invalid="true" aria-errormessage="e"><p id=e style="display:none">Enter a valid email</p>`,
  // message is the element's own content-visibility:auto (offscreen)
  cvAuto: f('<div style="height:3000px"></div><p id=e style="content-visibility:auto">Enter a valid email</p>'),
  // message hidden by visibility on parent but child visible
  visChildVisible: f('<div id=e style="visibility:hidden"><span style="visibility:visible">Enter a valid email</span></div>'),
  // display:contents message
  displayContents: f('<div id=e style="display:contents">Enter a valid email</div>'),
  // message text hidden via font-size 0 / color transparent? (seen as text)
  // non-field: aria-invalid on a form element, a group
  groupInvalid: `<div role=radiogroup aria-label=Plan aria-invalid="true" aria-errormessage="e"><input type=radio aria-label=a></div><p id=e hidden>Pick one</p>`,
  // aria-invalid on a role=none element / generic div
  genericInvalid: `<div aria-invalid="true" aria-errormessage="e">x</div><p id=e hidden>Pick one</p>`
};
const b = await open();
for (const [name, html] of Object.entries(cases)) {
  const r = await scan(b, html, { runOnly: R });
  console.log(show(name, r, R));
}
await b.close();
