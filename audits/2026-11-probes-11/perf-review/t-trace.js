const {JSDOM}=require('/home/user/core-r11/node_modules/jsdom');const core=require('/home/user/r11-perf-review/src/core.js');
const html='<!doctype html><html lang=en><head><title>t</title><style>button:focus{outline:none}\n:nth-child(2 of .x):focus{outline:none}</style></head><body><main><div><a class=x href=#a>One</a><button type=button>Two</button><a class=x href=#c>Three</a></div></main></body></html>';
const dom=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true});global.window=dom.window;global.document=dom.window.document;
const orig=dom.window.Element.prototype.matches;dom.window.Element.prototype.matches=function(s){const r=orig.call(this,s);if(/nth-child\(2 of/.test(s))console.log(this.localName,JSON.stringify(s),r);return r;};
core.runDomRulesInPage(dom.window.location.href,null,{rules:{include:['css-focus-indicator-suppressed']}},null);
