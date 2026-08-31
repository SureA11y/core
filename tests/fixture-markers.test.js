'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'generate-fixture-markers.js');
const RECORD = path.join(ROOT, 'scripts', 'data', 'fixture-markers.json');

const committed = JSON.parse(fs.readFileSync(RECORD, 'utf8')).disagreements;

test('no fixture marker disagrees with the engine beyond the recorded set', () => {
  try {
    execFileSync(process.execPath, [SCRIPT, '--check'], { cwd: ROOT, stdio: 'pipe' });
  } catch (err) {
    assert.fail(String(err.stderr || err.stdout || err.message).trim());
  }
});

test('every recorded disagreement is a real disagreement', () => {
  const seen = new Set();
  for (const entry of committed) {
    const key = `${entry.ruleId} ${entry.caseId}`;
    assert.ok(!seen.has(key), `${key} is recorded twice`);
    seen.add(key);

    assert.ok(entry.ruleId && entry.caseId, key);
    assert.notEqual(entry.marked, entry.engine, `${key} records matching outcomes`);
    assert.ok(entry.label, `${key} has no label`);
  }
});

test('a recorded case names an outcome the engine can report', () => {
  const outcomes = new Set(['fail', 'cantTell', 'pass', 'notApplicable', 'other']);
  for (const entry of committed) {
    assert.ok(outcomes.has(entry.marked), `${entry.ruleId} ${entry.caseId}: ${entry.marked}`);
    assert.ok(
      entry.engine === 'notFlagged' || outcomes.has(entry.engine),
      `${entry.ruleId} ${entry.caseId}: ${entry.engine}`
    );
  }
});
