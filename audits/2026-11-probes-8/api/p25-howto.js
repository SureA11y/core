const core = require('/home/user/core-r8/src/index.js');
const { JSDOM } = require('/home/user/core-r8/node_modules/jsdom');
console.warn = () => {};
const rc = ['click-handler-keyboard-operable', 'CLICK_HANDLER_NO_KEY_HANDLER'];
for (const loc of [undefined, 'en', 'de', 'DE', 'de-AT', 'ja', 'fr-CA', 'zz', '__proto__', 'constructor', 5, '', ['ja']]) {
  let x; try { x = core.howToCheckFor(rc[0], rc[1], loc); x = x ? x.steps[0].slice(0, 50) : x; } catch (e) { x = 'THROW ' + e.message.slice(0, 80); }
  console.log('howToCheckFor', JSON.stringify(loc), x);
}
for (const args of [['CLICK-HANDLER-KEYBOARD-OPERABLE', rc[1]], [rc[0], 'click_handler_no_key_handler'], ['__proto__', 'x'], [rc[0], '__proto__'], [rc[0], 'constructor'], ['constructor', 'constructor'], [null, null], ['a11ycore-' + rc[0], rc[1]]]) {
  let x; try { x = JSON.stringify(core.howToCheckFor(...args)); } catch (e) { x = 'THROW ' + e.message.slice(0, 80); }
  console.log('args', JSON.stringify(args), (x || '').slice(0, 80));
}
// values filling with hostile
const hv = core.howToCheckFor(rc[0], rc[1], 'en', { values: { element: '<script>', __proto__: { x: 1 } } });
console.log('values', JSON.stringify(hv).slice(0, 300));
// addHowToCheck with locales on a real result
const dom = new JSDOM('<html lang="en"><head><title>t</title></head><body><main><div role="button" tabindex="0" onclick="1">x</div></main></body></html>');
global.window = dom.window; global.document = dom.window.document;
const r = core.runDomRulesInPage(null, null, { locale: 'ja' }, null);
const occ = r.checksResults.find(c => c.ruleId === rc[0]).occurrences[0];
console.log('scan ja step', occ.howToCheck && occ.howToCheck.steps[0].slice(0, 40));
for (const loc of ['de', ['zz', 'fr'], 'FR', '__proto__', 5, {}]) {
  let x; try { const r2 = core.addHowToCheck(r, { locale: loc }); x = r2.checksResults.find(c => c.ruleId === rc[0]).occurrences[0].howToCheck.steps[0].slice(0, 40); } catch (e) { x = 'THROW ' + e.message.slice(0, 80); }
  console.log('addHowToCheck', JSON.stringify(loc), x);
}
