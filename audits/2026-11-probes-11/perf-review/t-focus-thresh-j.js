const h=require('./h.js');
const css=`/* c */ a:focus{outline:none} /* x */
.card{ & button:focus{outline:0} }
@scope (.sc) { button:focus { outline: none } :scope > a:focus{outline:none} }
:is(.w, .v) :where(a):focus{outline:none}
div:has(> .z) a:focus{outline:none}
a[title="x)"]:focus{outline:none}
a[title='(']:focus{outline:none}

a:focus::before{outline:none}
a:unknownpseudo:focus{outline:none}
x-c:focus{outline:none}
:host-context(.q) a:focus{outline:none}
button:focus-visible{outline:none}
@media screen { .m a:focus{outline:none} }
@layer base { .l button:focus{outline:none} }
@supports (display:grid) { .s a:focus{outline:none} }
`;
const mk=(n)=>{let s='';for(let i=0;i<n;i++)s+=`<div class="card sc w ${i%2?'z':''} m l s"><a href="#${i}" title="${i%3?'x)':'('}" class="z">L${i}</a><button type="button">B${i}</button></div>`;return s;};
const cases=[];for(const n of [3,4,5,7,8,9])for(const extra of [0,1]){cases.push({name:"thresh"+n+"+"+extra,rules:['css-focus-indicator-suppressed'],html:`<!doctype html><html lang="en"><head><title>t</title><style>${css}</style></head><body><main>${mk(n)}${extra?"<p><a href=\"#q\">q</a></p>":""}</main></body></html>`});}
h.run4(cases,{verbose:true,modes:['jsdom']});
