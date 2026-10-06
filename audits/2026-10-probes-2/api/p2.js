const { run, both, ids, core } = require('./h');
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a.png"><button></button></main></body></html>';
const mk = (id, extra={}) => ({ id, meta: { title: 'X '+id }, runInPage(ctx){ return { outcome:'pass', occurrences:[] }; }, ...extra });
const t = (label, eo, ro=null) => {
  for (const which of ['inpage','node']) {
  try { const r = run(html, null, eo, ro, which);
    const cr = (eo.customRules||[]).map(c=>c&&c.id);
    console.log(label, which, 'n=', r.checksResults.length, 'custom:', JSON.stringify(r.checksResults.filter(c=>cr.includes(c.ruleId)).map(c=>[c.ruleId,c.outcome,c.error])), 'skipped', JSON.stringify(r.skippedCustomRules), 'over', JSON.stringify(r.overriddenBuiltinIds));
    try { JSON.stringify(r) } catch(e) { console.log('  NOT SERIALIZABLE', e.message); }
  } catch(e) { console.log(label, which, 'THROW', e.code, e.message); } }
};
t('__proto__', { customRules: [mk('__proto__')] });
t('__proto__ runOnly', { customRules: [mk('__proto__')] }, ['__proto__']);
t('constructor', { customRules: [mk('constructor')] });
t('constructor with rules {}', { customRules: [mk('constructor', { runInPage(ctx){ return {outcome:'pass', occurrences:[], data:{cfg: typeof ctx.config}} } })], rules: {} });
t('hasOwnProperty', { customRules: [mk('hasOwnProperty')] });
t('toString', { customRules: [mk('toString')] });
t('id is tag', { customRules: [mk('wcag2a')] }, ['wcag2a']);
t('bad meta in runOnly', { customRules: [mk('zz', {meta:{defaultSeverity:'huge'}})] }, ['zz']);
