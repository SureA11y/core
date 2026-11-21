// A pack whose `name` (or `standard`) always throws when read: skipped (skippedPacks) or a crash?
const { checkPack, describePacks } = require('/home/user/core-r8/src/pack.js');
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1></main></body></html>';
for (const prop of ['name', 'standard', 'version', 'core', 'namespace']) {
  const pack = { name: 'thrower', version: '1.0.0', namespace: 'th', core: '*', rules: [] };
  Object.defineProperty(pack, prop, { get() { throw new Error('boom ' + prop); }, enumerable: true });
  const out = [];
  try { out.push('checkPack: ' + JSON.stringify(checkPack(pack)).slice(0, 70)); } catch (e) { out.push('checkPack THROWS ' + e.message); }
  try { out.push('describePacks: ' + JSON.stringify(describePacks([pack])).slice(0, 70)); } catch (e) { out.push('describePacks THROWS ' + e.message); }
  const w = console.warn; console.warn = () => {};
  try { const r = runa11yCoreOnHtml(html, { runOnly: ['page-has-heading-one'], engineOptions: { packs: [pack] } }); out.push('scan ok skippedPacks=' + String(JSON.stringify(r.skippedPacks || r.engine.skippedPacks)).slice(0, 80)); } catch (e) { out.push('scan THROWS ' + e.message.slice(0, 80) + '\n      ' + e.stack.split('\n').slice(1, 5).map(s => s.trim()).join(' < ')); }
  console.warn = w;
  console.log('== ' + prop + '\n   ' + out.join('\n   '));
}
