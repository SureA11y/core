'use strict';
// Times a full scan of an HTML file in jsdom with per-rule timings.
// usage: node timeall.js <file.html> [indexJsPath]
const path = require('node:path');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const [file, idx] = process.argv.slice(2);
const core = require(idx || path.resolve(__dirname, '../../../src/index.js'));
console.warn = () => {};
const dom = new JSDOM(fs.readFileSync(file, 'utf8'), { url: 'https://example.test/', pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document;
const t0 = performance.now();
const r = core.runa11yCoreInPage('https://example.test/', null, { optInRules: 'all', perfStats: true, profileRules: true }, null);
const rt = (r.perfStats && r.perfStats.ruleTimings) || {};
console.log(Math.round(performance.now() - t0) + 'ms', Object.entries(rt).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => k + ':' + Math.round(v)).join(' '));
