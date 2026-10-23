'use strict';
const C = '/home/user/core';
const fs = require('fs');
const { renderHtmlReport } = require(C + '/src/report.js');
const { renderSarifReport } = require(C + '/src/sarif.js');
const { renderJunitReport } = require(C + '/src/junit.js');
const { renderEarlReport } = require(C + '/src/earl.js');
const B = require(C + '/src/baseline.js');
const Ajv = require(C + '/node_modules/ajv');
const { JSDOM } = require(C + '/node_modules/jsdom');
const schema = JSON.parse(fs.readFileSync(C + '/tests/schemas/sarif-schema-2.1.0.json', 'utf8'));
const ajv = new Ajv({ allErrors: true, schemaId: 'id', logger: false });
ajv.addMetaSchema(require(C + '/node_modules/ajv/lib/refs/json-schema-draft-04.json'));
const validate = ajv.compile(schema);
function sarifErrors(s) { const o = JSON.parse(s); return validate(o) ? [] : validate.errors.map(e => `${e.dataPath} ${e.message}`); }
function parseXml(xml) {
  const dom = new JSDOM('');
  const doc = new dom.window.DOMParser().parseFromString(xml, 'application/xml');
  const err = doc.getElementsByTagName('parsererror')[0];
  if (err) throw new Error('XML parse error: ' + err.textContent.slice(0, 300));
  return doc;
}
module.exports = { C, renderHtmlReport, renderSarifReport, renderJunitReport, renderEarlReport, B, sarifErrors, parseXml, validate };
