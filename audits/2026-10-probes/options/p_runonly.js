const {run,summ,core}=require('./h.js');
const cases = {
  objIds: {includeRuleIds:['img-alt-present','button-name-present']},
  bareIds: ['img-alt-present','button-name-present'],
  bareTags: ['wcag2a'],
  bareTagsUpper: ['WCAG2A'],
  str: 'img-alt-present',
  commaStr: 'img-alt-present, button-name-present',
  commaTagStr: 'wcag2a,wcag2aa',
  mixed: ['img-alt-present','wcag2a'],
  typo: ['img-alt-presnt'],
  typoTag: ['wcag2aaa1'],
  emptyArr: [],
  emptyStr: '',
  emptyObj: {},
  nul: null,
  composite: ['wcag-1.1.1'],
  legacyPrefix: ['a11ycore-img-alt-present'],
  legacyPrefixObj: {includeRuleIds:['a11ycore-img-alt-present']},
  legacyTag: {type:'tag', values:['wcag2a']},
  legacyTagUnknown: {type:'tag', values:['nonsense-tag']},
  andMode: {includeRuleIds:['img-alt-present'], tags:['best-practice']},
  orMode: {includeRuleIds:['img-alt-present'], tags:['best-practice'], includeMode:'or'},
  excludesOnly: {excludeRuleIds:['img-alt-present'], excludeTags:['best-practice']},
  unknownTagObj: {tags:['nonsense-tag']},
  unknownIdObj: {includeRuleIds:['nonsense-rule']},
  number: 42,
  bool: true,
  arrOfNonStrings: [1,2],
  arrWithNull: [null,'img-alt-present'],
  objCommaStr: {includeRuleIds:'img-alt-present, button-name-present'},
  includeModeOnly: {includeMode:'or'},
  bestPractice: ['best-practice'],
  upperId: ['IMG-ALT-PRESENT'],
  removedTag: ['wcag22-removed'],
};
for (const [k,ro] of Object.entries(cases)) {
  const {r,err,warns}=run({ro});
  if (err) { console.log(k.padEnd(18),'THROW', err.code||'', err.message.slice(0,200)); continue; }
  const s=summ(r);
  console.log(k.padEnd(18), 'n='+s.n, JSON.stringify(s.o), s.n<8?s.ids.join(','):'', 'wcag='+r.engine.wcagVersion, warns.length?'WARN:'+warns.join('|').slice(0,150):'');
}
