'use strict';

/**
 * HOOK_REASON_CODES lists the reason codes each opt-in hook decides or
 * changes (docs/BINDING_AUTHORS_GUIDE.md, "What each hook changes"). It is
 * held to the rules here: every entry names a code its rule's header lists,
 * every rule that reads a hook's record has an entry under that hook, and
 * the guide's table lists the same entries.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { HOOK_REASON_CODES } = require('../src/index.js');

const ROOT = path.join(__dirname, '..');
const RULES = new Map(); // ruleId -> source
for (const dir of ['automatic', 'manual']) {
  for (const f of fs.readdirSync(path.join(ROOT, 'src/checks', dir))) {
    if (!f.endsWith('.js')) continue;
    const file = path.join(ROOT, 'src/checks', dir, f);
    RULES.set(require(file).id, fs.readFileSync(file, 'utf8'));
  }
}
const HOOKS = ['internals', 'listener', 'liveRegion'];
// What in a rule's source reads each hook's record.
const READS = {
  internals: /helpers\.internalsQuestion\(|`(?:name|state)_internals` \(/,
  listener: /helpers\.getEventListenerInfo\b/,
  liveRegion: /helpers\.getLiveRegionRecord\b/
};

test('HOOK_REASON_CODES is frozen all the way down', () => {
  assert.deepEqual(Object.keys(HOOK_REASON_CODES), HOOKS);
  assert.ok(Object.isFrozen(HOOK_REASON_CODES));
  for (const hook of HOOKS) {
    assert.ok(Object.isFrozen(HOOK_REASON_CODES[hook]), hook);
    for (const e of HOOK_REASON_CODES[hook]) assert.ok(Object.isFrozen(e), e.reasonCode);
  }
});

test('every entry names a reason code its rule’s header lists, once', () => {
  for (const hook of HOOKS) {
    const seen = new Set();
    for (const { ruleId, reasonCode, effect } of HOOK_REASON_CODES[hook]) {
      const where = `${hook}: ${ruleId} ${reasonCode}`;
      assert.ok(RULES.has(ruleId), `${where}: no such rule`);
      assert.ok(['reports', 'decides', 'leans'].includes(effect), `${where}: ${effect}`);
      assert.match(RULES.get(ruleId), new RegExp(`^ \\* {3}- \`${reasonCode}\` \\(`, 'm'), where);
      assert.ok(!seen.has(ruleId + reasonCode), `${where} twice`);
      seen.add(ruleId + reasonCode);
    }
  }
});

test('every rule that reads a hook’s record has an entry under that hook', () => {
  for (const hook of HOOKS) {
    const listed = new Set(HOOK_REASON_CODES[hook].map((e) => e.ruleId));
    const reading = [...RULES].filter(([, src]) => READS[hook].test(src)).map(([id]) => id);
    assert.ok(reading.length > 0, hook);
    assert.deepEqual(
      reading.filter((id) => !listed.has(id)),
      [],
      `${hook}: rules that read the hook's record`
    );
    assert.deepEqual(
      [...listed].filter((id) => !reading.includes(id)),
      [],
      `${hook}: listed rules that don't read it`
    );
  }
});

test('the binding authors’ guide lists every entry', () => {
  const guide = fs.readFileSync(path.join(ROOT, 'docs/BINDING_AUTHORS_GUIDE.md'), 'utf8');
  const section = guide.slice(guide.indexOf('### What each hook changes'));
  for (const hook of HOOKS) {
    for (const { ruleId, reasonCode, effect } of HOOK_REASON_CODES[hook]) {
      const row = section
        .split('\n')
        .find((l) => l.includes(`\`${reasonCode}\``) && l.includes(`\`${ruleId}\``));
      assert.ok(row || reasonCode === 'name_internals', `${ruleId} ${reasonCode} not in the table`);
      if (row) assert.ok(row.includes(effect), `${ruleId} ${reasonCode}: ${effect}`);
    }
  }
  // name_internals is one row naming its twenty rules.
  const nameRow = section.split('\n').find((l) => l.includes('`name_internals`'));
  for (const { ruleId, reasonCode } of HOOK_REASON_CODES.internals) {
    if (reasonCode === 'name_internals') assert.ok(nameRow.includes(`\`${ruleId}\``), ruleId);
  }
});
