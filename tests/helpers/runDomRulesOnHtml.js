'use strict';

const { JSDOM } = require('jsdom');
const { runa11yCoreInPage } = require('../../src/index.js');

function normalizeEngineOptions(opts = {}) {
    const engineOptions = { ...(opts.engineOptions || {}) };

    // Allow top-level convenience options used by tests
    if (opts.excludeSelectors !== undefined && engineOptions.excludeSelectors === undefined) {
        engineOptions.excludeSelectors = opts.excludeSelectors;
    }
    if (opts.includeShadowDom !== undefined && engineOptions.includeShadowDom === undefined) {
        engineOptions.includeShadowDom = opts.includeShadowDom;
    }
    if (opts.rules !== undefined && engineOptions.rules === undefined) {
        engineOptions.rules = opts.rules;
    }

    return engineOptions;
}

/**
 * Backwards-compatible helper:
 * - Creates a fresh JSDOM per call
 * - Sets global.window/global.document
 * - Runs rules immediately
 */
function runa11yCoreOnHtml(
    html,
    {
        url = 'https://example.test/',
        contextSelector = null,
        engineOptions = {},
        runOnly = null,

        // top-level conveniences (tests may pass these)
        excludeSelectors,
        includeShadowDom,
        rules
    } = {}
) {
    const dom = new JSDOM(html, {
        url,
        contentType: 'text/html',
        pretendToBeVisual: true
    });

    global.window = dom.window;
    global.document = dom.window.document;

    const normalizedEngineOptions = normalizeEngineOptions({
        engineOptions,
        excludeSelectors,
        includeShadowDom,
        rules
    });

    return runa11yCoreInPage(url, contextSelector, normalizedEngineOptions, runOnly);
}

/**
 * New helper: build a DOM and return it so tests can mutate it (e.g., attachShadow)
 * before running rules.
 */
function createDom(
    html,
    {
        url = 'https://example.test/',
        contentType = 'text/html'
    } = {}
) {
    return new JSDOM(html, {
        url,
        contentType,
        pretendToBeVisual: true
    });
}

/**
 * New helper: run rules on an existing JSDOM instance (supports Shadow DOM mutations).
 */
function runa11yCoreOnDom(
    dom,
    {
        url = 'https://example.test/',
        contextSelector = null,
        engineOptions = {},
        runOnly = null,

        // top-level conveniences (tests may pass these)
        excludeSelectors,
        includeShadowDom,
        rules
    } = {}
) {
    if (!dom || !dom.window || !dom.window.document) {
        throw new Error('runa11yCoreOnDom(dom, ...) requires a JSDOM instance.');
    }

    global.window = dom.window;
    global.document = dom.window.document;

    const normalizedEngineOptions = normalizeEngineOptions({
        engineOptions,
        excludeSelectors,
        includeShadowDom,
        rules
    });

    return runa11yCoreInPage(url, contextSelector, normalizedEngineOptions, runOnly);
}

module.exports = runa11yCoreOnHtml;
module.exports.runa11yCoreOnHtml = runa11yCoreOnHtml;
module.exports.createDom = createDom;
module.exports.runa11yCoreOnDom = runa11yCoreOnDom;
