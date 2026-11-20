'use strict';
const C = '/home/user/core';
const pack = require(C + '/src/pack.js');
const sd = require(C + '/src/standard-data.js');
const { deriveStandard } = require(C + '/src/derive-standard.js');
const index = require(C + '/src/index.js');
const Ajv = require(C + '/node_modules/ajv');
const schema = require(C + '/src/schemas/standard.schema.json');
const validate = new Ajv({ allErrors: true }).compile(schema);
const copy = (v) => JSON.parse(JSON.stringify(v));
const TILDE = '~1.17.0';
function base(over = {}) {
  return {
    format: 'surea11y-standard/1', key: 'base', standard: 'Base', lang: 'en',
    versions: [{ version: '1', wcagVersion: '2.2' }],
    data: { 1: {
      requirements: { A: { title: 'Images', wcagSc: ['1.1.1'] }, B: { title: 'Forms', wcagSc: ['3.3.2'] } },
      ruleMap: { 'img-alt-present': { requirements: ['A'] }, 'form-control-programmatic-label-present': { requirements: ['B'] } }
    } },
    profiles: { 'base-1': { version: '1', tags: ['base'], mappedRules: true } },
    ...over
  };
}
function schemaOk(d) { const ok = validate(d); return ok ? [] : validate.errors.map((e) => `${e.instancePath} ${e.message}`); }
function both(label, d) {
  const s = schemaOk(d); const c = sd.checkStandardData(d);
  console.log(`${label}: schema ${s.length ? 'REJECTS' : 'accepts'} | checkStandardData ${c.length ? 'REJECTS' : 'accepts'}${(s.length > 0) !== (c.length > 0) ? '   <-- DISAGREE' : ''}`);
  if (s.length) console.log('   schema:', s.slice(0, 3).join(' / '));
  if (c.length) console.log('   check :', c.slice(0, 3).join(' / '));
}
function mkPack(standard, extra = {}) {
  return pack.definePack({ name: 'p-' + standard.key, version: '1.0.0', namespace: standard.key, core: TILDE, standard, ...extra });
}
const { runa11yCoreOnHtml } = require(C + '/tests/helpers/runDomRulesOnHtml.js');
module.exports = { C, pack, sd, deriveStandard, index, validate, schemaOk, both, copy, base, TILDE, mkPack, runa11yCoreOnHtml };
