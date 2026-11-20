/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Text for an HTML page core writes (src/report.js, src/procedures-render.js):
 * HTML's special characters as entities, and control characters (U+0000 and
 * the like) and the bidi controls that reorder what follows (U+202A-U+202E,
 * U+2066-U+2069) left out, so a rule's or a pack's text shows as written.
 * No dependency, so it runs wherever a page is written, in Node or in a
 * browser bundle.
 */

// Text without control characters (newlines and tabs kept) and bidi controls.
function withoutControls(s) {
  let out = '';
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (
      (code < 0x20 && ch !== '\n' && ch !== '\t' && ch !== '\r') ||
      code === 0x7f ||
      (code >= 0x202a && code <= 0x202e) ||
      (code >= 0x2066 && code <= 0x2069)
    ) {
      continue;
    }
    out += ch;
  }
  return out;
}

function esc(s) {
  return withoutControls(String(s == null ? '' : s)).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

// Neutralizes '<' so embedded JSON can never break out of its <script> tag,
// even if a string in it literally contains "</script>". Strings lose the
// characters esc leaves out, as the page shows them too.
function jsonForScript(value) {
  return JSON.stringify(value, (key, v) =>
    typeof v === 'string' ? withoutControls(v) : v
  ).replace(/</g, '\\u003c');
}

module.exports = { esc, jsonForScript, withoutControls };
