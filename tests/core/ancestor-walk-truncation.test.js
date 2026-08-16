'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../helpers/runa11yCoreOnHtml');

// Ancestor walks stop after 200 steps so a malformed or cyclic tree cannot
// hang a scan. Past that depth the walk cannot prove an element is exposed,
// and asserting a violation on content that may be hidden is the one outcome
// this engine must not produce.
const SHELL = '<!doctype html><html lang="en"><head><title>t</title></head><body>';
const CONTENT = '<img src="x.png"><button></button><input type="text">';

function scan(depth, wrapperAttrs) {
  const body =
    `<div ${wrapperAttrs}>` + '<div>'.repeat(depth) + CONTENT + '</div>'.repeat(depth) + '</div>';
  const result = runa11yCoreOnHtml(SHELL + body + '</body></html>', {
    engineOptions: { perfStats: true }
  });

  const outcomeOf = (ruleId) => {
    const rule = result.checksResults.find((r) => r.ruleId === ruleId);
    return rule ? rule.outcome : 'absent';
  };

  return {
    outcomeOf,
    truncations: result.perfStats.counters['ancestorsIncludingSelf.truncated'] || 0
  };
}

test('a fail resting only on out-of-reach elements becomes cantTell', () => {
  const shallow = scan(10, 'aria-hidden="true"');
  const deep = scan(250, 'aria-hidden="true"');

  assert.equal(shallow.truncations, 0, 'a shallow tree walks to the root');
  assert.ok(deep.truncations > 0, 'a deep tree exhausts the walk budget');

  assert.equal(shallow.outcomeOf('img-alt-present'), 'notApplicable', 'hidden content is skipped');
  assert.equal(
    deep.outcomeOf('img-alt-present'),
    'cantTell',
    'past the limit the engine cannot prove the content is exposed, so it must not assert a fail'
  );
});

test('depth alone does not suppress a finding', () => {
  const deep = scan(250, '');

  assert.equal(
    deep.outcomeOf('img-alt-present'),
    'cantTell',
    'still reported, just without the certainty a fail claims'
  );
});

test('a certain occurrence alongside an uncertain one keeps the fail', () => {
  const body =
    '<img src="x.png">' + '<div>'.repeat(250) + '<img src="x.png">' + '</div>'.repeat(250);
  const result = runa11yCoreOnHtml(SHELL + body + '</body></html>', {});

  assert.equal(
    result.checksResults.find((r) => r.ruleId === 'img-alt-present').outcome,
    'fail',
    'one element the walk reached is enough to justify the fail'
  );
});

test('an exhausted walk is counted so it is not silent', () => {
  assert.equal(scan(10, '').truncations, 0);
  assert.ok(scan(400, '').truncations > 0);
});

// Only rules that report their element can be downgraded: the engine has no
// way to tell whether a hand-built occurrence sits on a reachable element.
test('the downgrade reaches rules that report their element', () => {
  const deep = scan(250, 'aria-hidden="true"');

  assert.equal(deep.outcomeOf('img-alt-present'), 'cantTell');
  assert.equal(
    deep.outcomeOf('button-name-present'),
    'fail',
    'button-name-present builds occurrences by hand, so it is still out of reach of the downgrade'
  );
});
