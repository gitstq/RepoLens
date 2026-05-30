// JSON format reporter
// Outputs structured JSON data

import * as fs from 'fs';
import { AnalysisResult, ComparisonResult, ChangelogResult } from '../types';

/**
 * Generate JSON report for analysis results
 */
export function reportJSON(result: AnalysisResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Generate JSON report for comparison results
 */
export function reportComparisonJSON(result: ComparisonResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Generate JSON report for changelog results
 */
export function reportChangelogJSON(result: ChangelogResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Write JSON report to file
 */
export function writeJSONReport(result: AnalysisResult, filePath: string): void {
  const dir = filePath.substring(0, filePath.lastIndexOf('/'));
  if (dir) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, reportJSON(result), 'utf-8');
}
