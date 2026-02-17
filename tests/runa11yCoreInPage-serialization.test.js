'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const { runa11yCoreInPage } = require('../src/core.js'); // or ../src/index.js

test('runa11yCoreInPage can be serialized and run in a page realm (no free vars)', () => {
    assert.equal(typeof runa11yCoreInPage, 'function');

    // IMPORTANT: runScripts enables an actual VM context for the window realm.
    const dom = new JSDOM(
        '<!doctype html><html><head><title>T</title></head><body><img src="x"></body></html>',
        { url: 'https://example.test/', runScripts: 'dangerously' }
    );

    const ctx = dom.getInternalVMContext();

    // Simulate page.evaluate serialization: recreate the function from its source in the page realm.
    const src = runa11yCoreInPage.toString();
    const reconstructed = vm.runInContext(`(${src})`, ctx);

    // Execute like your app does
    const result = reconstructed(
        null,
        null,
        { includeShadowDom: false, excludeSelectors: [] },
        null
    );

    assert.ok(result);
    assert.equal(result.url, 'https://example.test/');
    assert.equal(result.title, 'T');
    assert.ok(Array.isArray(result.checksResults));
});
