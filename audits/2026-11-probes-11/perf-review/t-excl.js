const h=require('./h.js');
const setup=`function mk(id,cls,inner){const d=document.createElement('div');d.id=id;d.className=cls;document.querySelector('main').appendChild(d);const r=d.attachShadow({mode:'open'});r.innerHTML=inner;return r;}
const r1=mk('h1','','<img src="a.png"><button></button><div id="n"></div>');
r1.getElementById('n').attachShadow({mode:'open'}).innerHTML='<img src="b.png"><a href="#"></a>';
mk('h2','ex','<img src="c.png"><button></button>');
mk('h3','rx','<img src="d.png"><input>');`;
const html=`<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="top.png"><div class="ex"><img src="e.png"></div><div class="rx"><button></button></div></main><script>${setup}</script></body></html>`;
const between=`document.getElementById('h1').classList.add('ex');document.getElementById('h2').classList.remove('ex');const d=document.createElement('div');document.querySelector('main').appendChild(d);d.attachShadow({mode:'open'}).innerHTML='<img src="z.png"><button></button>';`;
const opts={includeShadowDom:true,excludeSelectors:['.ex'],rules:{'img-alt-present':{excludeSelectors:['.rx']},'button-name-present':{excludeSelectors:['.rx','#h1']}}};
const opts2={includeShadowDom:true,rules:{'img-alt-present':{excludeSelectors:['.rx']},'button-name-present':{excludeSelectors:['.ex']}}};
const R=null;
h.run4([
 {name:'excl-repeat',html,scripts:true,opts,repeat:2,betweenSrc:between,between:(w)=>{new w.Function(between)();}},
 {name:'excl-rule-only',html,scripts:true,opts:opts2,repeat:2,betweenSrc:between,between:(w)=>{new w.Function(between)();}},
 {name:'excl-profiles',html,scripts:true,opts:Object.assign({},opts,{profile:['wcag22-aa','wcag21-a']})},
],{verbose:false});
