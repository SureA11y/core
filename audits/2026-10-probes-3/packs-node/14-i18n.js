'use strict';
// Packs and messages: a locale only the pack has, a pack without the
// locale, sublocales, engineOptions.messages over a pack key, placeholders.
const { scan, quiet, base, report } = require('./lib.js');
const R = { id: 'p-a', meta: { title: 'English title', description: 'd', i18n: { titleKey: 'pA_title', descriptionKey: 'pA_description' } },
  runInPage: (ctx) => ({ outcome: 'fail', occurrences: [ctx.helpers.reportOccurrence(ctx.document.body, { summary: 'S {name}', i18n: { summaryKey: 'pA_summary', params: { name: 'N<b>' } } })] }) };
const mk = (dictionaries) => base({ rules: [R], dictionaries });
const show = (label, pack, opts) => {
  const { r, error } = quiet(() => scan({ packs: [pack], ...opts }));
  if (error) return report(label, 'THROWS ' + error.message);
  const c = r.checksResults.find((x) => x.ruleId === 'p-a');
  const core = r.checksResults.find((x) => x.ruleId === 'img-alt-present');
  report(label, { locale: r.engine.locale, skipped: r.skippedPacks, title: c && c.title, summary: c && c.occurrences[0].summary, coreTitle: core.title });
};
const en = { pA_title: 'Pack title EN', pA_description: 'D', pA_summary: 'Summary {name}' };
show('locale pt only in pack', mk({ en, pt: { pA_title: 'Título' } }), { locale: 'pt' });
show('locale fr, pack has en only', mk({ en }), { locale: 'fr' });
show('locale fr, pack has fr partial', mk({ en, fr: { pA_title: 'Titre' } }), { locale: 'fr' });
show('locale en-GB in pack, requested en-GB', mk({ en, 'en-GB': { pA_title: 'Colour title' } }), { locale: 'en-GB' });
show('locale de-AT requested, pack has de', mk({ en, de: { pA_title: 'Titel' } }), { locale: 'de-AT' });
show('messages override a pack key', mk({ en }), { messages: { en: { pA_title: 'From messages' } } });
show('pack without en, only fr; locale en', mk({ fr: { pA_title: 'Titre' } }), {});
show('pack en key empty string', mk({ en: { ...en, pA_title: '' } }), {});
// core key shadowing via a new locale: pack defines core keys for a locale core lacks
show('pack defines a core key for a locale core lacks (pt)', mk({ en, pt: { imgAltPresent_title: 'Imagem', img_altPresent_title: 'Imagem' } }), { locale: 'pt' });
