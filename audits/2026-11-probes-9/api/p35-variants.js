const { checkPack } = require('@surea11y/core/pack');
const base = require('./gen/acme-a11y/rules/automatic/acme-contrast-enhanced.js');
console.log(JSON.stringify({ id: base.id, from: base.from, config: base.config }));
const mk = (config, from='contrast-minimum') => ({ name: 'zz-pack', version: '1.0.0', namespace: 'zz', core: '>=1.0.0', rules: [{ ...base, id: 'zz-v', from, config, meta: { ...base.meta, i18n: undefined, tags: ['zz'] } }] });
for (const [label, config, from] of [
  ['ok', { normalTextRatio: 7 }], ['ratio 0', { normalTextRatio: 0 }], ['ratio -1', { largeTextRatio: -1 }], ['ratio string', { normalTextRatio: '7' }], ['ratio NaN', { normalTextRatio: NaN }], ['ratio Infinity', { normalTextRatio: Infinity }],
  ['logoText Ask', { logoText: 'Ask' }], ['logoText bogus', { logoText: 'skip' }], ['unknown setting', { normalTextRatios: 7 }], ['boldLargeMinPx null', { boldLargeMinPx: null }], ['boldLargeMinPx 0', { boldLargeMinPx: 0 }],
  ['config null', null], ['config array', [1]], ['from unknown', {}, 'no-such-rule'], ['from rule with no settings', {}, 'img-alt-present'], ['setting on wrong rule', { minSizePx: 44 }],
  ['target minSizePx 44', { minSizePx: 44 }, 'target-size-minimum'], ['valid-lang codes ISO639', { codes: 'ISO639' }, 'valid-lang'], ['ratio 1e9', { normalTextRatio: 1e9 }], ['ratio 0.5', { normalTextRatio: 0.5 }]]) {
  let p; try { p = checkPack(mk(config, from)); } catch (e) { p = ['THROWS ' + e.message]; }
  console.log(label.padEnd(28), p.length ? p.join(' ; ').slice(0, 220) : 'OK');
}
