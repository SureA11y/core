// Types for @surea11y/core/pack-docs (src/pack-docs.js).

import type { Pack } from './pack';

export interface PackDocsOptions {
  /** The pack's folder (default: the current directory). */
  root?: string;
  /** Its rules' folder, relative to root (default 'rules'). */
  rulesDir?: string;
  /** Its docs' folder, relative to root (default 'docs'). */
  docsDir?: string;
  /** Its records' folder, relative to root (default 'scripts/data'). */
  dataDir?: string;
  /** Write nothing; report what is stale. */
  check?: boolean;
  /** Run the examples in Chromium (default true; needs Playwright). */
  examples?: boolean;
  /** The command that regenerates the docs, named in them and in messages. */
  command?: string;
}

/** Writes (or checks) a pack's RULE_CATALOG.md and the records of its RULE_EXAMPLES.md. */
export function packDocs(
  pack: Pack,
  options?: PackDocsOptions
): Promise<{ written: string[]; problems: string[] }>;

/** A pack's RULE_CATALOG.md. */
export function ruleCatalog(
  pack: Pack,
  options?: { rulesDir?: string; coreDocs?: string; command?: string }
): string;
