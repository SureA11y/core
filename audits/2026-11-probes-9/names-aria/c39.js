const def=(tag,role)=>`<script>customElements.define("${tag}",class extends HTMLElement{constructor(){super();this._internals=this.attachInternals();this._internals.role="${role}";}})</script>`;
module.exports=[
{name:'ce-list-li', rules:['listitem-parent-valid','list-children-valid','aria-required-children','aria-required-parent'], html:def('x-list','list')+'<x-list id=l><li id=i>a</li><li>b</li></x-list>', ax:['#l','#i']},
{name:'ce-listitem-in-ul', rules:['listitem-parent-valid','list-children-valid','aria-required-parent'], html:def('x-item','listitem')+'<ul id=u><x-item id=i>a</x-item></ul>', ax:['#u','#i']},
{name:'ce-heading-1', rules:['page-has-heading-one','empty-heading','heading-order'], html:'<script>customElements.define("x-h",class extends HTMLElement{constructor(){super();this._internals=this.attachInternals();this._internals.role="heading";this._internals.ariaLevel="1";}})</script><main><x-h id=h>Title</x-h></main>', ax:['#h']},
{name:'ce-img', rules:['role-img-text-alternative-present','img-alt-decorative'], html:'<script>customElements.define("x-icon",class extends HTMLElement{constructor(){super();this._internals=this.attachInternals();this._internals.role="img";}})</script><x-icon id=i>★</x-icon>', ax:['#i']},
{name:'ce-table-row', rules:['aria-required-children','aria-required-parent','td-has-header'], html:def('x-row','row')+def('x-cell','cell')+'<div role=table aria-label=t id=t><x-row id=r><x-cell id=c>1</x-cell></x-row></div>', ax:['#t','#r','#c']},
{name:'ce-tablist', rules:['aria-required-children','aria-required-parent','tab-name-present'], html:def('x-tabs','tablist')+def('x-tab','tab')+'<x-tabs id=t><x-tab id=a tabindex=0>A</x-tab></x-tabs>', ax:['#t','#a']},
];
