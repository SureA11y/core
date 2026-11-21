const { run, close } = require('./h');
const C = ['contrast-minimum','contrast-enhanced','contrast-computable'];
async function cases(list, rules = C, opts = {}) {
  for (const [label, html, o] of list) {
    let r;
    try { r = await run(html, (o && o.rules) || rules, Object.assign({}, opts, o || {})); } catch (e) { console.log('== ' + label + ' CRASH ' + e.message.slice(0, 300)); continue; }
    console.log('== ' + label);
    for (const c of r.res) {
      const occ = c.occ.map(x => `${x.rc||''}${x.m&&x.m.ratio?'@'+(+x.m.ratio).toFixed(2):''}${x.d&&x.d.foreground?' fg='+x.d.foreground:''}${x.d&&x.d.background?' bg='+x.d.background:''} ${x.lean?'lean='+x.lean:''} ${String(JSON.stringify(x.sel)).slice(0,50)}`);
      console.log(`  ${c.ruleId}: ${c.outcome}${c.error?' ERR '+JSON.stringify(c.error).slice(0,300):''}  ${occ.join(' | ')}`);
    }
  }
}
module.exports = { cases, close, C };
