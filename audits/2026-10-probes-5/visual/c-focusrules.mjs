const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{margin:0} ${css}</style></head><body>${body}<main id=main><p>Hello</p></main></body></html>`;
const R = ['css-hidden-focus'];
const sk = '<a class=skip href=#main>Skip</a>';
export default [
  { name: 'R1 :focus-visible', html: H('.skip{position:absolute;top:-40px} .skip:focus-visible{top:0}', sk), rules: R },
  { name: 'R2 :is(:focus)', html: H('.skip{position:absolute;top:-40px} .skip:is(:focus,:active){top:0}', sk), rules: R },
  { name: 'R3 :where(.skip:focus)', html: H('.skip{position:absolute;top:-40px} :where(.skip:focus){top:0}', sk), rules: R },
  { name: 'R4 CSS nesting &:focus', html: H('.skip{position:absolute;top:-40px; &:focus{top:0}}', sk), rules: R },
  { name: 'R5 @media screen focus', html: H('.skip{position:absolute;top:-40px} @media screen{.skip:focus{top:0}}', sk), rules: R },
  { name: 'R6 @layer focus', html: H('@layer a{.skip{position:absolute;top:-40px}} @layer b{.skip:focus{top:0}}', sk), rules: R },
  { name: 'R7 container :has(:focus) slides menu', html: H('nav{position:fixed;top:0;left:0;transform:translateX(-100%)} body:has(nav a:focus) nav{transform:none}', '<nav aria-label=m><a href=/a>A</a></nav>'), rules: R },
  { name: 'R8 focus rule specificity loses (still hidden)', html: H('.skip:focus{top:0} body .skip{position:absolute;top:-40px}', sk), rules: R },
  { name: 'R9 focus rule sets clip none but left still off', html: H('.skip{position:absolute;left:-9999px;clip:rect(0 0 0 0)} .skip:focus{clip:auto}', sk), rules: R },
  { name: 'R10 :focus with !important on hidden rule', html: H('.skip{position:absolute!important;top:-40px!important} .skip:focus{top:0}', sk), rules: R },
];
