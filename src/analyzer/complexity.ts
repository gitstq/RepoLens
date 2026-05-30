// Code complexity analyzer
// Analyzes file complexity, identifies hot files, and suggests refactoring

import * as path from 'path';
import { ComplexityResult, FileComplexity, HotFile } from '../types';
import { walkDirectory, isSourceFile, countFileLines, estimateCyclomaticComplexity, countFunctionsAndClasses, readFileSafe } from '../utils/files';
import { getFileChangeFrequency } from '../utils/git';

/**
 * Analyze code complexity for all source files in a repository
 */
export function analyzeComplexity(repoPath: string): ComplexityResult {
  const files = walkDirectory(repoPath);
  const sourceFiles = files.filter(isSourceFile);

  const fileComplexities: FileComplexity[] = [];

  for (const file of sourceFiles) {
    const content = readFileSafe(file);
    const lines = countFileLines(file);
    const { functions, classes } = countFunctionsAndClasses(content);
    const complexity = estimateCyclomaticComplexity(content);

    const relativePath = path.relative(repoPath, file);
    fileComplexities.push({
      filePath: relativePath,
      lines: lines.total,
      codeLines: lines.code,
      commentLines: lines.comment,
      functionCount: functions,
      classCount: classes,
      cyclomaticComplexity: complexity,
    });
  }

  // Sort by complexity (highest first)
  fileComplexities.sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity);

  // Calculate average complexity
  const totalComplexity = fileComplexities.reduce((sum, f) => sum + f.cyclomaticComplexity, 0);
  const totalLines = fileComplexities.reduce((sum, f) => sum + f.lines, 0);
  const averageComplexity = fileComplexities.length > 0
    ? Math.round(totalComplexity / fileComplexities.length)
    : 0;

  // Identify hot files (high complexity + frequently modified)
  const changeFreq = getFileChangeFrequency(repoPath);
  const hotFiles = identifyHotFiles(fileComplexities, changeFreq);

  // Generate refactoring suggestions
  const refactorSuggestions = generateRefactorSuggestions(fileComplexities, hotFiles);

  return {
    files: fileComplexities,
    hotFiles,
    averageComplexity,
    totalFiles: fileComplexities.length,
    totalLines,
    refactorSuggestions,
  };
}

/**
 * Identify hot files that are both complex and frequently modified
 */
function identifyHotFiles(
  fileComplexities: FileComplexity[],
  changeFreq: Map<string, number>
): HotFile[] {
  const hotFiles: HotFile[] = [];

  // Get average complexity and change frequency for threshold calculation
  const avgComplexity = fileComplexities.length > 0
    ? fileComplexities.reduce((sum, f) => sum + f.cyclomaticComplexity, 0) / fileComplexities.length
    : 0;

  const freqValues = Array.from(changeFreq.values());
  const avgFreq = freqValues.length > 0
    ? freqValues.reduce((sum, v) => sum + v, 0) / freqValues.length
    : 0;

  for (const file of fileComplexities) {
    const changeCount = changeFreq.get(file.filePath) || 0;

    // A file is "hot" if its complexity and change frequency are both above average
    if (file.cyclomaticComplexity > avgComplexity && changeCount > avgFreq) {
      // Score combines complexity and change frequency
      const complexityScore = file.cyclomaticComplexity / (avgComplexity || 1);
      const freqScore = changeCount / (avgFreq || 1);
      const score = Math.round(complexityScore * freqScore * 10);

      hotFiles.push({
        filePath: file.filePath,
        complexity: file.cyclomaticComplexity,
        changeCount,
        score,
      });
    }
  }

  // Sort by score (highest first)
  hotFiles.sort((a, b) => b.score - a.score);

  return hotFiles.slice(0, 20); // Top 20 hot files
}

/**
 * Generate refactoring suggestions based on complexity analysis
 */
function generateRefactorSuggestions(
  fileComplexities: FileComplexity[],
  hotFiles: HotFile[]
): string[] {
  const suggestions: string[] = [];

  // Files with very high complexity
  const highComplexity = fileComplexities.filter(f => f.cyclomaticComplexity > 50);
  if (highComplexity.length > 0) {
    suggestions.push(
      `${highComplexity.length} file(s) have very high cyclomatic complexity (>50). ` +
      `Consider breaking them into smaller modules.`
    );
  }

  // Very large files
  const largeFiles = fileComplexities.filter(f => f.lines > 500);
  if (largeFiles.length > 0) {
    suggestions.push(
      `${largeFiles.length} file(s) exceed 500 lines. ` +
      `Consider splitting them into smaller, focused modules.`
    );
  }

  // Hot files
  if (hotFiles.length > 0) {
    const topHotFiles = hotFiles.slice(0, 5).map(f => f.filePath);
    suggestions.push(
      `${hotFiles.length} "hot file(s)" detected (high complexity + frequently modified). ` +
      `Top candidates: ${topHotFiles.join(', ')}. ` +
      `These files may benefit from refactoring to improve maintainability.`
    );
  }

  // Files with low comment ratio
  const lowComments = fileComplexities.filter(f =>
    f.codeLines > 50 && f.commentLines / f.codeLines < 0.02
  );
  if (lowComments.length > 0) {
    suggestions.push(
      `${lowComments.length} file(s) have very few comments relative to code. ` +
      `Adding documentation would improve maintainability.`
    );
  }

  // Files with too many functions
  const manyFunctions = fileComplexities.filter(f => f.functionCount > 20);
  if (manyFunctions.length > 0) {
    suggestions.push(
      `${manyFunctions.length} file(s) contain more than 20 functions. ` +
      `Consider organizing related functions into separate modules.`
    );
  }

  return suggestions;
}
