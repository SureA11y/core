const {scan,tryit}=require('./h');const S=require('/home/user/core/src/sarif.js');
const sar=r=>{const s=S.renderSarifReport(r);return typeof s==='string'?JSON.parse(s):s};
const rule={id:'nosum',meta:{title:'',description:'d',tags:['custom'],defaultSeverity:'minor',defaultConfidence:'high',type:'automatic'},runInPage(ctx){const el=document.querySelector('img');return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(el,{})]};}};
tryit('nosummary',()=>{const r=scan('<html lang=en><title>t</title><body><img src=a alt=x>',null,{customRules:[rule]},['nosum']);return JSON.stringify(sar(r).runs[0].results.map(x=>x.message))});
for (const u of ['file:///tmp/../../x y/a b.html','file:///C:/proj/a b.html','https://ex.com/a b?q=1#f','file://server/share/a.html','not a url', 'file:///home/user/core/../core/x y.html']) tryit('uri '+u,()=>{const r=scan('<html><title>t</title><body><img src=a>',null,{},['img-alt-present'],'https://e.test/');r.url=u;return sar(r).runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri;});
// big html fingerprint
const big='<html lang=en><title>t</title><body><div role=listbox aria-x="'+'a'.repeat(5000)+'">'+'<span>q</span>'.repeat(500)+'</div><img src=a data-z="'+'b'.repeat(3000)+'">';
tryit('fp len',()=>{const r=scan(big);const s=sar(r);return s.runs[0].results.map(x=>x.partialFingerprints['surea11y/violation/v1'].length).join(',')+' raw NUL: '+JSON.stringify(s.runs[0].results[0].partialFingerprints).includes('\\u0000');});
// 2000 char surrogate split
const emoji='😀'.repeat(1500);
tryit('surrogate',()=>{const r=scan('<html lang=en><title>t</title><body><img src=a title="x'+emoji+'">',null,{},['img-alt-present']);const h=r.checksResults[0].occurrences[0].html;const last=h.charCodeAt(h.length-1);return 'len '+h.length+' lastIsHighSurrogate '+(last>=0xD800&&last<=0xDBFF)+' tail '+JSON.stringify(h.slice(-6));});
