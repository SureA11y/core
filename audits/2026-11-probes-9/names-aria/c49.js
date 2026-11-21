module.exports=[
{name:'slotted-reorder', rules:['heading-order'], html:'<main><h1>Title</h1><x-card id=c><h2 slot=body>Details</h2><h3 slot=head>Card heading</h3></x-card></main><script>customElements.define("x-card",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<slot name=head></slot><slot name=body></slot>";}})</script>'},
];
