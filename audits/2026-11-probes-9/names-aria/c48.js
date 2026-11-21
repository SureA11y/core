const R=['heading-order','page-has-heading-one','empty-heading'];
module.exports=[
{name:'first-h3', rules:R, html:'<main><h3>Start</h3><h4>Sub</h4></main>'},
{name:'shadow-order', rules:R, html:'<main><h1>T</h1><x-c id=c></x-c><h2>After</h2></main><script>customElements.define("x-c",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<h4>In shadow</h4>";}})</script>'},
{name:'slotted-order', rules:R, html:'<main><h1>T</h1><x-s id=c><h2 slot=b>B second</h2><h4 slot=a>A first</h4></x-s></main><script>customElements.define("x-s",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<slot name=a></slot><slot name=b></slot>";}})</script>'},
{name:'hidden-heading-between', rules:R, html:'<main><h1>T</h1><h2 hidden>X</h2><h3>Y</h3></main>'},
{name:'heading-in-dialog-closed', rules:R, html:'<main><h1>T</h1><dialog><h2>Dlg</h2></dialog><h2>Ok</h2></main>'},
{name:'heading-role-none-conflict', rules:R, html:'<main><h1 role=none tabindex=-1>Title</h1></main>'},
];
