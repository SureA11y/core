const fs=require('fs'),path=require('path');
const {run}=require('./h.js');
const dir='/home/user/core/tests/fixtures';
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.html'));
const K={}; const add=(k,obj)=>{ if(!obj||typeof obj!=='object') return; K[k]=K[k]||{}; for(const x of Object.keys(obj)) K[k][x]=(K[k][x]||0)+1; K[k].__n=(K[k].__n||0)+1; };
const types={};
const addT=(k,v)=>{ const t=v===null?'null':Array.isArray(v)?'array':typeof v; types[k]=types[k]||new Set(); types[k].add(t); };
for (const f of files) for (const eo of [{}, {output:{includeSelector:false,includeHtml:false}}, {profile:'en301549-v3.2.1', optInRules:'all', perfStats:true}]) {
  const {r,err}=run({html:fs.readFileSync(path.join(dir,f),'utf8'), eo, ctx: f.startsWith('a')?'body':null}); if(err) continue;
  add('top',r); add('engine',r.engine); add('env',r.engine.environment);
  for (const c of r.checksResults){ add('check',c); add('check.meta',c.meta); if(c.data) add('check.data',c.data); for(const o of c.occurrences){ add('occ',o); addT('occ.selector',o.selector); addT('occ.html',o.html); addT('occ.structuralPath',o.structuralPath); addT('occ.i18n',o.i18n); if(o.data) add('occ.data',o.data); if (o.i18n) add('occ.i18n',o.i18n);} if(c.margin) add('margin',c.margin); addT('check.i18n',c.i18n); }
  for (const c of r.rulesResults){ add('comp',c); add('comp.data.details',c.data&&c.data.details); add('comp.meta',c.meta); addT('comp.type',c.type); }
}
for (const [k,v] of Object.entries(K)) { const n=v.__n; delete v.__n; console.log(k, 'n='+n, Object.entries(v).map(([a,b])=>a+(b<n?'('+b+')':'')).join(' ')); }
for (const [k,v] of Object.entries(types)) console.log('T',k,[...v].join('|'));
