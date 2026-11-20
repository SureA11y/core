const { sd, base, mkPack, index, pack } = require('./lib.js');
const proc = (s) => ({ steps: [s], passWhen: 'ok ' + s, failWhen: 'no ' + s });
function build(listTests) {
  const d = base();
  d.data[1].tests = { 'A.1': { title: 'Alt present', requirements: ['A'], procedure: proc('Inspect images.') }, 'B.1': { title: 'Labels', requirements: ['B'], procedure: proc('Inspect fields.') } };
  if (listTests) { d.data[1].requirements.A.tests = ['A.1']; d.data[1].requirements.B.tests = ['B.1']; }
  d.data[1].ruleMap = { 'img-alt-present': { requirements: ['A.1'] } };
  d.data[1].texts = { fr: { 'tests.A.1.title': 'Alternative présente', 'tests.A.1.procedure.steps': ['Inspectez les images.'], 'tests.A.1.procedure.passWhen': 'oui', 'tests.A.1.procedure.failWhen': 'non' } };
  return d;
}
for (const listTests of [true, false]) {
  const st = sd.standardFromData(build(listTests));
  const p = mkPack(st);
  const l = index.listProcedures({ packs: [p], standard: 'base', locale: 'fr' });
  const a = l.requirements.find((r) => r.id === 'A');
  console.log(`requirement lists its tests: ${listTests}  ->  facet label: "${a.facets[0].label}", steps: ${JSON.stringify(a.facets[0].steps)}, engine texts keys: ${JSON.stringify(Object.keys((st.texts.fr || {})['1'] || {}))}`);
  console.log('   packTranslationCoverage fr:', JSON.stringify(pack.packTranslationCoverage(p).find((c) => c.locale === 'fr')).slice(0, 200));
}
