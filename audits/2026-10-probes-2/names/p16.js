const run = require('/home/user/core/tests/helpers/runa11yCoreOnHtml');
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const html='<!doctype html><html lang="en"><head><title>t</title></head><body><label for="q">Search site</label><input id="q"><my-field></my-field></body></html>';
const dom=new JSDOM(html,{pretendToBeVisual:true, url:'https://e.test/'});
const host=dom.window.document.querySelector('my-field');
const sr=host.attachShadow({mode:'open'});
sr.innerHTML='<label>Zip <input id="q"></label>';
const r=run.runa11yCoreOnDom ? null : null;
console.log(Object.keys(run));
