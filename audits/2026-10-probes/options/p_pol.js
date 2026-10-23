const {run,summ}=require('./h.js');
const S=(x)=>{ if(x.err) return 'THROW '+x.err.message.slice(0,160); const s=summ(x.r); const conf={}; x.r.checksResults.forEach(c=>conf[c.confidence]=(conf[c.confidence]||0)+1); const ro={}; x.r.rulesResults.forEach(c=>ro[c.outcome]=(ro[c.outcome]||0)+1); const man=x.r.checksResults.filter(c=>c.type==='manual'&&c.outcome==='fail').length; return `${JSON.stringify(s.o)} rollups=${JSON.stringify(ro)} conf=${JSON.stringify(conf)} manualFail=${man} ${x.warns.length?'WARN:'+x.warns.join('|').slice(0,100):''}`;};
const cases={
 def:{}, generic:{policyContract:'generic'}, a11y:{policyContract:'a11y'}, unknown:{policyContract:'nope'},
 ctor:{policyContract:'constructor'}, proto:{policyContract:'__proto__'}, toStr:{policyContract:'toString'},
 inline:{policyContract:{id:'x',allowedConfidence:['high','medium']}},
 inlineOnlyPass:{policyContract:{allowedOutcomes:['pass']}},
 inlineEmpty:{policyContract:{allowedOutcomes:[]}},
 inlineGarbage:{policyContract:{allowedOutcomes:'fail'}},
 inlineBadConf:{policyContract:{allowedConfidence:[]}},
 polOverride:{policy:{coerceManualFailToCantTell:false}},
 polStr:{policy:'generic'},
 polArr:{policyContract:['generic']},
 polNum:{policyContract:1},
};
for(const [k,eo] of Object.entries(cases)) console.log(k.padEnd(14), S(run({eo})));
