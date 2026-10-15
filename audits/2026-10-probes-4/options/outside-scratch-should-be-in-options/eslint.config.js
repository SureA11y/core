'use strict';

// The lint rules core's own rules are held to: a rule runs on pages it
// doesn't control, so it reads the DOM through ctx.helpers.dom, resolves a
// role with helpers.aria.getExplicitRole and looks an ID up in the referring
// element's own tree. A read they flag that is right says why in an
// eslint-disable comment.
const safeDom = require('@surea11y/core/eslint-plugin');

module.exports = [
  { languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs' } },
  { files: ['rules/**'], ...safeDom.configs.recommended },
  { ignores: ['node_modules/**'] }
];
