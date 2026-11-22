// Hostile pages in Chromium with the browser bundle
const B = require('./bh.js');
const body = '<main><h1>t</h1><img src="a.png"><img src="b.png"><a href="/x"></a><button></button><div id="cookie"><img src="c.png"></div></main>';
const pg = (pre) => `<!doctype html><html lang="en"><head><title>t</title><script>${pre}</script><script src="/core.js"></script></head><body>${body}</body></html>`;
const cases = {
  clean: '',
  protoBudgetSpent: "Object.defineProperty(Object.prototype,'__budgetSpent',{value:true,configurable:true});",
  protoTimeBudget: "Object.defineProperty(Object.prototype,'timeBudgetMs',{value:1,configurable:true});",
  protoCap: "Object.defineProperty(Object.prototype,'maxOccurrencesPerRule',{value:1,configurable:true});",
  protoExclude: "Object.defineProperty(Object.prototype,'excludeSelectors',{value:['main'],configurable:true});",
  protoLocale: "Object.defineProperty(Object.prototype,'locale',{value:'de',configurable:true});",
  protoProfile: "Object.defineProperty(Object.prototype,'profile',{value:'wcag20-a',configurable:true});",
  protoNotRun: "Object.defineProperty(Object.prototype,'notRun',{value:[{ruleId:'img-alt-present',reason:'timeBudget'}],configurable:true});",
  protoProfileNotApplied: "Object.defineProperty(Object.prototype,'__profileNotApplied',{value:'timeBudget',configurable:true});",
  protoNode: "Object.defineProperty(Object.prototype,'__node',{value:null,configurable:true,writable:true});",
  protoOutcome: "Object.defineProperty(Object.prototype,'occurrenceOutcome',{value:'pass',configurable:true});",
  protoEnumX: "Object.prototype.x = 1;",
  frozenEls: "addEventListener('DOMContentLoaded',()=>{for(const e of document.querySelectorAll('*'))Object.freeze(e);Object.freeze(document);});",
  sealedEls: "addEventListener('DOMContentLoaded',()=>{for(const e of document.querySelectorAll('*'))Object.preventExtensions(e);});",
  matchesTrue: "Element.prototype.matches=function(){return true};",
  matchesThrow: "Element.prototype.matches=function(){throw new Error('nope')};",
  getAttrThrow: "Element.prototype.getAttribute=function(){throw new Error('ga')};",
  qsaEmpty: "Document.prototype.querySelectorAll=function(){return []};Element.prototype.querySelectorAll=function(){return []};",
  closestNull: "Element.prototype.closest=function(){return null};",
  hugeAttrs: "addEventListener('DOMContentLoaded',()=>{const i=document.querySelector('img');i.className='c'.repeat(5e6);i.setAttribute('aria-describedby','x '.repeat(2e5));i.id='i'.repeat(1e6);document.querySelector('a').setAttribute('aria-label',' '.repeat(3e6));});",
  symbolFor: "Symbol.for=function(){return Symbol('fake')};",
  weakRef: "window.WeakRef=undefined;window.FinalizationRegistry=undefined;",
  perfNow: "performance.now=function(){return 0};Date.now=function(){return 0};",
  perfNowJump: "let __t=0;performance.now=function(){return __t+=1e6};Date.now=function(){return __t+=1e6};",
  objectAssign: "const oa=Object.assign;Object.assign=function(t,...s){return oa(t,...s,{timeBudgetMs:1})};",
};
(async () => {
  await B.start();
  for (const [name, pre] of Object.entries(cases)) {
    const { page, logs } = await B.open('/' + name, pg(pre));
    const out = await page.evaluate(async () => {
      const t0 = performance.now();
      try {
        const r = a11ycore.runa11yCoreInPage(location.href, null, { excludeSelectors: ['#cookie'], output: {} }, null);
        const s = (r.checksResults || []).reduce((m, c) => (m[c.outcome] = (m[c.outcome] || 0) + 1, m), {});
        const img = (r.checksResults.find(c => c.ruleId === 'img-alt-present') || {});
        return { ms: Math.round(performance.now() - t0), n: r.checksResults.length, s, inc: r.engine.incomplete, notRun: (r.notRun || []).length, loc: r.engine.locale && r.engine.locale.resolved, prof: r.engine.profile, img: [img.outcome, (img.occurrences || []).length, img.occurrencesOmitted, img.error && img.error.slice(0, 80)], errs: r.checksResults.filter(c => c.error).length, firstErr: (r.checksResults.find(c => c.error) || {}).error, winKeys: Object.keys(window).filter(k => /a11y|surea11y/i.test(k) && k !== 'a11ycore') };
      } catch (e) { return { threw: e.code || '', msg: String(e.message).slice(0, 200), ms: Math.round(performance.now() - t0) }; }
    });
    console.log(name.padEnd(22), JSON.stringify(out).slice(0, 420), logs.filter(l => !/^l /.test(l)).slice(0, 2).map(x => x.slice(0, 160)));
    await page.close();
  }
  await B.stop();
})();
