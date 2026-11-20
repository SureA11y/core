const { sd, base, mkPack, index, pack } = require('./lib.js');
const proc = (s) => ({ steps: [s], passWhen: 'ok', failWhen: 'no' });
for (const withReqText of [false, true]) {
  const d = base();
  d.laws = { 'pub-act': { name: 'Public Act', jurisdiction: 'FR' } };
  d.texts = { fr: { 'laws.pub-act.name': 'Loi publique' } };
  d.data[1].requirements.A.procedure = proc('a');
  if (withReqText) d.data[1].texts = { fr: { 'requirements.A.title': 'Images FR' } };
  d.profiles = { 'base-1': { version: '1', tags: ['base'], mappedRules: true, law: 'pub-act' } };
  const p = mkPack(sd.standardFromData(d));
  const l = index.listProcedures({ packs: [p], profile: 'base-1', locale: 'fr' });
  console.log(`standard has a fr text besides the law name: ${withReqText} -> law name "${l.law.name}" (${l.law.lang}), list locale ${l.locale}; languagesOf=${JSON.stringify(pack.languagesOf(p.standard))}`);
}
