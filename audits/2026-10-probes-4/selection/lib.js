'use strict';
const path = require('path');
const fs = require('fs');
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
const packApi = require('/home/user/core/src/pack.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<h1>H</h1><h3>skip</h3>' +
  '<img src="a.png"><a href="/x"></a><a href="/y">Home</a><div id="a"></div><div id="a"></div>' +
  '<p style="color:#767676;background:#fff">Grey text</p>' +
  '<input type="text"><button></button><label>N <input type="text" autocomplete="name"></label>' +
  '<map name="m"><area href="/z" shape="rect" coords="0,0,1,1"></map>' +
  '<table><tr><th>h</th></tr><tr><td>d</td></tr></table>' +
  '<div role="button">x</div><div aria-hidden="true"><a href="/q">q</a></div>' +
  '<iframe src="about:blank"></iframe><svg role="img"></svg>' +
  '</main></body></html>';

function capture(fn) {
  const { warn, info } = console;
  const warned = [], infos = [];
  console.warn = (...a) => warned.push(a.join(' '));
  console.info = (...a) => infos.push(a.join(' '));
  try {
    return { value: fn(), warned, infos };
  } catch (e) {
    return { error: e, warned, infos };
  } finally {
    console.warn = warn; console.info = info;
  }
}

function scan(runOnly, engineOptions = {}, html = PAGE) {
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    return capture(() => core.runDomRulesInPage('https://example.test/', null, engineOptions, runOnly));
  } finally {
    dom.window.close();
    delete global.window; delete global.document;
  }
}

// A custom rule
const custom = (id, meta, outcome = 'fail') => ({
  id,
  meta: { title: id, description: id, ...meta },
  runInPage: `function (ctx) { return { ruleId: ctx.rule.ruleId, outcome: '${outcome}', occurrences: [] }; }`
});

const samplePack = require('/home/user/core/tests/fixtures/packs/sample.js');

// A pack with a mappedRules-only profile, a checklist and a waiving profile.
const SP = '/home/user/core/tests/fixtures/profiles/sample';
const { VERSIONS, REQUIREMENTS } = require(path.join(SP, 'requirements'));
const { RULE_REQUIREMENTS } = require(path.join(SP, 'rule-map'));
function makeStdPack() {
  const { mappingsFor, composites, validate, wcagTagsOf } = packApi.ruleMappedStandard({
    standard: 'Probe Standard', tag: 'probe', versions: VERSIONS, requirements: REQUIREMENTS,
    ruleMap: Object.fromEntries(Object.entries(RULE_REQUIREMENTS).map(([v, rows]) => [v, Object.fromEntries(Object.entries(rows).map(([k, r]) => [k.replace(/^sample-/, 'probe-'), r]))]))
  });
  const rulesDir = path.join(SP, 'rules', 'automatic');
  const rules = fs.readdirSync(rulesDir).filter((f) => f.endsWith('.js')).sort().map((f) => require(path.join(rulesDir, f)));
  return { mappingsFor, composites, validate, wcagTagsOf, rules };
}
module.exports = { core, packApi, scan, capture, custom, samplePack, PAGE, JSDOM };
