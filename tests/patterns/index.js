'use strict';

/**
 * Real-world component patterns, each built accessibly, and the states each
 * is scanned in (a script run once the page has loaded: a list scrolled, a
 * drawer opened, a slide shown). A rule that fails one of them is wrong on a
 * common page, unless the pattern is listed in `knownFailures` with the
 * finding that explains it.
 */

const scrollTo = (selector, top) =>
  `document.querySelector(${JSON.stringify(selector)}).scrollTop = ${top};`;

module.exports = [
  {
    file: 'dialog-autocomplete.html',
    states: { open: '', 'list scrolled to the end': scrollTo('.panel', 9999) }
  },
  ...['auto', 'hidden'].map((kind) => ({
    file: `menu-scroll-${kind}.html`,
    states: {
      'fourth item showing 16px': '',
      'scrolled 20px': scrollTo('.menu', 20),
      'scrolled to the end': scrollTo('.menu', 9999)
    }
  })),
  {
    file: 'carousel.html',
    states: {
      'first slide': '',
      'second slide': "document.getElementById('track').style.transform = 'translateX(-360px)';",
      'half way between slides':
        "document.getElementById('track').style.transform = 'translateX(-180px)';"
    }
  },
  { file: 'accordion.html', states: { 'one panel open': '' } },
  {
    file: 'sticky-header.html',
    states: {
      top: '',
      'scrolled 400px': 'window.scrollTo(0, 400);',
      'scrolled to the end': 'window.scrollTo(0, document.body.scrollHeight);'
    }
  },
  {
    file: 'virtual-list.html',
    states: {
      top: '',
      'rows cut at both edges':
        "document.getElementById('inner').style.transform = 'translateY(-110px)';"
    }
  },
  {
    file: 'off-canvas.html',
    states: {
      closed: '',
      open: "document.getElementById('drawer').classList.add('open'); document.getElementById('burger').setAttribute('aria-expanded', 'true');"
    }
  },
  {
    file: 'table-sticky-head.html',
    states: { top: '', 'scrolled 100px': scrollTo('.scroll', 100) }
  },
  { file: 'tabs.html', states: { 'first tab': '' } },
  { file: 'toast.html', states: { top: '', 'scrolled 600px': 'window.scrollTo(0, 600);' } },
  { file: 'dark-scheme.html', states: { default: '' } },
  { file: 'hero-scrim.html', states: { default: '' } },
  { file: 'tooltip.html', states: { shown: '' } }
];

// Failures a pattern still gets, each with the finding that explains it, to
// be removed when the finding is fixed: { 'file|state|ruleId': 'VS-nn' }.
module.exports.knownFailures = {};
