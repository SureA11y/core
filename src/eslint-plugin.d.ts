// Types for @surea11y/core/eslint-plugin (src/eslint-plugin.js).

interface RuleModule {
  meta: { type: 'problem'; messages: Record<string, string> };
  create(context: any): Record<string, (node: any) => void>;
}

interface SafeDomPlugin {
  meta: { name: string; version: string };
  rules: {
    'use-safe-dom': RuleModule;
    'no-raw-role': RuleModule;
    'tree-scoped-ids': RuleModule;
  };
  configs: {
    /** The three rules as errors, with the plugin named `safe-dom`. Give it `files`. */
    recommended: {
      plugins: { 'safe-dom': SafeDomPlugin };
      rules: Record<string, 'error'>;
    };
  };
  /** Whether a member expression reads a DOM-only name directly. */
  isUnsafeDomMember(node: any): boolean;
  /** The DOM-only names read through the safe accessors. */
  NAMES: { has(name: string): boolean; readonly size: number };
}

declare const plugin: SafeDomPlugin;
export = plugin;
