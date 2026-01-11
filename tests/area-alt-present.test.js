'use strict';

const test = require('node:test');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

test('area-alt-present: no image map areas => notApplicable', () => {
  const html = `<!doctype html><html><body><img usemap="#m" alt="x"></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-area-alt-present', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test('area-alt-present: missing alt => fail', () => {
  const html = `
    <!doctype html><html><body>
      <img src="x.png" usemap="#m" alt="Map">
      <map name="m">
        <area href="/dest" coords="0,0,10,10">
      </map>
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-area-alt-present', 'fail', {
    minOccurrences: 1
  });
});

test('area-alt-present: non-empty alt => pass', () => {
  const html = `
    <!doctype html><html><body>
      <img src="x.png" usemap="#m" alt="Map">
      <map name="m">
        <area href="/dest" alt="Go to destination" coords="0,0,10,10">
      </map>
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-area-alt-present', 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});
