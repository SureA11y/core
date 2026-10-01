'use strict';

/**
 * Build and test the engine with profiles that are not built in.
 *
 * The built-in profiles are the ones profiles/index.js lists, and that list
 * ships. A profile that must not ship (a test profile such as
 * examples/profiles/acme) is composed in a copy of the repository instead:
 * this script copies the working tree to a temporary folder, adds the given
 * profiles to the copy's profiles/index.js, builds the engine there, and
 * runs, there:
 *
 * - the rule validators, over every rules folder, the extra profiles' too;
 * - tests/profile-boundary.test.js, which holds every profile to the contract;
 * - each extra profile's own tests (<profile>/tests/**);
 * - with --full, the whole suite as well, to show the extra profiles change
 *   nothing for core and the built-in profiles.
 *
 * The repository itself is never written to: src/core.js and the bundles stay
 * as committed. This is the "build-time composition" way to add a profile,
 * tried on a test profile (examples/profiles/acme/DESIGN.md).
 *
 * Usage:
 *   node scripts/test-extra-profiles.js <profile-dir>... [--full] [--keep]
 *   npm run test:extra-profiles
 *
 * --keep leaves the copy in place and prints where it is.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');

function parseArgs(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const profiles = argv.filter((a) => !a.startsWith('--'));
  return { profiles, full: flags.has('--full'), keep: flags.has('--keep') };
}

// Every file git would commit: tracked ones and new ones not ignored.
function workingTreeFiles() {
  return execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  })
    .split('\0')
    .filter(Boolean)
    .filter((f) => fs.existsSync(path.join(ROOT_DIR, f)));
}

function copyWorkingTree(dest) {
  for (const file of workingTreeFiles()) {
    const to = path.join(dest, file);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(ROOT_DIR, file), to);
  }
  fs.symlinkSync(path.join(ROOT_DIR, 'node_modules'), path.join(dest, 'node_modules'), 'dir');
}

// Append the extra profiles to the copy's list, after the built-in ones.
function addProfiles(workspace, profileDirs) {
  const indexFile = path.join(workspace, 'profiles', 'index.js');
  const lines = profileDirs.map((dir) => {
    const rel = path.relative(path.dirname(indexFile), path.join(workspace, dir));
    return `module.exports.push(require(${JSON.stringify(rel.split(path.sep).join('/'))}));`;
  });
  fs.appendFileSync(
    indexFile,
    `\n// Added by scripts/test-extra-profiles.js, in this copy only.\n${lines.join('\n')}\n`
  );
}

function testFilesIn(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? testFilesIn(path.join(dir, e.name))
        : e.name.endsWith('.test.js')
          ? [path.join(dir, e.name)]
          : []
    )
    .sort();
}

function run(label, cmd, args, cwd) {
  console.log(`[extra-profiles] ${label}`);
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${label} failed (exit ${result.status === null ? 'signal' : result.status})`);
  }
}

function main() {
  const { profiles, full, keep } = parseArgs(process.argv.slice(2));
  if (!profiles.length) {
    console.error('Usage: node scripts/test-extra-profiles.js <profile-dir>... [--full] [--keep]');
    process.exitCode = 2;
    return;
  }
  for (const dir of profiles) {
    if (!fs.existsSync(path.join(ROOT_DIR, dir, 'index.js'))) {
      console.error(`[extra-profiles] ${dir} has no index.js`);
      process.exitCode = 2;
      return;
    }
  }

  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'surea11y-extra-profiles-'));
  let failed = false;
  try {
    copyWorkingTree(workspace);
    addProfiles(workspace, profiles);
    const node = process.execPath;
    run('build the engine', node, ['scripts/build-core.js'], workspace);
    run('build the browser bundle', node, ['scripts/build-browser.js'], workspace);
    run('validate every rule', node, ['scripts/validate-all-rules.js'], workspace);
    const tests = ['tests/profile-boundary.test.js'].concat(
      profiles.flatMap((dir) => testFilesIn(path.join(workspace, dir, 'tests')))
    );
    run('test the extra profiles', node, ['--test', ...tests], workspace);
    if (full) run('run the whole suite', node, ['scripts/run-tests.js'], workspace);
  } catch (e) {
    failed = true;
    console.error(`[extra-profiles] ${e.message}`);
  } finally {
    if (keep || failed) console.log(`[extra-profiles] the copy is at ${workspace}`);
    else fs.rmSync(workspace, { recursive: true, force: true });
  }
  if (failed) process.exitCode = 1;
}

main();
