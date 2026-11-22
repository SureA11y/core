const h=require('./h.js');const src=require('fs').readFileSync(__dirname+'/t-excl.js','utf8');
eval(src.replace(/h\.run4\(\[[\s\S]*$/,'')+";h.run4([{name:'v',html,scripts:true,opts,repeat:2,betweenSrc:between,between:(w)=>{new w.Function(between)();},rules:['img-alt-present','button-name-present']}],{verbose:true,modes:['chrome','jsdom']});");
