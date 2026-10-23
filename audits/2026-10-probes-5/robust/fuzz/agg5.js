// node agg5.js <dir>  : summarise issue kinds per rule across a run, with sample seeds.
const fs = require('fs'); const d = process.argv[2];
const k = {}; let n = 0, slow = [];
for (const f of fs.readdirSync(d).filter(f => f.endsWith('.jsonl') && f !== 'hangs.jsonl')) for (const line of fs.readFileSync(d + '/' + f, 'utf8').split('\n')) {
  if (!line.trim()) continue; let l; try { l = JSON.parse(line); } catch { continue; } n++;
  for (const i of l.issues || []) { const key = i.kind + ' ' + (i.ruleId || '') + (i.match ? ' ' + i.match : ''); (k[key] ||= []).push(l.seed); }
  if ((l.slowRules || []).length) slow.push(l.seed + ':' + l.slowRules.map(x => x.join('=')).join(','));
}
console.log('cases', n); for (const [key, s] of Object.entries(k).sort()) console.log(key.padEnd(60), s.length, s.slice(0, 8).join(','));
console.log('slow rules (>1s):', slow.length, slow.slice(0, 20).join(' | '));
try { console.log('hangs:', fs.readFileSync(d + '/hangs.jsonl', 'utf8').trim().split('\n').join(' ')); } catch {}
