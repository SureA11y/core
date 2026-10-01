'use strict';

/**
 * A copy of the engine with the sample profile built in
 * (tests/fixtures/profiles/sample), for the tests of what profiles do: opt-in
 * rules, a standard's rollups and mappings, variants, ctx.standard,
 * exclusions and a profile's own languages. The shipped engine is built from
 * profiles/index.js alone; this one is built in a temporary copy of the
 * repository whose profiles/index.js lists the sample profile, so the sample
 * never reaches src/core.js.
 *
 * scripts/run-tests.js builds it once per run and passes its folder in
 * SUREA11Y_SAMPLE_ENGINE; a test file run on its own builds its own copy.
 * Load what a test needs from it with requireSample('src/index.js'),
 * requireSample('tests/helpers/runDomRulesOnHtml.js') and so on: the copy's
 * modules use the copy's engine and registry.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..', '..');
const SAMPLE = path.join(ROOT, 'tests', 'fixtures', 'profiles', 'sample');

function buildSampleEngine(dest = fs.mkdtempSync(path.join(os.tmpdir(), 'surea11y-sample-'))) {
  for (const dir of ['src', 'scripts', path.join('tests', 'helpers')]) {
    fs.cpSync(path.join(ROOT, dir), path.join(dest, dir), { recursive: true });
  }
  fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(dest, 'package.json'));
  fs.mkdirSync(path.join(dest, 'profiles'), { recursive: true });
  fs.writeFileSync(
    path.join(dest, 'profiles', 'index.js'),
    "'use strict';\n\nmodule.exports = [require('./sample')];\n"
  );
  fs.cpSync(SAMPLE, path.join(dest, 'profiles', 'sample'), { recursive: true });
  const modules = path.join(dest, 'node_modules');
  if (!fs.existsSync(modules)) fs.symlinkSync(path.join(ROOT, 'node_modules'), modules, 'dir');
  execFileSync(process.execPath, [path.join(dest, 'scripts', 'build-core.js')], {
    cwd: dest,
    stdio: 'pipe'
  });
  return dest;
}

let root = null;

// The folder of the built copy, building it on first use.
function sampleRoot() {
  if (root) return root;
  const given = process.env.SUREA11Y_SAMPLE_ENGINE;
  root = given && fs.existsSync(path.join(given, 'src', 'core.js')) ? given : buildSampleEngine();
  return root;
}

const requireSample = (rel) => require(path.join(sampleRoot(), rel));

module.exports = { buildSampleEngine, sampleRoot, requireSample };
