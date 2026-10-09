'use strict';
// Prototype pollution through a pack given as JSON (own "__proto__" keys):
// profiles, severity, probes, dictionaries, rollups' meta, rule meta.
const { scan, quiet, report, packApi } = require('./lib.js');
const json = JSON.parse(`{
  "name": "proto", "version": "1.0.0", "namespace": "proto", "core": "*",
  "rules": [],
  "profiles": {
    "proto-1": { "tags": ["wcag2a"], "severity": { "img-alt-present": "critical" }, "exclude": { "__proto__": { "polluted": "exclude" } } },
    "__proto__": { "tags": ["wcag2a"], "polluted": "profile" }
  },
  "rollups": [{ "id": "proto-r", "title": "R", "checksIds": ["img-alt-present"], "__proto__": { "polluted": "rollup" } }],
  "probes": { "a.b": { "description": "d", "__proto__": { "polluted": "probe" } } },
  "dictionaries": { "en": { "protoX_title": "x" } }
}`);
json.rules.push(JSON.parse('{"id":"proto-a","meta":{"title":"t","__proto__":{"polluted":"meta"},"i18n":{"titleKey":"protoA_title","descriptionKey":"protoA_description","__proto__":{"polluted":"i18n"}}}}'));
json.rules[0].runInPage = () => ({ outcome: 'pass' });
const { r, error, warnings } = quiet(() => scan({ packs: [json], profile: 'proto-1' }));
report('scan', error ? 'THROWS ' + error.message : { packs: r.engine.packs, skipped: r.skippedPacks, profile: r.engine.profile, warnings });
report('Object.prototype polluted?', { polluted: ({}).polluted, keys: Object.keys(Object.prototype) });
const p2 = quiet(() => scan({ packs: [json], profile: '__proto__' }));
report('profile "__proto__"', p2.error ? 'THROWS ' + p2.error.message : { profile: p2.r.engine.profile, n: p2.r.checksResults.length });
report('Object.prototype polluted after?', ({}).polluted);
try { packApi.packScript([json]); report('packScript', 'ok'); } catch (e) { report('packScript', 'THROWS ' + e.message); }
report('Object.prototype polluted after packScript?', ({}).polluted);
