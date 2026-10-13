'use strict';

/**
 * docs/BUILDING_ON_CORE.md shows tool builders code to copy, so its examples
 * have to keep working as core changes. Its `js` blocks run here in order, as
 * one script, with require('@surea11y/core') resolving to this package; a
 * block fenced `js browser` needs a page and a driver, and is left out. The
 * claims the examples make in their comments are checked on what they
 * computed, and every link in the guide must reach a file and a heading.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const ROOT = path.join(__dirname, '..');
const GUIDE = path.join(ROOT, 'docs', 'BUILDING_ON_CORE.md');
const text = fs.readFileSync(GUIDE, 'utf8');

// The code of every fenced block whose info string is exactly `js`.
function runnableBlocks(markdown) {
  const blocks = [];
  const fence = /^```([^\n]*)\n([\s\S]*?)^```$/gm;
  let m;
  while ((m = fence.exec(markdown))) {
    if (m[1].trim() === 'js') blocks.push(m[2]);
  }
  return blocks;
}

// Runs the blocks as one script and returns the named values it defined.
function runGuide(names) {
  // Resolved from the package's own folder, require('@surea11y/core') is
  // this package through its "exports", as it is for a tool that installs it.
  const requireFromPackage = createRequire(path.join(ROOT, 'package.json'));
  const body = runnableBlocks(text).join('\n;\n') + `\nreturn { ${names.join(', ')} };`;
  const { warn, info } = console;
  console.warn = () => {};
  console.info = () => {};
  try {
    return new Function('require', body)(requireFromPackage);
  } finally {
    console.warn = warn;
    console.info = info;
  }
}

test("the guide's examples run, and do what their comments say", () => {
  const blocks = runnableBlocks(text);
  assert.ok(blocks.length >= 7, `expected the guide's examples, found ${blocks.length}`);
  const got = runGuide([
    'record',
    'willRun',
    'willReport',
    'reported',
    'statuses',
    'sarif',
    'junit',
    'newCount',
    'knownCount',
    'staleCount',
    'closest',
    'skipped'
  ]);

  assert.equal(got.record.wcagVersion, '2.2');
  assert.equal(got.record.wcagLevel, 'AA');
  assert.equal(got.record.layout, false);

  assert.deepEqual(got.willRun.sort(), [
    'contrast-computable',
    'img-alt-present',
    'link-name-present'
  ]);
  assert.deepEqual(got.willReport, [
    'wcag-1.1.1-non-text-content',
    'wcag-1.4.3-contrast-minimum',
    'wcag-2.4.4-link-purpose-in-context',
    'wcag-4.1.2-name'
  ]);
  assert.deepEqual(got.reported, got.willReport);
  assert.equal(got.statuses['wcag-1.1.1-non-text-content'], 'fails');
  assert.match(
    got.statuses['wcag-1.4.3-contrast-minimum'],
    /^partly checked \(\d+ of \d+ checks\)$/
  );

  assert.equal(got.sarif.version, '2.1.0');
  assert.match(got.junit, /^<\?xml/);

  // The unnamed link was fixed, the unnamed button is new.
  assert.equal(got.newCount, 1);
  assert.equal(got.staleCount, 1);
  assert.ok(got.knownCount >= 1);

  // #767676 on white is 4.54:1, just over 4.5:1.
  const contrast = got.closest.find((m) => m.ruleId === 'contrast-minimum');
  assert.ok(contrast && contrast.value > 4.5 && contrast.value < 4.6);
  assert.deepEqual(
    got.skipped.map((s) => s.id),
    ['shop-cart-link']
  );
});

// GitHub's heading anchors: lower case, punctuation but hyphens dropped,
// spaces to hyphens.
function anchorOf(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

function anchorsIn(file) {
  const anchors = new Set();
  let inFence = false;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (line.startsWith('```')) inFence = !inFence;
    const m = !inFence && /^#{1,6}\s+(.*)$/.exec(line);
    if (m) anchors.add(anchorOf(m[1]));
  }
  return anchors;
}

test('every link in the guide reaches a file and a heading', () => {
  const links = [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]);
  const local = links.filter((l) => !/^https?:/.test(l));
  assert.ok(local.length > 20);
  const broken = [];
  for (const link of local) {
    const [file, anchor] = link.split('#');
    const target = file ? path.resolve(path.dirname(GUIDE), file) : GUIDE;
    if (!fs.existsSync(target)) {
      broken.push(`${link}: no such file`);
      continue;
    }
    if (anchor && !anchorsIn(target).has(anchor)) broken.push(`${link}: no such heading`);
  }
  assert.deepEqual(broken, []);
});
