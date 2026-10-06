const Ajv = require('/home/user/core/node_modules/ajv');
const fs = require('fs');
const schema = JSON.parse(fs.readFileSync(__dirname + '/sarif-schema.json', 'utf8'));
const ajv = new Ajv({ allErrors: true, schemaId: 'auto', format: 'full' });
ajv.addMetaSchema(require('/home/user/core/node_modules/ajv/lib/refs/json-schema-draft-04.json'));
const validateSarif = ajv.compile(schema);
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
function parseXml(s) {
  const d = new JSDOM('').window;
  const doc = new d.DOMParser().parseFromString(s, 'application/xml');
  const err = doc.getElementsByTagName('parsererror')[0];
  if (err) throw new Error('XML parse error: ' + err.textContent.slice(0, 300));
  return doc;
}
module.exports = { validateSarif, parseXml };
