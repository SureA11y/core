import type { CompactScanResult } from '@surea11y/core';
import { runDomRulesInPage } from '@surea11y/core';
import { renderSarifReport } from '@surea11y/core/sarif';
import { renderJunitReport } from '@surea11y/core/junit';
import { renderHtmlReport } from '@surea11y/core/report';
import { renderEarlReport } from '@surea11y/core/earl';
import { matchBaseline, buildBaselineEntries } from '@surea11y/core/baseline';
import { addHowToCheck, leaningFailures, flattenCrossFrameResult } from '@surea11y/core';
declare const compact: CompactScanResult;
renderSarifReport(compact);
renderJunitReport(compact);
renderHtmlReport(compact);
renderEarlReport(compact);
matchBaseline(compact, null);
buildBaselineEntries(compact);
addHowToCheck(compact);
leaningFailures(compact);
flattenCrossFrameResult(compact);
// documented: the scan returns a compact result for this option, but typed ScanResult
const r = runDomRulesInPage('u', null, { output: { detail: 'findings' } });
const n: number = r.checksResults[0].occurrences.length; // compiles; undefined at runtime
