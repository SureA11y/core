'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { readExamples, toPage } = require('../../scripts/generate-rule-examples-outcomes.js');

test('readExamples reads each labelled example, and the outcome its label claims', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ex-')), 'RULE_EXAMPLES.md');
  fs.writeFileSync(
    file,
    [
      '# Examples',
      '',
      '## rule-a',
      '',
      '**Passed**',
      '```html',
      '<p>a</p>',
      '```',
      'Why.',
      '',
      '**Failed (in a browser)**',
      '```html',
      '<p>b</p>',
      '```',
      '',
      '## rule-b',
      '',
      '**Flagged (cantTell)**',
      '```html',
      '<p>c</p>',
      '```',
      '',
      '**Something else**',
      '```html',
      '<p>d</p>',
      '```',
      ''
    ].join('\n')
  );
  assert.deepEqual(
    readExamples(file).map((e) => [e.ruleId, e.label, e.expected]),
    [
      ['rule-a', 'Passed', 'pass'],
      ['rule-a', 'Failed (in a browser)', 'fail'],
      ['rule-b', 'Flagged (cantTell)', 'cantTell'],
      ['rule-b', 'Something else', null]
    ]
  );
});

test('toPage puts leading title, style, meta and link in the head, and adds a title only when missing', () => {
  const withTitle = toPage('<title>Home</title>\n<p>x</p>');
  assert.match(withTitle, /<head>.*<title>Home<\/title>.*<\/head><body>\n?<p>x<\/p><\/body>/s);
  assert.equal(withTitle.match(/<title>/g).length, 1);

  const withStyle = toPage('<style>a{outline:none}</style>\n<a href="/">A</a>');
  assert.match(
    withStyle,
    /<head>.*<title>Example page<\/title><style>a\{outline:none\}<\/style>.*<\/head>/s
  );
  assert.match(withStyle, /<body>\s*<a href="\/">A<\/a><\/body>/);

  assert.match(
    toPage('<body><main>m</main></body>'),
    /<\/head><body><main>m<\/main><\/body><\/html>$/
  );
  const full = '<!doctype html><html><head><title>t</title></head><body></body></html>';
  assert.equal(toPage(full), full);
});
