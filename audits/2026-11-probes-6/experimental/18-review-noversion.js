const { sd, base, pack, index } = require('./lib.js');
const R = 'aria-valid-attr-value', CODE = 'ARIA_HASPOPUP_ROLE_MISMATCH';
const d = base(); d.versions.push({ version: '2', wcagVersion: '2.2' }); d.data[2] = JSON.parse(JSON.stringify(d.data[1])); d.profiles['base-2'] = { version: '2', tags: ['base'], mappedRules: true };
const st = { ...sd.standardFromData(d),
  review: { [R]: { [CODE]: { steps: ['Open the popup.', 'Check its role.'], passWhen: 'It is a menu.', failWhen: 'It is not, which fails Base 4.1.' } } },
  reviewByVersion: { 2: { [R]: { [CODE]: { steps: ['Open the dialog.', 'Check its name.'], passWhen: 'It has a name.', failWhen: 'It has none, which fails Base 7.3.' } } } } };
const fr = { [`base_standardReview_${R}_${CODE}_step1`]: 'Ouvrez le menu.', [`base_standardReview_${R}_${CODE}_step2`]: 'Vérifiez son rôle.', [`base_standardReview_${R}_${CODE}_pass`]: 'C’est un menu.', [`base_standardReview_${R}_${CODE}_fail`]: 'Non, ce qui enfreint Base 4.1.' };
console.log('checkPack:', JSON.stringify(pack.checkPack({ name: 'p', version: '1.0.0', namespace: 'base', core: '~1.17.0', standard: st, dictionaries: { fr } })));
const p = pack.definePack({ name: 'p', version: '1.0.0', namespace: 'base', core: '~1.17.0', standard: st, dictionaries: { fr } });
for (const profile of ['base-1', 'base-2']) for (const loc of ['en', 'fr']) {
  const h = index.howToCheckFor(R, CODE, loc, { packs: [p], profile });
  console.log(`${profile} ${loc}: ${JSON.stringify(h.steps)} | fail: ${h.failWhen}`);
}
