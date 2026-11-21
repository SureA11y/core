const F=['form-control-programmatic-label-present','textbox-name-present','button-name-present','label-for-valid','binary-control-name-present'];
const def=`<script>
class XIn extends HTMLElement{static formAssociated=true;constructor(){super();this._internals=this.attachInternals();this._internals.role='textbox';}}
customElements.define('x-in',XIn);
class XBtn extends HTMLElement{constructor(){super();this.internals=this.attachInternals();this.internals.role='button';}}
customElements.define('x-btn',XBtn);
class XCb extends HTMLElement{static formAssociated=true;constructor(){super();this.internals_=this.attachInternals();this.internals_.role='checkbox';this.internals_.ariaChecked='false';}}
customElements.define('x-cb',XCb);
</script>`;
module.exports=[
{name:'ce-label-for', rules:F, html:def+'<label for=a>Email</label><x-in id=a tabindex=0></x-in>', ax:['#a']},
{name:'ce-label-wrap', rules:F, html:def+'<label>Email <x-in id=a tabindex=0></x-in></label>', ax:['#a']},
{name:'ce-unlabelled', rules:F, html:def+'<x-in id=a tabindex=0></x-in>', ax:['#a']},
{name:'ce-btn-content', rules:F, html:def+'<x-btn id=a tabindex=0>Save</x-btn><x-btn id=b tabindex=0></x-btn>', ax:['#a','#b']},
{name:'ce-cb-label', rules:F, html:def+'<label>Agree <x-cb id=a tabindex=0></x-cb></label><x-cb id=b tabindex=0></x-cb>', ax:['#a','#b']},
];
