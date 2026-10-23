const { run, pick } = require('./h');
const failer = (ctx)=>({outcome:'fail',occurrences:[{__node: ctx.document.querySelector('h1'), summary:'s'}]});
const mk = (meta, extra={}) => ({ customRules:[{ id:'z', meta, runInPage: failer }], ...extra });
function s(label, eo, ro){ const o=run(eo, ro); if(o.err) return console.log(label.padEnd(36),'THROW',o.err.message); const r=pick(o.res,'z'); console.log(label.padEnd(36), r? `${r.outcome} err=${r.error||''} rollups=${JSON.stringify(r.rollupIds)} scope=${JSON.stringify(r.wcagVersionScope||null)} nm=${JSON.stringify(r.meta.normativeMappings).slice(0,120)}` : 'NOT RUN', 'engine.profile=',o.res.engine.profile, o.warns.join('|').slice(0,150)); return o; }
s('default no tags', mk({}), null);
s('runOnly tags wcag2a, no tags', mk({}), {tags:['wcag2a']});
s('tag mytag', mk({tags:['MyTag']}), {tags:['mytag']});
s('bare arr tag mytag', mk({tags:['MyTag']}), ['mytag']);
s('excludeTags mytag', mk({tags:['mytag']}), {excludeTags:['mytag']});
s('eo.tags.exclude', mk({tags:['mytag']}, {tags:{exclude:['mytag']}}), null);
s('eo.rules.exclude z', mk({}, {rules:{exclude:['z']}}), null);
s('profile wcag22-aa no tags', mk({}, {profile:'wcag22-aa'}), null);
s('profile wcag22-aa tag wcag2a', mk({tags:['wcag2a','wcag111']}, {profile:'wcag22-aa'}), null);
s('profile en301549 tag wcag2a', mk({tags:['wcag2a']}, {profile:'en301549-v4.1.1'}), null);
s('profile section508 no tags', mk({}, {profile:'section508'}), null);
s('type manual', mk({type:'manual'}), ['z']);
s('wcag22-removed', mk({tags:['wcag22-removed'], normativeMappings:[{standard:'WCAG',version:'2.1',requirement:'4.1.1',title:'Parsing'}]}), ['z']);
s('wcag22-removed wcagVersion 2.1', mk({tags:['wcag22-removed']}, {wcagVersion:'2.1'}), ['z']);
let o = s('nm WCAG 1.1.1 default run', mk({tags:['wcag2a','wcag111'], normativeMappings:[{standard:'WCAG',version:'2.2',requirement:'1.1.1',title:'Non-text Content'}]}), null);
const c = o.res.rulesResults.find(r=>r.ruleId==='wcag-1.1.1-non-text-content'); console.log('   composite 1.1.1:', c.outcome, c.data && c.data.details && c.data.details.checksIds.includes('z'));
o = s('nm custom std', mk({normativeMappings:[{standard:'ACME-STD',version:'1',requirement:'7.2',title:'x'}]}, {mappings:['wcag']}), null);
s('policy generic', mk({type:'manual'}, {policyContract:'generic'}), ['z']);
// margin
const mm = { customRules:[{ id:'z', meta:{ margin:{measure:'target size', unit:'px', limit:'min'} }, runInPage: (ctx)=>({outcome:'pass',occurrences:[], marginCandidates:[{__node:ctx.document.querySelector('h1'), value: 30, threshold:24}]}) }] };
o = run(mm, ['z']); console.log('margin:', JSON.stringify(pick(o.res,'z').margin));
const mm2 = { customRules:[{ id:'z', meta:{ margin:{measure:'target size', unit:'em', limit:'min'} }, runInPage: (ctx)=>({outcome:'pass',occurrences:[], marginCandidates:[{__node:ctx.document.querySelector('h1'), value: 30, threshold:24}]}) }] };
o = run(mm2, ['z']); console.log('margin bad unit:', JSON.stringify(pick(o.res,'z').margin), o.warns);
