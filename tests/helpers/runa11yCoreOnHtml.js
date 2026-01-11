'use strict';

const { runa11yCoreOnHtml, createDom, runa11yCoreOnDom } = require('./runDomRulesOnHtml');

// Support BOTH styles:
//   const runa11yCoreOnHtml = require('./helpers/runa11yCoreOnHtml');
//   const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
module.exports = runa11yCoreOnHtml;

// Named exports remain available too:
module.exports.runa11yCoreOnHtml = runa11yCoreOnHtml;
module.exports.createDom = createDom;
module.exports.runa11yCoreOnDom = runa11yCoreOnDom;
