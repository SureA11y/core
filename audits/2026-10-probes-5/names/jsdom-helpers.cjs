// The engine's dom-helpers on a jsdom document, for name/role questions.
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const { createDomHelpers } = require('/home/user/core/src/core/dom-helpers.js');
module.exports = function withHelpers(html, fn) {
  const { window } = new JSDOM(html, { pretendToBeVisual: true });
  const prevW = global.window, prevD = global.document;
  global.window = window; global.document = window.document;
  try { return fn(createDomHelpers({ window, document: window.document, root: window.document }), window.document); }
  finally { global.window = prevW; global.document = prevD; }
};
