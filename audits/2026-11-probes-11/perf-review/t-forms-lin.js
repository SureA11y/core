const h=require('./h.js');
const forms=`<form><div><p>Pick one</p><label><input type=radio name=a> Yes</label><label><input type=radio name=a> No</label></div>
<div><p>Other</p><label><input type=radio name=b> Yes</label><label><input type=radio name=b> No</label><input type=hidden name=h><input type=submit></div>
<div><p>Q3</p><label><input type=checkbox name=c> A</label><label><input type=checkbox name=c> B</label><span role="textbox" aria-label="t"></span></div>
<div><p>Q4</p><label><input type=checkbox name=d> A</label><label><input type=checkbox name=d> B</label><span role="presentation textbox"></span><div role="foo textbox">x</div></div>
<fieldset><legend>L</legend><div><p>Q5</p><label><input type=radio name=e> A</label></div><label><input type=radio name=e> B</label><select aria-label=s><option>1</select></div></fieldset>
<div role="radiogroup" aria-label="G"><p>Q6</p><label><input type=radio name=f>A</label><label><input type=radio name=f>B</label></div>
</form><form><p>Second form</p><label><input type=radio name=a>Yes</label><label><input type=radio name=a>No</label></form>
<div id=h></div><script>const r=document.getElementById('h').attachShadow({mode:'open'});r.innerHTML='<div><p>Shadow Q</p><label><input type=radio name=a>Yes</label><label><input type=radio name=a>No</label><textarea aria-label=z></textarea></div>';</script>`;
const lin=['Search','Buscar ahora','検索','検索する','ค้นหา','ຊອກຫາ','ស្វែងរក','ရှာဖွေ','搜索 Go','Go 搜索','café','naïve','x·y','aʼb','ño','e̅','ạb','⺀ radical','ﾃｽﾄ','𠀋字','Ａｂｃ'];
let li='';lin.forEach((t,i)=>{li+=`<button aria-label="${t}${i%2?'':' more'}">${t}</button><a href="#" aria-label="pre ${t}">${t}</a><button aria-label="${t.split('').reverse().join('')}">${t}</button>`;});
const wrap=b=>`<!doctype html><html lang="en"><head><title>t</title></head><body><main>${b}</main></body></html>`;
h.run4([{name:'forms',html:wrap(forms),scripts:true,opts:{includeShadowDom:true},rules:['form-control-label-quality','form-control-programmatic-label-quality']},
 {name:'label-in-name',html:wrap(li),rules:['label-in-name']}],{verbose:false});
