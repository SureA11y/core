// Types for @surea11y/core/browser: the standalone browser bundle, as a
// bundler or require() loads it (a <script> gets the same object as
// window.a11ycore).

import type {
  runa11yCoreInPage as RunInPage,
  waitForPageReady as WaitForPageReady,
  getMargins as GetMargins
} from './src/index';

declare namespace a11ycore {
  const ENGINE_TAG: string;
  const SCHEMA_VERSION: string;
  /** Adds a locale's messages, as a surea11y.i18n.<locale>.js file does. */
  function registerMessages(locale: string, messages: Record<string, string>): void;
  const waitForPageReady: typeof WaitForPageReady;
  const getMargins: typeof GetMargins;
  const runa11yCoreInPage: typeof RunInPage;
}

export = a11ycore;

declare global {
  interface Window {
    a11ycore: typeof a11ycore;
  }
}
