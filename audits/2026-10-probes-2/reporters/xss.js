const { renderHtmlReport } = require('/home/user/core/src/report.js');
const fs = require('fs');
const P = (n) => `"'><img src=x onerror=window.__x.push(${n})></script><script>window.__x.push('s${n}')</script>\`\${1}{{x}}`;
const r = JSON.parse(fs.readFileSync(__dirname + '/result.en.json', 'utf8'));
let n = 0;
r.url = 'javascript:alert(1)' + P(n++);
r.title = P(n++);
r.engine.tag = P(n++); r.engine.schemaVersion = P(n++); r.engine.wcagVersion = P(n++); r.engine.profile = P(n++);
r.engine.optInRules = [P(n++)];
r.engine.environment = { layout: true, viewport: { width: 1, height: 2 }, colorScheme: P(n++), fonts: 'loading', devicePixelRatio: 2 };
r.engine.locale = { requested: P(n++), resolved: 'en' };
for (const c of r.checksResults) {
  c.ruleId = c.ruleId + P(n++); c.title = P(n++); c.severity = P(n++);
  for (const m of c.meta.normativeMappings || []) { m.requirement = m.requirement + P(n++); }
  for (const o of c.occurrences || []) { o.selector = P(n++); o.html = P(n++); o.summary = P(n++); o.hint = P(n++); }
}
for (const c of r.rulesResults) { c.title = P(n++); c.ruleId += P(n++); if (c.data && c.data.details) c.data.details.checksIds = [P(n++)]; for (const m of c.meta.normativeMappings || []) m.requirement += P(n++); }
fs.writeFileSync(__dirname + '/xss.html', renderHtmlReport(r, { title: P(n++) }));
console.log('payloads', n);
