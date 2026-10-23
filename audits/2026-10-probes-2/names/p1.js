const p=require('./h');
const r=p('basic','<button></button>',['button-name-present']);
console.log(Object.keys(r), JSON.stringify(r.results?.[0]||r).slice(0,1500));
