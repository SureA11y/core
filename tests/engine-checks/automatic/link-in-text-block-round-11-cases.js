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
  // Round 12, C12-15: one in the color behind it shows nothing either.
  [
    'an underline in the background color on the content is no cue',
    sheet('.u{text-decoration:underline #fff}'),
    link('<span class="u">guide</span>'),
    'fail'
  ],
  [
    'an underline in the background color on the content is no cue, in a style attribute',
    '',
    link('<span style="text-decoration:underline #fff">guide</span>'),
    'fail'
  ],
  [
    'an underline in a color of its own on the content is a cue',
    sheet('.u{text-decoration:underline #c00}'),
    link('<span class="u">guide</span>'),
    'pass'
  ],
  // R11F-3: an underline the browser's style sheet draws, or one a rule
  // wins with by !important or from a layer.
  ['<u> inside a link is underlined', '', link('<u>guide</u>'), 'pass'],
  ['<ins> inside a link is underlined', '', link('<ins>guide</ins>'), 'pass'],
  [
    '<u> with its underline taken away is no cue',
    '',
    link('<u style="text-decoration:none">guide</u>'),
    'fail'
  ],
  [
    'an underline reverted to the browser style is a cue',
    sheet('u{text-decoration:none}.r{text-decoration:revert}'),
    link('<u class="r">guide</u>'),
    'pass'
  ],
  [
    'an !important underline beats an inline none',
    sheet('.u{text-decoration:underline!important}'),
    link('<span class="u" style="text-decoration:none">guide</span>'),
    'pass'
  ],
  [
    'an underline from an @layer is a cue',
    sheet('@layer x{.u{text-decoration:underline}}'),
    link('<span class="u">guide</span>'),
    'pass'
  ],
  [
    'an underline in an @layer loses to a none in no layer',
    sheet('@layer x{#x .u{text-decoration:underline}} .u{text-decoration:none}'),
    link('<span class="u">guide</span>'),
    'fail'
  ],
  [
    'an underline through var() is a cue (asked about under jsdom)',
    sheet('.u{--d:underline;text-decoration:var(--d)}'),
    link('<span class="u">guide</span>'),
    'pass',
    'cantTell'
  ]
];
