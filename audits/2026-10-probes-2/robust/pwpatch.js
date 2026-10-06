const { scanHtml, close } = require('./pw');
const fs = require('fs');
const patches = require('./patches');
const html = fs.readFileSync(process.env.PAGE || 'rich.html', 'utf8');
const summ = (r) => { const o = {}; for (const c of r.checksResults) o[c.ruleId] = c.outcome + ':' + c.occurrences.length; return o; };
(async () => {
  const base = await scanHtml(html);
  if (base.err) { console.log('BASE ERR', base.err); }
  const b = summ(base.r);
  const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(patches);
  for (const name of names) {
    let o; try { o = await scanHtml(html, { setup: patches[name] }); } catch (e) { console.log(name, "HARNESS", String(e).slice(0,100)); continue; }
    if (o.err) { console.log(name, 'THROW', o.err.split('\n').slice(0, 3).join(' | ')); continue; }
    const s = summ(o.r);
    const diffs = Object.keys({ ...b, ...s }).filter(k => b[k] !== s[k]).map(k => `${k}:${b[k]}->${s[k]}`);
    const errs = o.r.checksResults.filter(c => c.error).map(c => c.ruleId + '!' + String(c.error).slice(0, 80));
    console.log(name, 'diffs=' + diffs.length, diffs.slice(0, 8).join(' '), errs.length ? 'ERRS=' + errs.length + ' ' + errs.slice(0, 4).join(' ; ') : '');
  }
  await close();
})();
