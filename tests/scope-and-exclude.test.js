'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

test('contextSelector scopes evaluation to a subtree', () => {
  const html = `
    <!doctype html>
    <html><body>
      <section id="outside">
        <img src="x.png">
      </section>

      <section id="inside">
        <img src="y.png" alt="">
      </section>
    </body></html>
  `;

  // If contextSelector works, only #inside is scanned, so img-alt-attr-present should PASS
  // because the only img in scope has alt (even empty counts as present).
  const result = runa11yCoreOnHtml(html, { contextSelector: '#inside' });

  assertRule(result, 'a11yCore-img-alt-attr-present', 'pass', { maxOccurrences: 0 });
});

test('excludeSelectors skips elements inside excluded subtrees', () => {
  const html = `
    <!doctype html>
    <html><body>
      <div id="excluded">
        <img src="x.png">
      </div>
      <div id="included">
        <img src="y.png" alt="">
      </div>
    </body></html>
  `;

  // Excluding #excluded should remove the failing <img> from consideration.
  const result = runa11yCoreOnHtml(html, { excludeSelectors: ['#excluded'] });

  assertRule(result, 'a11yCore-img-alt-attr-present', 'pass', { maxOccurrences: 0 });
});

test('excludeSelectors + contextSelector: exclusions still apply within context', () => {
  const html = `
    <!doctype html>
    <html><body>
      <main id="app">
        <div class="modal">
          <img src="x.png">
        </div>
        <div class="content">
          <img src="y.png" alt="">
        </div>
      </main>
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html, {
    contextSelector: '#app',
    excludeSelectors: ['.modal']
  });

  assertRule(result, 'a11yCore-img-alt-attr-present', 'pass', { maxOccurrences: 0 });
});

test('excludeSelectors accepts comma-separated string selectors', () => {
  const html = `
    <!doctype html>
    <html><body>
      <div id="excluded">
        <img src="x.png">
      </div>
      <div class="also-excluded">
        <img src="z.png">
      </div>
      <div id="included">
        <img src="y.png" alt="">
      </div>
    </body></html>
  `;

  // String form should behave like ['#excluded', '.also-excluded']
  const result = runa11yCoreOnHtml(html, {
    excludeSelectors: '#excluded, .also-excluded'
  });

  assertRule(result, 'a11yCore-img-alt-attr-present', 'pass', { maxOccurrences: 0 });
});
