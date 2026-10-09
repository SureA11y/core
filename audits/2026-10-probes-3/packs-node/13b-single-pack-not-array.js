'use strict';
// packs given a single pack object instead of a list.
const { scan, quiet, base, rule, outcome, report, main } = require('./lib.js');
const p = base({ name: 'single', namespace: 'single', rules: [rule('single-a', { runInPage: () => ({ outcome: 'fail' }) })] });
const x = quiet(() => scan({ packs: p }));
report('packs: pack (not in a list)', x.error ? 'THROWS ' + x.error.message : { ran: outcome(x.r, 'single-a'), enginePacks: x.r.engine.packs, skipped: x.r.skippedPacks, warnings: x.warnings });
const y = quiet(() => main.getChecksCatalog({ packs: p }));
report('getChecksCatalog({ packs: pack })', y.error ? 'THROWS ' + y.error.message : { hasRule: y.r.some((d) => d.ruleId === 'single-a'), warnings: y.warnings });
