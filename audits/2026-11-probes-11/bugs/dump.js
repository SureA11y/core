const r = JSON.parse(require('fs').readFileSync(process.argv[2]));
const skip = new Set((process.argv[3]||'').split(','));
for (const c of r.checksResults) { if (['pass','notApplicable'].includes(c.outcome) || skip.has(c.ruleId)) continue;
  console.log(c.ruleId, c.outcome, (c.occurrences||[]).length);
  for (const o of (c.occurrences||[]).slice(0,6)) console.log('    ', (o.selector||'').slice(-60), '|', o.data&&o.data.details&&o.data.details.reasonCode, '|', o.lean&&o.lean.toward, '|', (o.summary||'').slice(0,170));
}
