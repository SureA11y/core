'use strict';

// An underline on a link or on its content, as round 11's review found it
// read: [label, head, body, outcome in Chromium, outcome under jsdom where
// it differs].
const link = (inner, style = 'color:#000;text-decoration:none', attrs = '') =>
  `<p style="color:#000">Read the <a href="/"${attrs} style="${style}">${inner}</a> before you start the work today.</p>`;
const sheet = (css) => `<style>${css}</style>`;

module.exports = [
  // R11F-2: a transparent underline set by the shorthand shows nothing.
  [
    'a transparent underline on the content is no cue',
    sheet('.u{text-decoration:underline transparent}'),
    link('<span class="u">guide</span>'),
    'fail'
  ],
  [
    'a transparent underline on the link is no cue',
    sheet('.u{text-decoration:underline transparent}'),
    link('guide', 'color:#000', ' class="u"'),
    'fail'
  ],
  [
    'an underline in a color of its own on the content is a cue',
    sheet('.u{text-decoration:underline #c00}'),
    link('<span class="u">guide</span>'),
    'pass'
  ]
];
