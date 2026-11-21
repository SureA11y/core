// checkStandardData, which returns a list of problems, throws RangeError on data with a cycle or deep nesting.
const P = require('/home/user/core-r8/src/pack.js');
const cyclic = { format: 'surea11y-standard/1', key: 'x' }; cyclic.self = cyclic;
const deep = { format: 'surea11y-standard/1', key: 'x' }; let c = deep; for (let i = 0; i < 20000; i++) { c.a = {}; c = c.a; }
for (const [k, d] of Object.entries({ cyclic, deep })) {
  try { console.log(k, P.checkStandardData(d)); } catch (e) { console.log(k, 'THROW', e.constructor.name, e.message); }
  try { P.standardFromData(d); } catch (e) { console.log(k, 'standardFromData', e.constructor.name, e.message.slice(0, 60)); }
}
