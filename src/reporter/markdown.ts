// Markdown format reporter
// Generates formatted Markdown analysis reports

import { AnalysisResult, ComparisonResult, ChangelogResult } from '../types';

/**
 * Generate Markdown report for analysis results
 */
export function reportMarkdown(result: AnalysisResult): string {
  const lines: string[] = [];

  lines.push(`# RepoLens Analysis Report`);
  lines.push('');
  lines.push(`**Repository:** ${result.repositoryName}`);
  lines.push(`**Path:** ${result.repositoryPath}`);
  lines.push(`**Analyzed At:** ${result.analyzedAt}`);
  lines.push('');

  // Health section
  lines.push('---');
  lines.push('');
  lines.push('## Health Score');
  lines.push('');
  lines.push(`### Overall: **${result.health.totalScore}/100** (Grade: **${result.health.grade}**)`);
  lines.push('');
  lines.push('| Dimension | Score | Weight | Details |');
  lines.push('|-----------|-------|--------|---------|');

  for (const dim of result.health.dimensions) {
    lines.push(`| ${dim.name} | ${dim.score}/100 | ${(dim.weight * 100).toFixed(0)}% | ${dim.details} |`);
  }
  lines.push('');

  // Complexity section
  lines.push('---');
  lines.push('');
  lines.push('## Code Complexity');
  lines.push('');
  lines.push(`- **Total Files:** ${result.complexity.totalFiles}`);
  lines.push(`- **Total Lines:** ${result.complexity.totalLines}`);
  lines.push(`- **Average Complexity:** ${result.complexity.averageComplexity}`);
  lines.push('');

  if (result.complexity.files.length > 0) {
    lines.push('### Top 10 Most Complex Files');
    lines.push('');
    lines.push('| File | Lines | Complexity | Functions | Classes |');
    lines.push('|------|-------|------------|-----------|---------|');

    for (const file of result.complexity.files.slice(0, 10)) {
      lines.push(`| ${file.filePath} | ${file.lines} | ${file.cyclomaticComplexity} | ${file.functionCount} | ${file.classCount} |`);
    }
    lines.push('');
  }

  if (result.complexity.hotFiles.length > 0) {
    lines.push('### Hot Files (High Complexity + Frequently Modified)');
    lines.push('');
    lines.push('| File | Complexity | Changes | Score |');
    lines.push('|------|------------|---------|-------|');

    for (const file of result.complexity.hotFiles.slice(0, 10)) {
      lines.push(`| ${file.filePath} | ${file.complexity} | ${file.changeCount} | ${file.score} |`);
    }
    lines.push('');
  }

  if (result.complexity.refactorSuggestions.length > 0) {
    lines.push('### Refactoring Suggestions');
    lines.push('');
    for (const suggestion of result.complexity.refactorSuggestions) {
      lines.push(`- ${suggestion}`);
    }
    lines.push('');
  }

  // Contributors section
  lines.push('---');
  lines.push('');
  lines.push('## Contributors');
  lines.push('');
  lines.push(`- **Total Contributors:** ${result.contributors.totalContributors}`);
  lines.push(`- **Core Contributors:** ${result.contributors.coreContributors}`);
  lines.push('');

  if (result.contributors.contributors.length > 0) {
    lines.push('### Contributor Rankings');
    lines.push('');
    lines.push('| # | Name | Commits | Lines Added | Lines Deleted | Role |');
    lines.push('|---|------|---------|-------------|---------------|------|');

    for (let i = 0; i < Math.min(result.contributors.contributors.length, 20); i++) {
      const c = result.contributors.contributors[i];
      const roleIcon = c.role === 'core' ? '⭐' : c.role === 'regular' ? '👤' : '🔹';
      lines.push(`| ${i + 1} | ${c.name} | ${c.commitCount} | +${c.linesAdded} | -${c.linesDeleted} | ${roleIcon} ${c.role} |`);
    }
    lines.push('');
  }

  if (result.contributors.collaborationNetwork.length > 0) {
    lines.push('### Top Collaboration Pairs');
    lines.push('');
    lines.push('| Contributor 1 | Contributor 2 | Shared Files |');
    lines.push('|--------------|---------------|-------------|');

    for (const edge of result.contributors.collaborationNetwork.slice(0, 10)) {
      lines.push(`| ${edge.contributor1} | ${edge.contributor2} | ${edge.sharedFiles} |`);
    }
    lines.push('');
  }

  // Architecture section
  lines.push('---');
  lines.push('');
  lines.push('## Architecture');
  lines.push('');
  lines.push(`- **Total Modules:** ${result.architecture.totalModules}`);
  lines.push(`- **Total Dependencies:** ${result.architecture.totalDependencies}`);
  lines.push(`- **Average Coupling:** ${result.architecture.averageCoupling}`);
  lines.push('');

  if (result.architecture.modules.length > 0) {
    lines.push('### Most Coupled Modules');
    lines.push('');
    lines.push('| Module | Incoming | Outgoing | Coupling Score |');
    lines.push('|--------|----------|----------|---------------|');

    for (const mod of result.architecture.modules.slice(0, 10)) {
      lines.push(`| ${mod.path} | ${mod.incomingDeps} | ${mod.outgoingDeps} | ${mod.couplingScore} |`);
    }
    lines.push('');
  }

  if (result.architecture.cycles.length > 0) {
    lines.push('### Circular Dependencies Detected');
    lines.push('');
    for (const cycle of result.architecture.cycles) {
      lines.push(`- ${cycle.path.join(' -> ')}`);
    }
    lines.push('');
  } else {
    lines.push('No circular dependencies detected.');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate Markdown report for comparison results
 */
export function reportComparisonMarkdown(result: ComparisonResult): string {
  const lines: string[] = [];

  lines.push('# RepoLens Comparison Report');
  lines.push('');
  lines.push(`**Repository 1:** ${result.repo1.repositoryName}`);
  lines.push(`**Repository 2:** ${result.repo2.repositoryName}`);
  lines.push('');

  lines.push('## Health Score Comparison');
  lines.push('');
  lines.push('| Dimension | ' + result.repo1.repositoryName + ' | ' + result.repo2.repositoryName + ' | Difference |');
  lines.push('|-----------|---|---|------------|');

  for (const diff of result.healthDiff) {
    const diffStr = diff.diff > 0 ? `+${diff.diff}` : `${diff.diff}`;
    lines.push(`| ${diff.dimension} | ${diff.repo1Score} | ${diff.repo2Score} | ${diffStr} |`);
  }
  lines.push('');

  lines.push(`**Overall Winner:** ${result.overallWinner}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate Markdown report for changelog results
 */
export function reportChangelogMarkdown(result: ChangelogResult): string {
  const lines: string[] = [];

  lines.push('# Changelog');
  lines.push('');

  // Unreleased
  if (result.unreleased.length > 0) {
    lines.push('## [Unreleased]');
    lines.push('');
    lines.push(formatChangelogEntries(result.unreleased));
  }

  // Versions
  for (const version of result.versions) {
    lines.push(`## [${version.version}] - ${version.date}`);
    lines.push('');
    lines.push(formatChangelogEntries(version.entries));
  }

  return lines.join('\n');
}

/**
 * Format changelog entries grouped by type
 */
function formatChangelogEntries(entries: { type: string; scope?: string; description: string; hash: string; author: string; date: string }[]): string {
  const lines: string[] = [];
  const typeGroups = new Map<string, typeof entries>();

  for (const entry of entries) {
    if (!typeGroups.has(entry.type)) {
      typeGroups.set(entry.type, []);
    }
    typeGroups.get(entry.type)!.push(entry);
  }

  const typeOrder = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'style', 'chore', 'other'];
  const typeLabels: Record<string, string> = {
    feat: 'Features',
    fix: 'Bug Fixes',
    perf: 'Performance',
    refactor: 'Refactoring',
    docs: 'Documentation',
    test: 'Tests',
    style: 'Style',
    chore: 'Chore',
    other: 'Other',
  };

  for (const type of typeOrder) {
    const group = typeGroups.get(type);
    if (group && group.length > 0) {
      lines.push(`### ${typeLabels[type] || type}`);
      lines.push('');
      for (const entry of group) {
        const scope = entry.scope ? `(${entry.scope})` : '';
        lines.push(`- ${scope} ${entry.description} (${entry.hash})`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
