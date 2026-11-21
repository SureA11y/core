const { cases, close } = require('./multi');
const R = ['contrast-minimum'];
const g = '#949494'; // ~3.03:1 on white
(async () => {
await cases([
 ['disabled button', `<button disabled style="color:${g};background:#fff">Send</button>`],
 ['aria-disabled button', `<button aria-disabled="true" style="color:${g};background:#fff">Send</button>`],
 ['aria-disabled link', `<a href="#" aria-disabled="true" style="color:${g}">Next page</a>`],
 ['fieldset disabled input value', `<fieldset disabled><input value="Typed value" style="color:${g};background:#fff"></fieldset>`],
 ['label of disabled input', `<label for=i style="color:${g}">Email address</label><input id=i disabled>`],
 ['wrapped label of disabled input', `<label style="color:${g}"><input disabled type=checkbox> Remember me</label>`],
 ['disabled option in listbox', `<select multiple><option disabled style="color:${g}">Unavailable</option><option>OK</option></select>`],
 ['role=button aria-disabled div', `<div role="button" aria-disabled="true" tabindex="-1" style="color:${g}">Send</div>`],
 ['disabled custom element internals', `<x-b>Send</x-b><script>customElements.define('x-b',class extends HTMLElement{static formAssociated=true;constructor(){super();const i=this.attachInternals();i.role='button';i.ariaDisabled='true'}});document.querySelector('x-b').style.color='${g}'</script>`],
 ['inert section', `<section inert><p style="color:${g}">Inert text</p></section>`],
 ['18.66px bold', `<p style="color:${g};font-size:18.66px;font-weight:700">Bold large-ish</p>`],
 ['14pt bold', `<p style="color:${g};font-size:14pt;font-weight:700">Bold 14pt</p>`],
 ['24px normal', `<p style="color:${g};font-size:24px">Large 24px</p>`],
 ['23.9px normal', `<p style="color:${g};font-size:23.9px">Not large</p>`],
 ['18pt via zoom', `<p style="color:${g};font-size:12pt;zoom:1.5">zoomed 18pt</p>`],
 ['var font wght 700 via variation settings', `<p style="color:${g};font-size:19px;font-variation-settings:'wght' 700">variation bold</p>`],
 ['b element default bolder', `<p style="color:${g};font-size:19px"><b>bolder b</b></p>`],
 ['h2 default', `<h2 style="color:${g}">Heading</h2>`],
 ['small-caps', `<p style="color:${g};font-size:24px;font-variant:small-caps">Small caps 24</p>`],
], R);
await close();
})();
