const {runa11yCoreOnHtml}=require('/home/user/core/src/testing.js');console.warn=()=>{};
const body=`<a href="/a">click here</a><img src="a.png" alt="image"><img src="IMG_1234.jpg" alt="IMG_1234.jpg"><input type="image" alt="submit" src="x.png"><map name="m"><area href="#" alt="image" shape="rect" coords="0,0,1,1"></map><img usemap="#m" src="m.png" alt="map"><h2>Untitled</h2><label for="i">Label</label><input id="i"><button>button</button><a href="/b">more</a><iframe title="iframe"></iframe><svg role="img" aria-label="image"></svg>`;
const all=new Set();
for(const lang of ['__proto__','constructor','toString','hasOwnProperty','valueOf','isPrototypeOf','propertyIsEnumerable','toLocaleString','__defineGetter__','__lookupGetter__']){
 for(const title of ['Home','Untitled','Home | Brand']){
 const html=`<!doctype html><html lang="${lang}"><head><title>${title}</title></head><body><main>${body}</main></body></html>`;
 const r=runa11yCoreOnHtml(html,{entryPointParity:false});for(const c of r.checksResults)if(c.error)all.add(lang+' :: '+c.ruleId+' :: '+c.error);}
 // element-level lang
 const html2=`<!doctype html><html lang="en"><head><title>Page about cats</title></head><body><main lang="${lang}">${body}</main></body></html>`;
 const r2=runa11yCoreOnHtml(html2,{entryPointParity:false});for(const c of r2.checksResults)if(c.error)all.add('el:'+lang+' :: '+c.ruleId+' :: '+c.error);
}
console.log([...all].join('\n'));
