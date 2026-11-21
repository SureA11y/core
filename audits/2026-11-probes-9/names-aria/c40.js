const R=['iframe-focusable-content','presentation-role-conflict','aria-hidden-focus'];
module.exports=[
{name:'iframe-neg-tab-link', rules:R, html:'<iframe tabindex=-1 title=t srcdoc="<a href=/x>link</a>"></iframe>'},
{name:'iframe-neg-tab-text', rules:R, html:'<iframe tabindex=-1 title=t srcdoc="<p>text</p>"></iframe>'},
{name:'presentation-focusable', rules:R, html:'<h2 role=presentation tabindex=0>x</h2><img role=none src=x.png alt="" aria-describedby=d><span id=d>d</span><nav role=none aria-label="Main">x</nav>'},
{name:'ah-slot-light-focusable', rules:R, html:'<x-ah id=h><a href="/">slotted link</a></x-ah><script>customElements.define("x-ah",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<div aria-hidden=true><slot></slot></div>";}})</script>'},
{name:'ah-host-shadow-focusable', rules:R, html:'<x-b id=h aria-hidden=true></x-b><script>customElements.define("x-b",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<button>In shadow</button>";}})</script>'},
{name:'ah-delegates-focus', rules:R, html:'<div aria-hidden=true><x-df id=h></x-df></div><script>customElements.define("x-df",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open",delegatesFocus:true}).innerHTML="<input aria-label=q>";}})</script>'},
];
