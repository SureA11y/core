'use strict';
// A checklist's namespace becomes an opt-in rule tag. Namespaces equal to
// tags core rules carry ('aria', 'automatic', 'images', ...) are accepted by
// checkPack: what happens to core's rules in a plain scan with such a pack?
const { scan, quiet, report, main } = require('./lib.js');

const coreIds = (r) => r.checksResults.map((c) => c.ruleId);
const plain = scan({});
const plain22 = scan({ profile: 'wcag22-aa' });
for (const ns of ['aria', 'automatic', 'images', 'best-practice', 'atomic', 'manual', 'structure']) {
  const pack = {
    name: `@x/${ns}`,
    version: '1.0.0',
    namespace: ns,
    core: '*',
    profiles: { [`${ns}-p`]: { tags: ['wcag2a'] } },
    rollups: [{ id: `${ns}-r`, title: 'R', checksIds: ['region'] }]
  };
  const { r, error, warnings } = quiet(() => scan({ packs: [pack] }));
  if (error) { report(ns, 'THROWS ' + error.message); continue; }
  const { r: r22 } = quiet(() => scan({ packs: [pack], profile: 'wcag22-aa' }));
  const lost = coreIds(plain).filter((id) => !coreIds(r).includes(id));
  const lost22 = coreIds(plain22).filter((id) => !coreIds(r22).includes(id));
  report(`namespace "${ns}" (checklist)`, {
    packs: r.engine.packs,
    skipped: r.skippedPacks && r.skippedPacks.map((s) => s.reason.slice(0, 160) + ` ...(${s.reason.length} chars)`),
    warnings: warnings.length,
    defaultScan: `${coreIds(plain).length} -> ${coreIds(r).length} rules (lost ${lost.length}: ${lost.slice(0, 6).join(', ')}...)`,
    wcag22aaScan: `${coreIds(plain22).length} -> ${coreIds(r22).length} rules (lost ${lost22.length})`
  });
}
