const { sd, base, mkPack, pack, index } = require('./lib.js');
const tryIt = (label, fn) => { try { const r = fn(); console.log(label, '->', typeof r === 'string' ? r : JSON.stringify(r)); } catch (e) { console.log(label, '-> THROWS', e.message.slice(0, 400)); } };
const R = 'aria-valid-attr-value', CODE = 'ARIA_HASPOPUP_ROLE_MISMATCH';
const entry = (n, v) => ({ steps: Array.from({ length: n }, (_, i) => `Step ${i + 1} (v${v}).`), passWhen: `Pass v${v}.`, failWhen: `Fail v${v}.` });
const twoVersions = () => { const d = base(); d.versions.push({ version: '2', wcagVersion: '2.2' }); d.data[2] = JSON.parse(JSON.stringify(d.data[1])); d.profiles['base-2'] = { version: '2', tags: ['base'], mappedRules: true }; return d; };
// R1: standard from data: review per version only (reviewByVersion). Dictionary _standardReview_ keys refused.
const d = twoVersions(); d.data[1].review = { [R]: { [CODE]: entry(2, 1) } }; d.data[2].review = { [R]: { [CODE]: entry(3, 2) } };
const st = sd.standardFromData(d);
console.log('R1 st.review =', st.review, ' reviewByVersion versions =', Object.keys(st.reviewByVersion));
const frDict = (n) => Object.fromEntries([...Array.from({ length: n }, (_, i) => [`base_standardReview_${R}_${CODE}_step${i + 1}`, `Étape ${i + 1}.`]), [`base_standardReview_${R}_${CODE}_pass`, 'Oui.'], [`base_standardReview_${R}_${CODE}_fail`, 'Non.']]);
tryIt('R1 checkPack with fr dict for the 3-step v2 entry', () => pack.checkPack({ name: 'p', version: '1.0.0', namespace: 'base', core: '~1.17.0', standard: st, dictionaries: { fr: frDict(3) } }));
tryIt('R1 definePack with it', () => { mkPack(st, { dictionaries: { fr: frDict(3) } }); return 'ok'; });
// R2: hand-written standard: review (2 steps) + reviewByVersion v2 (3 steps): one versionless key set can't fit both
const st2 = { ...sd.standardFromData(twoVersions()), review: { [R]: { [CODE]: entry(2, 1) } }, reviewByVersion: { 2: { [R]: { [CODE]: entry(3, 2) } } } };
tryIt('R2 checkPack fr dict with 3 steps', () => pack.checkPack({ name: 'p', version: '1.0.0', namespace: 'base', core: '~1.17.0', standard: st2, dictionaries: { fr: frDict(3) } }));
tryIt('R2 checkPack fr dict with 2 steps', () => pack.checkPack({ name: 'p', version: '1.0.0', namespace: 'base', core: '~1.17.0', standard: st2, dictionaries: { fr: frDict(2) } }));
const p2 = pack.definePack({ name: 'p', version: '1.0.0', namespace: 'base', core: '~1.17.0', standard: st2, dictionaries: { fr: frDict(2) } });
for (const profile of ['base-1', 'base-2']) {
  const h = index.howToCheckFor(R, CODE, 'fr', { packs: [p2], profile });
  console.log(`R2 howToCheckFor fr ${profile}:`, JSON.stringify(h && h.steps), h && h.passWhen);
}
// R3: lang 'fr' data, review written in French (as the data format says its texts are in `lang`), English given in texts.en
const d3 = base(); d3.lang = 'fr'; d3.data[1].review = { [R]: { [CODE]: { steps: ['Ouvrez la fenêtre.'], passWhen: 'C’est un menu.', failWhen: 'Ce n’en est pas un.' } } };
d3.data[1].texts = { en: { [`review.${R}.${CODE}.steps`]: ['Open the popup.'], [`review.${R}.${CODE}.passWhen`]: 'It is a menu.', [`review.${R}.${CODE}.failWhen`]: 'It is not.' } };
console.log('R3 checkStandardData:', JSON.stringify(sd.checkStandardData(d3)));
const p3 = mkPack(sd.standardFromData(d3));
for (const loc of ['en', 'fr', 'de']) {
  const h = index.howToCheckFor(R, CODE, loc, { packs: [p3], profile: 'base-1' });
  console.log(`R3 howToCheckFor ${loc}:`, JSON.stringify(h && h.steps), '| lang:', h && (h.lang || h.stepsLang || ''));
}
