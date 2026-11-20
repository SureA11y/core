'use strict';

/**
 * The integrator's API: what the seventh stress test found (IF-1 to IF-7 on
 * audit/register). Outcomes that follow their occurrences in every scan and
 * every reporter, sorting that doesn't depend on the machine's locale, an
 * unreadable pack skipped rather than thrown, and a pack scanned on its own
 * giving its verdicts.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('../src/testing.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderJunitReport } = require('../src/junit.js');
const { renderEarlReport } = require('../src/earl.js');
const { buildBaselineEntries } = require('../src/baseline.js');
const { checkPack, describePacks, definePack, ruleMappedStandard } = require('../src/pack.js');
const { getChecksCatalog } = require('../src/index.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p id="a">a</p><p id="b">b</p></main></body></html>';

// A custom rule that returns `outcome` with occurrences of these tiers.
function rule(outcome, tiers) {
  return {
    id: 'org-x',
    meta: { title: 'T', description: 'd', tags: ['wcag111', 'wcag2a'], wcagSc: ['1.1.1'] },
    runInPage: new Function(
      'ctx',
      `return { outcome: ${JSON.stringify(outcome)}, occurrences: ${JSON.stringify(tiers)}.map((tier, i) => ({ __node: ctx.document.getElementById('ab'[i]), summary: 's' + i, hint: 'h', occurrenceOutcome: tier, data: { details: { reasonCode: 'R' + i } } })) };`
    )
  };
}
const scan = (outcome, tiers) =>
  runa11yCoreOnHtml(HTML, {
    engineOptions: { customRules: [rule(outcome, tiers)] },
    runOnly: ['org-x']
  });

test('the outcome is the worst of its occurrences, in the scan and every reporter (IF-1)', () => {
  for (const [outcome, tiers, want] of [
    ['fail', ['pass', 'pass'], 'pass'],
    ['fail', ['pass', 'cantTell'], 'cantTell'],
    ['pass', ['cantTell'], 'cantTell'],
    ['cantTell', ['pass'], 'pass'],
    ['notApplicable', ['fail'], 'fail']
  ]) {
    const r = scan(outcome, tiers);
    const label = `${outcome} ${JSON.stringify(tiers)}`;
    assert.equal(r.checksResults[0].outcome, want, label);
    const failed = want === 'fail';
    const earlFailed = /earl:failed/.test(JSON.stringify(renderEarlReport(r)));
    const sarifErrors = JSON.parse(renderSarifReport(r)).runs[0].results.filter(
      (x) => x.level === 'error'
    ).length;
    const junitFailures = (renderJunitReport(r).match(/<failure/g) || []).length;
    assert.equal(earlFailed, failed, `${label}: EARL`);
    assert.equal(sarifErrors > 0, failed, `${label}: SARIF`);
    assert.equal(junitFailures > 0, failed, `${label}: JUnit`);
    assert.equal(buildBaselineEntries(r).length > 0, failed, `${label}: baseline`);
  }
});

test('a pack that throws while read is a problem, skipped, not a crash (IF-5)', () => {
  const pack = { name: 'acme-pack', version: '1.0.0', namespace: 'acme', core: '>=1.10.0' };
  Object.defineProperty(pack, 'rules', {
    enumerable: true,
    get() {
      throw new Error('boom');
    }
  });
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert.deepEqual(checkPack(pack), ["acme-pack can't be read: boom"]);
    assert.deepEqual(describePacks([pack])[0].problems, ["acme-pack can't be read: boom"]);
    const r = runa11yCoreOnHtml(HTML, { engineOptions: { packs: [pack] } });
    assert.equal(r.skippedPacks[0].name, 'acme-pack');
    assert.ok(getChecksCatalog({ packs: [pack] }).length > 100);
    // A Proxy whose traps throw, too.
    const proxy = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error('PACK_OWNKEYS');
        }
      }
    );
    assert.equal(describePacks([proxy])[0].problems.length, 1);
  } finally {
    console.warn = warn;
  }
});

test('a pack scanned on its own fails what it states for certain (IF-7)', () => {
  const { mappingsFor, composites, validate } = ruleMappedStandard({
    standard: 'AW',
    tag: 'aw',
    versions: [{ version: '1.0', wcagVersion: '2.2' }],
    requirements: { '1.0': { NR: { title: 'Name required', wcagSc: [] } } },
    ruleMap: {
      '1.0': {
        'aria-role-name-present': {
          requirements: ['NR'],
          reasonCodes: { name_missing: { outcome: 'fail' } }
        }
      }
    }
  });
  const pack = definePack({
    name: 'aw-pack',
    version: '1.0.0',
    namespace: 'aw',
    core: '>=1.15.0',
    standard: {
      key: 'aw',
      standard: 'AW',
      versions: ['1.0'],
      ruleTag: 'aw',
      ruleMapped: true,
      mappingsFor,
      composites,
      validate,
      profiles: {
        'aw-1.0': {
          version: '1.0',
          tags: [],
          rules: ['aria-role-name-present'],
          mappedRules: true
        }
      }
    }
  });
  const page =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>h</h1><div role="grid"></div></main></body></html>';
  for (const profile of ['aw-1.0', ['aw-1.0'], ['aw-1.0', 'wcag20-a']]) {
    const r = runa11yCoreOnHtml(page, { engineOptions: { packs: [pack], profile } });
    const c = r.checksResults.find((x) => x.ruleId === 'aria-role-name-present');
    assert.equal(c.outcome, 'fail', JSON.stringify(profile));
    assert.ok(buildBaselineEntries(r).length > 0, JSON.stringify(profile));
  }
});

test('output is sorted the same under any locale (IF-4)', () => {
  // The JUnit report of the same scan, rendered under Czech and English.
  const script = `
    const { runa11yCoreOnHtml } = require(${JSON.stringify(path.join(__dirname, '..', 'src', 'testing.js'))});
    const { renderJunitReport } = require(${JSON.stringify(path.join(__dirname, '..', 'src', 'junit.js'))});
    const r = runa11yCoreOnHtml('<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>h</h1><div role="checkbox" aria-checked="x"></div><div aria-hidden="true"><button>b</button></div></main></body></html>');
    process.stdout.write(renderJunitReport(r).replace(/time="[^"]*"|timestamp="[^"]*"/g, ''));
  `;
  const render = (lang) =>
    execFileSync(process.execPath, ['-e', script], {
      env: { ...process.env, LANG: lang, LC_ALL: lang },
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024
    });
  assert.equal(render('cs_CZ.UTF-8'), render('en_US.UTF-8'));
});
