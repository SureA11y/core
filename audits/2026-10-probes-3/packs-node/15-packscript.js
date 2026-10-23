'use strict';
// packScript writes each pack rule's runInPage into a script as source. Does
// the script parse for the function shapes JavaScript allows?
const vm = require('vm');
const { base, packApi, report } = require('./lib.js');
const helper = { named(ctx) { return { outcome: 'pass' }; } };
const shapes = {
  method: { runInPage(ctx) { return { outcome: 'pass' }; } }.runInPage,
  asyncMethod: { async runInPage(ctx) { return { outcome: 'pass' }; } }.runInPage,
  arrow: (ctx) => ({ outcome: 'pass' }),
  arrowDestructured: ({ document }) => ({ outcome: 'pass' }),
  arrowDefaultWithCall: (ctx, o = String(1)) => ({ outcome: 'pass' }),
  arrowDefaultWithParenInString: (ctx, s = ')') => ({ outcome: 'pass' }),
  functionExpr: function (ctx) { return { outcome: 'pass' }; },
  borrowedMethod: helper.named,
  bound: function (ctx) { return { outcome: 'pass' }; }.bind(null),
  stringKeyMethod: { 'run-it'(ctx) { return { outcome: 'pass' }; } }['run-it'],
  getterlike: Object.getOwnPropertyDescriptor({ get g() { return 1; } }, 'g').get,
  commentFirst: /* c */ (ctx) => ({ outcome: 'pass' }),
  generator: { *runInPage(ctx) { yield 1; } }.runInPage
};
for (const [name, fn] of Object.entries(shapes)) {
  let script;
  try {
    script = packApi.packScript([base({ name: `ps-${name}`, rules: [{ id: 'p-a', meta: { title: 't' }, runInPage: fn }] })]);
  } catch (e) { report(name, 'packScript THROWS ' + e.message.slice(0, 200)); continue; }
  try {
    const ctx = vm.createContext({});
    new vm.Script(script).runInContext(ctx);
    const reg = ctx.__surea11yPacks;
    const k = Object.keys(reg)[0];
    const impl = reg[k].impls['p-a'];
    report(name, `parses; impl.run is ${typeof impl.run}${impl.run && impl.run.toString().includes('native code') ? ' (native code: rule body lost)' : ''}`);
  } catch (e) { report(name, 'GENERATED SCRIPT FAILS: ' + e.constructor.name + ': ' + e.message); }
}
