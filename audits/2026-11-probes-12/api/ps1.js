'use strict';
const H = require('./h.js'); const { packScript, ruleMappedStandard } = H.pack;
function pack(code) {
  const std = ruleMappedStandard({ standard: 'Names', tag: 'nm', versions: [{ version: '1.0', wcagVersion: '2.2' }], requirements: { '1.0': { N1: { title: 'Named', wcagSc: ['1.1.1'] } } }, ruleMap: { '1.0': { 'nm-rule': { requirements: ['N1'] } } } });
  const fn = new Function('return function (ctx) { var s = \'' + code + '\'; return { outcome: "pass", occurrences: [] }; }')();
  return { name: 'nm-pack', version: '1.0.0', namespace: 'nm', core: '*', rules: [{ id: 'nm-rule', meta: { title: 'T', description: 'd', tags: ['nm'] }, runInPage: fn }],
    standard: { key: 'nm', standard: 'Names', versions: ['1.0'], profiles: { 'nm-1.0': { version: '1.0', tags: ['nm'], mappedRules: true } }, ruleTag: 'nm', ruleMapped: true, mappingsFor: std.mappingsFor, composites: std.composites, validate: std.validate } };
}
const out = {};
for (const [n, code] of Object.entries({ A: '<!-- <!--> <script>', B: '<!--<script>-->', C: '<!-- <script>', D: '<!-- <SCRIPT\t', F: '<!-- <script/', E: '<!-- <!--> <script> </script> -->' })) {
  try { const s = packScript([pack(code)]); out[n] = s; console.log(n, JSON.stringify(code), 'accepted'); } catch (e) { console.log(n, JSON.stringify(code), 'REFUSED', e.message.slice(0, 90)); }
}
// Check in HTML parsing (parse5 via jsdom) whether each code inline leaves the script open
const { JSDOM } = require('/home/user/r12-api/node_modules/jsdom');
for (const [n, code] of Object.entries({ A: '<!-- <!--> <script>', B: '<!--<script>-->', C: '<!-- <script>' })) {
  const d = new JSDOM(`<script>var s = ${JSON.stringify(code)};</script><p id="after">after</p>`);
  console.log('parse', n, 'p after script parsed as element:', !!d.window.document.getElementById('after'));
}
