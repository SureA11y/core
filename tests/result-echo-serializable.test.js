'use strict';

/**
 * Every result echoes the options it ran with (engineOptions). That echo has
 * to stay plain data, so a result can cross JSON.stringify and
 * structuredClone (postMessage to an extension or a worker): probes are
 * echoed as the capped copy rules read, and customRules as their ids.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>x</p></main></body></html>';

test('a result with function custom rules can be cloned, and echoes their ids', () => {
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [
        {
          id: ' acme-rule ',
          meta: { title: 'Acme' },
          runInPage() {
            return { outcome: 'pass', occurrences: [] };
          }
        },
        { runInPage: () => ({ outcome: 'pass', occurrences: [] }) }
      ]
    }
  });
  assert.doesNotThrow(() => structuredClone(result));
  for (const r of result.checksResults.concat(result.rulesResults)) {
    assert.deepEqual(r.engineOptions.customRules, [{ id: 'acme-rule' }], r.ruleId);
  }
});

test('probes are echoed as the capped copy rules read, so a circular one still serializes', () => {
  const crawl = { pages: [] };
  crawl.self = crawl;
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: { probes: { crawl, count: 10n, long: 'x'.repeat(5000) } }
  });
  assert.doesNotThrow(() => JSON.stringify(result));
  assert.doesNotThrow(() => structuredClone(result));
  const echoed = result.checksResults[0].engineOptions.probes;
  assert.ok(echoed.long.length <= 2001, 'strings capped as for rules');
  assert.notEqual(echoed.crawl, crawl, 'not the caller’s object');
});

test('options without probes or customRules echo neither', () => {
  const result = runa11yCoreOnHtml(HTML);
  const eo = result.checksResults[0].engineOptions;
  assert.ok(!('probes' in eo));
  assert.ok(!('customRules' in eo));
});
