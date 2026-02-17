'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

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

const targetDir = process.argv[2];
if (!targetDir) {
    console.error('Usage: node validate-all-checks.js <dir>');
    process.exit(1);
}

const files = walk(targetDir);

for (const file of files) {
    console.log(`\n=== Validating: ${file} ===`);
    const res = spawnSync(
        'node',
        ['scripts/validate-rule.js', file],
        { stdio: 'inherit' }
    );
    if (res.status !== 0) process.exit(res.status);
}
