'use strict';

/**
 * Exists only on the audit branch, which is never merged into main (see
 * audits/README.md). Locally it passes, so the suite can be run on the branch.
 * In GitHub Actions it fails unless the run is for the audit branch itself: a
 * pull request from the audit branch into main runs main's own Test workflow
 * on the merged code, and this test makes that workflow fail too, with the
 * reason below. It also fails if the branch is ever merged into main anyway.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const isAuditRef = (ref) => typeof ref === 'string' && ref.startsWith('audit/');

test('the audit branch is never merged', () => {
  if (process.env.GITHUB_ACTIONS !== 'true') return;
  const isPullRequest = String(process.env.GITHUB_EVENT_NAME || '').startsWith('pull_request');
  const target = isPullRequest ? process.env.GITHUB_BASE_REF : process.env.GITHUB_REF_NAME;
  assert.ok(
    isAuditRef(target),
    `This code carries the audit branch, which is never merged into "${target}". ` +
      'The audit branch holds main plus audits/ (reports, probes and the findings register); ' +
      'main flows into it, never the other way. Fixes go on a branch made from main. ' +
      'See audits/README.md.'
  );
});
