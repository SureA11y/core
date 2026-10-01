'use strict';

/**
 * scripts/profile-new.js: what `npm run profile:new` writes, run against a
 * temporary copy of the files it reads, so the repository is never touched.
 * That the result builds and passes its tests in the real repository is
 * checked by hand when the template changes (profiles/README.md).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createProfile } = require('../scripts/profile-new.js');
const { PROFILE_EXPORTS } = require('../scripts/lib/profile-contract');

const ROOT = path.join(__dirname, '..');

// A root with what the script reads: profiles/index.js and core's locales.
function makeRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'surea11y-profile-new-'));
  fs.mkdirSync(path.join(root, 'profiles'));
  fs.copyFileSync(path.join(ROOT, 'profiles', 'index.js'), path.join(root, 'profiles', 'index.js'));
  fs.mkdirSync(path.join(root, 'src', 'i18n'), { recursive: true });
  for (const locale of ['en', 'fr']) {
    fs.writeFileSync(path.join(root, 'src', 'i18n', `${locale}.json`), '{}\n');
  }
  // The real list requires ./rgaa; give the copy a stand-in.
  fs.mkdirSync(path.join(root, 'profiles', 'rgaa'));
  fs.writeFileSync(
    path.join(root, 'profiles', 'rgaa', 'index.js'),
    "module.exports = { standard: { key: 'rgaa' } };\n"
  );
  return root;
}

test('it writes a complete profile and adds it to profiles/index.js', async () => {
  const root = makeRoot();
  await createProfile({ key: 'acme-std', name: 'ACME Standard', root });
  const dir = path.join(root, 'profiles', 'acme-std');
  for (const file of [
    'index.js',
    'requirements.js',
    'rule-map.js',
    'mappings.js',
    'README.md',
    'tests/entry.test.js',
    'rules/automatic/.gitkeep',
    'rules/manual/.gitkeep',
    'i18n/en.json',
    'i18n/fr.json'
  ]) {
    assert.ok(fs.existsSync(path.join(dir, file)), file);
  }
  const list = require(path.join(root, 'profiles', 'index.js'));
  assert.deepEqual(
    list.map((p) => p.standard.key),
    ['rgaa', 'acme-std']
  );
});

test('the profile it writes meets the contract and is an empty, sound standard', async () => {
  const root = makeRoot();
  await createProfile({ key: 'acme-std', name: 'ACME Standard', root });
  const dir = path.join(root, 'profiles', 'acme-std');
  const profile = require(dir);

  assert.deepEqual(Object.keys(profile).sort(), [...PROFILE_EXPORTS].sort());
  assert.equal(profile.rulesDir, path.join(dir, 'rules'));
  assert.equal(profile.i18nDir, path.join(dir, 'i18n'));

  const { standard } = profile;
  assert.equal(standard.key, 'acme-std');
  assert.equal(standard.standard, 'ACME Standard');
  assert.equal(standard.ruleTag, 'acme-std');
  assert.deepEqual(standard.versions, ['1.0']);
  assert.deepEqual(Object.keys(standard.profiles), ['acme-std-1.0']);
  assert.ok(standard.profiles['acme-std-1.0'].tags.includes('acme-std'));
  assert.deepEqual(standard.validate([{ ruleId: 'img-alt-present', wcagSc: ['1.1.1'] }]), []);
  assert.deepEqual(standard.composites(), []);
  assert.deepEqual(standard.mappingsFor({ id: 'img-alt-present', wcagSc: ['1.1.1'] }), []);

  const en = JSON.parse(fs.readFileSync(path.join(dir, 'i18n', 'en.json'), 'utf8'));
  assert.deepEqual(Object.keys(en), [standard.report.noteKey]);
  assert.equal(standard.report.noteKey, 'report_acmeStdRollup_note');
});

test('its tables turn into entries, rollups and build checks', async () => {
  const root = makeRoot();
  await createProfile({ key: 'acme-std', name: 'ACME Standard', root });
  const dir = path.join(root, 'profiles', 'acme-std');
  const fill = (file, from, to) => {
    const p = path.join(dir, file);
    fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(from, to));
  };
  fill(
    'requirements.js',
    "'1.0': {}",
    "'1.0': { '1.10': { title: 'Ten', wcagSc: ['1.1.1'] }, '1.2': { title: 'Two', wcagSc: [] } }"
  );
  fill(
    'rule-map.js',
    "'1.0': {}",
    "'1.0': { a: { requirements: ['1.10', '1.2'] }, b: { requirements: ['1.2'] } }"
  );
  const { standard } = require(dir);

  assert.deepEqual(
    standard.mappingsFor({ id: 'a' }).map((m) => m.requirement),
    ['1.2', '1.10'],
    'natural order'
  );
  assert.deepEqual(standard.mappingsFor({ id: 'a' })[1], {
    standard: 'ACME Standard',
    version: '1.0',
    requirement: '1.10',
    title: 'Ten',
    wcagSc: ['1.1.1']
  });
  assert.deepEqual(
    standard.composites().map((c) => [c.id, c.checksIds, c.meta.tags]),
    [
      ['acme-std-1.0-1.2', ['a', 'b'], ['acme-std']],
      ['acme-std-1.0-1.10', ['a'], ['acme-std']]
    ]
  );
  assert.deepEqual(standard.validate([{ ruleId: 'a' }, { ruleId: 'b' }]), []);
  assert.deepEqual(standard.validate([{ ruleId: 'a' }]), ['1.0 b: no such rule']);
});

test('it refuses a bad, reserved or existing key, and writes nothing', async () => {
  const root = makeRoot();
  const before = fs.readFileSync(path.join(root, 'profiles', 'index.js'), 'utf8');
  for (const key of ['', 'Acme', '1acme', 'acme_std', 'wcag22', 'en301549', 'rgaa']) {
    await assert.rejects(() => createProfile({ key, root }), undefined, key);
  }
  assert.equal(fs.readFileSync(path.join(root, 'profiles', 'index.js'), 'utf8'), before);
  assert.deepEqual(fs.readdirSync(path.join(root, 'profiles')).sort(), ['index.js', 'rgaa']);
});
