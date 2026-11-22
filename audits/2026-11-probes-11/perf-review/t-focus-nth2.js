const h=require('./h.js');
const sec=[':nth-child(2 of .x)','div > :nth-child(2 of .x)','a:nth-child(2 of .x)','li:nth-child(2 of .x)',':nth-last-child(2 of .x)',':nth-child(2 of a)'];
const cases=[];
for(const s of sec)for(const order of [0,1]){const css=order?`${s}:focus{outline:none}\nbutton:focus{outline:none}`:`button:focus{outline:none}\n${s}:focus{outline:none}`;
cases.push({name:`${s} order${order}`,rules:['css-focus-indicator-suppressed'],html:`<!doctype html><html lang="en"><head><title>t</title><style>${css}</style></head><body><main><div><a class="x" href="#a">One</a><button type="button">Two</button><a class="x" href="#c">Three</a></div></main></body></html>`});}
h.run4(cases.slice(0,2),{modes:["jsdom"],verbose:true});
