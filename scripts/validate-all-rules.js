'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

const dirs = process.argv.slice(2);
if (!dirs.length) {
  console.error('Usage: node validate-all-rules.js <dir> [<dir> ...]');
  process.exit(1);
}

const files = dirs.flatMap(walk).sort();

// validate-rule.js only reads and asserts -- no writes, no child processes of
// its own -- so the rules are independent and the only shared resource is the
// CPU. One process per rule is what makes this slow; run a pool of them.
const limit = Math.max(1, Math.min(os.cpus().length, 8, files.length));

const results = new Array(files.length);
let next = 0;
let printed = 0;
let failures = 0;

// Output stays in file order however the pool interleaves: a result is held
// until every earlier one has been printed.
function flush() {
  while (printed < files.length && results[printed]) {
    process.stdout.write(`\n=== Validating: ${files[printed]} ===\n`);
    process.stdout.write(results[printed].out);
    printed += 1;
  }
}

function runOne(index) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(__dirname, 'validate-rule.js'), files[index]]);
    let out = '';
    child.stdout.on('data', (chunk) => (out += chunk));
    child.stderr.on('data', (chunk) => (out += chunk));
    child.on('error', (err) => {
      results[index] = { out: out + String(err && err.message) + '\n', status: 1 };
      failures += 1;
      flush();
      resolve();
    });
    child.on('close', (status) => {
      if (results[index]) return; // already settled by 'error'
      results[index] = { out, status };
      if (status !== 0) failures += 1;
      flush();
      resolve();
    });
  });
}

async function main() {
  const workers = Array.from({ length: limit }, async () => {
    for (let index = next++; index < files.length; index = next++) {
      await runOne(index);
    }
  });
  await Promise.all(workers);
  flush();

  if (failures) {
    const failed = files.filter((_, i) => results[i] && results[i].status !== 0);
    console.error(`\n${failures} of ${files.length} rule(s) failed validation:`);
    for (const f of failed) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(`\n${files.length} rule(s) validated across ${limit} parallel workers.`);
}

main();
