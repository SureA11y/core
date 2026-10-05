const {run,summ,core}=require('./h.js');
const setup=(doc)=>{ const h=doc.getElementById('host'); const sr=h.attachShadow({mode:'open'}); sr.innerHTML='<div class="inner"><img src="s.png"><button></button></div>'; };
const pageRules=['page-title-present','html-lang-attr-present','landmark-one-main','region','bypass-blocks-present','page-has-heading-one','landmark-unique','duplicate-id','heading-order'];
const S=(x)=>{ if(x.err) return 'THROW code='+(x.err.code||'-')+' sel='+JSON.stringify(x.err.selector)+' '+x.err.message.slice(0,120); const s=summ(x.r); const pr=pageRules.map(id=>{const c=x.r.checksResults.find(c=>c.ruleId===id);return id.split('-').slice(0,2).join('-')+':'+(c?c.outcome[0]+c.outcome[1]:'-')}).join(' ');
 const img=x.r.checksResults.find(c=>c.ruleId==='img-alt-present'); 
 return `cs=${JSON.stringify(x.r.contextSelector)} cm=${JSON.stringify(x.r.contextMatch)} ${JSON.stringify(s.o)} img=${img&&img.outcome}/${img?img.occurrences.length:0} | ${pr} ${x.warns.length?'WARN:'+x.warns.join('|').slice(0,120):''}`;};
const cases={
 none:null, str:'#a', comma:'#a, #b', arr:['#a','#b'], invalid:'#a[', invalidArr:['#a','#a['], unmatched:'#mian', partial:['#a','#nope'],
 nested:['main','#a','#a img'], shadowInner:'.inner', shadowHost:'#host', html:'html', body:'body', emptyDiv:'#empty', emptyStr:'', spaces:'   ',
 num:5, obj:{a:1}, arrNums:[5], arrEmpty:[], arrEmptyStr:[''], dupArr:['#a','#a'], hiddenDiv:'div[hidden]', head:'head', title:'title',
 rootPseudo:':root', star:'*', shadowPierce:'#host >>> img'
};
for(const [k,ctx] of Object.entries(cases)) console.log(k.padEnd(12), S(run({ctx,setup})));
