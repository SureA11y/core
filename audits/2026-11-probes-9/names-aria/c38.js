const L=['definition-list-children-valid','dlitem-parent-valid'];
module.exports=[
{name:'dl-mixed', rules:L, html:'<dl id=d><dt>a</dt><div><dd>b</dd></div></dl>'},
{name:'dl-div-dd-only', rules:L, html:'<dl id=d><div><dd>b</dd></div></dl>'},
{name:'dl-div-dt-after-dd', rules:L, html:'<dl id=d><div><dd>b</dd><dt>a</dt></div></dl>'},
{name:'dl-div-role', rules:L, html:'<dl id=d><div role=listitem><dt>a</dt><dd>b</dd></div></dl>'},
{name:'dl-slot', rules:L, html:'<x-dl id=h><dt>a</dt><dd>b</dd></x-dl><script>customElements.define("x-dl",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<dl><slot></slot></dl>";}})</script>'},
{name:'dl-dt-role-none', rules:L, html:'<dl id=d><dt role=none>a</dt><dd>b</dd></dl>'},
{name:'dl-hr', rules:L, html:'<dl id=d><dt>a</dt><dd>b</dd><hr><dt>c</dt><dd>d</dd></dl>'},
{name:'dd-in-div-in-dl-role-presentation', rules:L, html:'<dl role=presentation><div><dt>a</dt><dd>b</dd></div></dl>'},
];
