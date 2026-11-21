// ARIA in HTML permitted DPUB roles flagged by aria-allowed-role
const { jrun, jsum } = require('./jsd');
const pairs = [
 ['section','doc-chapter'],['section','doc-abstract'],['section','doc-appendix'],['section','doc-introduction'],['section','doc-endnotes'],['section','doc-bibliography'],['section','doc-toc'],
 ['aside','doc-footnote'],['aside','doc-tip'],['aside','doc-pullquote'],['aside','doc-example'],
 ['hr','doc-pagebreak'],['h2','doc-subtitle'],['img alt="Cover" src="c.png"','doc-cover'],['nav','doc-toc'],['footer','doc-footnote'],['header','doc-footnote'],['ul','directory'],['p','doc-subtitle']];
(async()=>{ for (const [el, role] of pairs){ const tag = el.split(' ')[0]; const html = `<${el} role="${role}" aria-label="x">${['hr','img'].includes(tag)?'':'t'}${['hr','img'].includes(tag)?'':`</${tag}>`}`; const r = await jrun(html, ['aria-allowed-role','aria-roles-valid','aria-deprecated-role']); const o = r.flatMap(x=>x.occ.filter(o=>o.oc!=='pass').map(o=>x.ruleId+':'+o.rc)); console.log(`<${el} role=${role}>`.padEnd(45), o.join(' ')||'ok'); } })();
