process.env.ROOT=process.argv[2];const H=require('/tmp/surea11y-audit/r12/api/h.js');const vm=require('vm');
const html=H.page('<img src=a.png>');
const src=`({name:'pk',version:'1.0.0',namespace:'pk',core:'*',rules:[{id:'pk-rule',meta:{title:'T',description:'d',tags:['wcag2a','wcag111'],wcagSc:['1.1.1']}}]})`;
const res=(s)=>{if(s.err)return 'ERR '+s.err.message.slice(0,150);const c=s.r.checksResults.find(c=>c.ruleId==='pk-rule');return c?c.outcome+' '+JSON.stringify(c.data||{}).slice(0,200)+' logs:'+s.logs.join('|').slice(0,300):'absent '+s.logs.join('|').slice(0,300);};
for(const realm of ['same','vm']){const p=realm==='same'?eval(src):vm.runInContext(src,vm.createContext({}));p.rules[0].runInPage=function(){return{outcome:'pass',occurrences:[]}};
 console.log(realm,res(H.scan(html,{packs:[p]})));}
