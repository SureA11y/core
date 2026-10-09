// SPDX-License-Identifier: MPL-2.0
// @surea11y/core/eslint-plugin for an ES module import: the plugin, with the
// names its types declare as named exports. require() gets the plugin itself.
import plugin from './eslint-plugin.js';

export const { meta, rules, configs, isUnsafeDomMember, NAMES } = plugin;
export default plugin;
