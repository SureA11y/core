#!/usr/bin/env node
/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

// Redirects the pre-1.4.0 `npx @surea11y/core scan ...` that older docs still
// show. Not named `surea11y`: that belongs to @surea11y/cli, and core is a
// transitive dependency of every binding, so both would collide in one .bin.

process.stderr.write(
  `The surea11y CLI is no longer part of @surea11y/core (moved in 1.4.0).

  npx @surea11y/cli scan <file-or-url>

Install it with: npm install --save-dev @surea11y/cli
Docs: https://github.com/SureA11y/cli
`
);

process.exit(2);
