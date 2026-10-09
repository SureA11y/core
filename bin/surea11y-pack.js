#!/usr/bin/env node
/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Tools for a pack's own repository (see ENGINE_OPTIONS.md, "Packs"):
 *
 *   surea11y-pack new <folder> [--name <package name>] [--namespace <ns>]
 *   surea11y-pack docs [--check] [--no-examples] [--pack <file>]
 *
 * new writes a pack to start from into a new folder (src/pack-scaffold.js):
 * one rule, its messages, test and examples, lint and scripts. The package
 * name is the folder's by default, and the namespace its scope or first word.
 *
 * docs writes the pack's docs/RULE_CATALOG.md and the records of its
 * docs/RULE_EXAMPLES.md (src/pack-docs.js); --check writes nothing and exits
 * 1 when one is stale; --no-examples doesn't run the examples in Chromium.
 * The pack is the module --pack names, or the folder's package.json main.
 */

const path = require('node:path');

const USAGE = `Usage:
  surea11y-pack new <folder> [--name <package name>] [--namespace <ns>]
  surea11y-pack docs [--check] [--no-examples] [--pack <file>]`;

function parseArgs(argv) {
  const out = { command: argv[0], flags: new Set(), values: {}, positional: [] };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (['--pack', '--name', '--namespace'].includes(a)) out.values[a.slice(2)] = argv[++i];
    else if (a.startsWith('--')) out.flags.add(a);
    else out.positional.push(a);
  }
  return out;
}

function create(args) {
  const { scaffoldPack } = require('../src/pack-scaffold.js');
  const folder = args.positional[0];
  if (!folder) {
    console.error(USAGE);
    return 1;
  }
  let written;
  try {
    written = scaffoldPack(folder, { name: args.values.name, namespace: args.values.namespace });
  } catch (err) {
    console.error(`[surea11y-pack] ${err.message}`);
    return 1;
  }
  for (const file of written) console.log(`[surea11y-pack] wrote ${path.join(folder, file)}`);
  console.log(`\nNext: cd ${folder} && npm install && npm test`);
  return 0;
}

async function docs(args) {
  const { packDocs } = require('../src/pack-docs.js');
  const root = process.cwd();
  const pack = require(path.resolve(root, args.values.pack || '.'));
  const check = args.flags.has('--check');
  const { written, problems } = await packDocs(pack, {
    root,
    check,
    examples: !args.flags.has('--no-examples')
  });
  for (const file of written) console.log(`[surea11y-pack] wrote ${file}`);
  if (problems.length) {
    console.error(`[surea11y-pack] ${problems.join('\n')}`);
    return 1;
  }
  if (check) console.log('[surea11y-pack] docs are up to date.');
  return 0;
}

async function main(argv) {
  const args = parseArgs(argv);
  if (args.command === 'new') return create(args);
  if (args.command === 'docs') return docs(args);
  console.error(USAGE);
  return args.command === undefined || args.command === '--help' ? 0 : 1;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
);
