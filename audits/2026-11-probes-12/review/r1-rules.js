const {run4,setMsg}=require('./rh.js');setMsg(140);
const W=(b,head='',title='t',dt='<!doctype html>')=>`${dt}<html lang=en><head><title>${title}</title>${head}</head><body><main><h1>h</h1>${b}</main></body></html>`;
const CFI=['css-focus-indicator-suppressed'];
const shadow=(id,inner)=>`<div id=${id}></div><script>document.getElementById('${id}').attachShadow({mode:'open'}).innerHTML=${JSON.stringify(inner)};</script>`;
const cases=[
 ['C1 shadow sheet suppresses own button',CFI,W(shadow('h1x','<style>button:focus{outline:none}</style><button>Go</button>'))],
 ['C2 document sheet, button only in shadow root (does not apply)',CFI,W(shadow('h2x','<button>Go</button>'),'<style>button:focus{outline:none}</style>')],
 ['C2b document sheet, button in light + shadow',CFI,W('<button>Light</button>'+shadow('h2y','<button>Shadow</button>'),'<style>button:focus{outline:none}</style>')],
 ['C3 :focus-within on parent suppresses child',CFI,W('<div class=f><a href=#>x</a></div>','<style>.f:focus-within a{outline:none}</style>')],
 ['C4 :has(:focus) on parent',CFI,W('<div class=f><a href=#>x</a></div>','<style>.f:has(:focus) a{outline:none}</style>')],
 ['C5 invalid list (whole rule dropped by browsers)',CFI,W('<a href=#>x</a>','<style>a:focus, a::-moz-nonsense{outline:none}</style>')],
 ['C6 :not(.absent) not required by prefilter',CFI,W('<a href=#>x</a>','<style>a:not(.keep-ring):focus{outline:none}</style>')],
 ['C7 :is(.absent, a)',CFI,W('<a href=#>x</a>','<style>:is(.absent, a):focus{outline:none}</style>')],
 ['C8 quirks, class case differs',CFI,W('<a href=# class=BTN>x</a>','<style>.btn:focus{outline:none}</style>','t','')],
 ['C9 class on html added by script (focus-visible polyfill)',CFI,W('<a href=#>x</a>','<style>.js-focus-visible :focus:not(.focus-visible){outline:none}</style><script>document.documentElement.classList.add("js-focus-visible")</script>')],
 ['C10 :host-styled shadow sheet with doc :focus-visible ring',CFI,W(shadow('h3x','<style>:host button:focus{outline:0}</style><button>Go</button>'))],
];
run4(cases.map(([n,r,h])=>({name:n,rules:r,html:h})));
