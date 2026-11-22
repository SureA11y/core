const H=require('/tmp/surea11y-audit/r12/api/h.js');
const html=H.page('<img src=a.png>');
const cases=[['runOnly []',{},[]],['runOnly ""',{},''],['runOnly {type:rule,values:[]}',{},{type:'rule',values:[]}],['runOnly Set()',{},new Set()],['runOnly {}',{},{}],['runOnly {type:"tag"}',{},{type:'tag'}],
['eo.rules.include []',{rules:{include:[]}},null],['eo.tags []',{tags:[]},null],['eo.tags {include:[]}',{tags:{include:[]}},null],['eo.rules []',{rules:[]},null],['eo.profile []',{profile:[]},null],['eo.timestamp ""',{timestamp:''},null],
['strict runOnly []',{strictOptions:true},[]],['strict eo.rules.include []',{strictOptions:true,rules:{include:[]}},null],['strict eo.tags []',{strictOptions:true,tags:[]},null],['strict profile []',{strictOptions:true,profile:[]},null],['strict probes Date',{strictOptions:true,probes:{d:new Date()}},null],['probes Date',{probes:{d:new Date(),ok:1}},null],['probes array',{probes:[1]},null],
['strict probes NaN',{strictOptions:true,probes:{n:NaN}},null],['strict contrast Object.create(null)',{strictOptions:true,contrast:Object.assign(Object.create(null),{mode:'auditorAssist'})},null]];
for(const [n,eo,ro] of cases){const s=H.scan(html,eo,ro);console.log(n.padEnd(32),'|',s.err?('THROW '+(s.err.code||'')+' '+s.err.message.slice(0,140)):('rules '+s.r.checksResults.length),'|',s.logs.map(l=>l.slice(0,150)).join(' || '));}
const s=H.quiet(()=>H.T.runa11yCoreOnHtml(html,{engineOptons:{},entryPointParity:false}));console.log('helper typo',s.logs);
const s2=H.quiet(()=>H.T.runa11yCoreOnHtml(html,{runonly:['x'],entryPointParity:false,engineOptions:{strictOptions:true}}));console.log('helper typo strict',s2.err&&s2.err.message,s2.logs);
