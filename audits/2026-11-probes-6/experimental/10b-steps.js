const { sd, base, mkPack, index } = require('./lib.js');
const proc = (s) => ({ steps: [s], passWhen: 'ok ' + s, failWhen: 'no ' + s });
for (const listTests of [true, false]) {
  const d = base();
  d.data[1].tests = { 'A.1': { title: 'Alt present', requirements: ['A'], procedure: proc('Inspect images.') } };
  if (listTests) d.data[1].requirements.A.tests = ['A.1'];
  d.data[1].ruleMap = { 'img-alt-present': { requirements: ['A.1'] } };
  d.data[1].texts = { fr: { 'tests.A.1.title': 'Alternative présente', 'tests.A.1.procedure.steps': ['Inspectez les images.'], 'tests.A.1.procedure.passWhen': 'oui', 'tests.A.1.procedure.failWhen': 'non' } };
  const p = mkPack(sd.standardFromData(d));
  const a = index.listProcedures({ packs: [p], standard: 'base', locale: 'fr' }).requirements.find((r) => r.id === 'A');
  console.log(listTests, JSON.stringify(a.facets[0]).slice(0, 300));
}
