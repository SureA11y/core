const Ajv = require('/home/user/core-r9/node_modules/ajv');
const schema = require('@surea11y/core/schemas/standard.schema.json');
const { checkStandardData, standardFromData } = require('@surea11y/core/pack');
console.log('schema $schema', schema.$schema);
let ajv; try { ajv = new (Ajv.default||Ajv)({ strict: false, allErrors: true }); } catch(e){ console.log(e.message); }
let validate; try { validate = ajv.compile(schema); } catch (e) { console.log('compile', e.message.slice(0,200)); const Ajv2020 = require('/home/user/core-r9/node_modules/ajv/dist/2020'); ajv = new Ajv2020({strict:false, allErrors:true}); validate = ajv.compile(schema); }
const base = () => ({ format: 'surea11y-standard/1', key: 'en', standard: 'EN-like', versions: [{ version: 'V3', wcagVersion: '2.1' }],
  data: { V3: { requirements: { '9.1.1.1': { title: 'Non-text content', wcagSc: ['1.1.1'] } }, ruleMap: { 'img-alt-present': { requirements: ['9.1.1.1'] } } } } });
const muts = {
  ok: d=>d,
  extraTopKey: d=>{d.foo=1},
  extraReqKey: d=>{d.data.V3.requirements['9.1.1.1'].foo=1},
  extraRowKey: d=>{d.data.V3.ruleMap['img-alt-present'].foo=1},
  wcagScBad: d=>{d.data.V3.requirements['9.1.1.1'].wcagSc=['9.9.9']},
  wcagScNum: d=>{d.data.V3.requirements['9.1.1.1'].wcagSc=[111]},
  titleEmpty: d=>{d.data.V3.requirements['9.1.1.1'].title=''},
  titleNum: d=>{d.data.V3.requirements['9.1.1.1'].title=5},
  wcagVersion30: d=>{d.versions[0].wcagVersion='3.0'},
  publishedBad: d=>{d.versions[0].published='2026-13'},
  publishedDate: d=>{d.versions[0].published='2026-02-30'},
  langBad: d=>{d.lang='english'},
  langOk: d=>{d.lang='fr-CA'},
  keyUpper: d=>{d.key='EN'},
  versionMissingData: d=>{d.versions.push({version:'V4', wcagVersion:'2.2'})},
  dataExtraVersion: d=>{d.data.V9 = d.data.V3},
  unknownRule: d=>{d.data.V3.ruleMap['no-such-rule']={requirements:['9.1.1.1']}},
  rowUnknownReq: d=>{d.data.V3.ruleMap['img-alt-present'].requirements=['1.2.3']},
  emptyRequirements: d=>{d.data.V3.requirements={}; d.data.V3.ruleMap={}},
  scopeBad: d=>{d.data.V3.requirements['9.1.1.1'].scope='global'},
  routeOutcomePass: d=>{d.data.V3.ruleMap['img-alt-present'].reasonCodes={TEXT_ALTERNATIVE_MISSING:{outcome:'pass'}}},
  routeUnknownCode: d=>{d.data.V3.ruleMap['img-alt-present'].reasonCodes={NOPE:{outcome:'cantTell'}}},
  profileNoVersion: d=>{d.profiles={'en-v3':{tags:[]}}},
  profileBadVersion: d=>{d.profiles={'en-v3':{version:'V9'}}},
  profileUnknownField: d=>{d.profiles={'en-v3':{version:'V3', foo: 1}}},
  formatBad: d=>{d.format='surea11y-standard/2'},
  versionsEmpty: d=>{d.versions=[]; d.data={}},
  groupsUnknownReq: d=>{d.data.V3.groups=[{id:'g',title:'G',requirements:['nope']}]},
  textsBadKey: d=>{d.data.V3.texts={fr:{'requirements.nope.title':'x'}}},
  textsLocaleBad: d=>{d.data.V3.texts={'not a locale':{'requirements.9.1.1.1.title':'x'}}},
  dupVersion: d=>{d.versions.push({version:'V3', wcagVersion:'2.1'})},
};
for (const [name, m] of Object.entries(muts)) {
  const d = base(); m(d);
  const s = validate(d);
  let c; try { c = checkStandardData(d); } catch(e){ c = ['THROWS '+e.message]; }
  let sf; try { standardFromData(d); sf='ok'; } catch(e){ sf='throws'; }
  const flag = (s === (c.length===0)) ? '' : '  <-- DISAGREE';
  console.log(name.padEnd(20), 'schema', s?'valid':'INVALID', '| check', c.length?('problems: '+c[0].slice(0,110)):'ok', '| fromData', sf, flag, (!s && flag)? JSON.stringify(validate.errors[0]).slice(0,150):'');
}
