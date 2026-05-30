// HTML format reporter
// Generates standalone HTML reports with inline CSS and visual elements

import { AnalysisResult, ComparisonResult, ChangelogResult } from '../types';

/**
 * Generate HTML report for analysis results
 */
export function reportHTML(result: AnalysisResult): string {
  const gradeColor = getGradeColor(result.health.grade);
  const scoreColor = getScoreColor(result.health.totalScore);

  const complexityBars = result.complexity.files.slice(0, 10).map(file =>
    `<div class="bar-row">
      <div class="bar-label" title="${escapeHtml(file.filePath)}">${escapeHtml(truncatePath(file.filePath, 40))}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${Math.min(file.cyclomaticComplexity, 100)}%; background: ${getScoreColor(file.cyclomaticComplexity)}"></div>
      </div>
      <div class="bar-value">${file.cyclomaticComplexity}</div>
    </div>`
  ).join('\n');

  const contributorRows = result.contributors.contributors.slice(0, 15).map((c, i) =>
    `<tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(c.name)}</td>
      <td>${c.commitCount}</td>
      <td class="positive">+${formatNumber(c.linesAdded)}</td>
      <td class="negative">-${formatNumber(c.linesDeleted)}</td>
      <td><span class="role-badge role-${c.role}">${c.role}</span></td>
    </tr>`
  ).join('\n');

  const dimensionCards = result.health.dimensions.map(dim =>
    `<div class="dimension-card">
      <div class="dimension-name">${escapeHtml(dim.name)}</div>
      <div class="dimension-score" style="color: ${getScoreColor(dim.score)}">${dim.score}</div>
      <div class="dimension-bar">
        <div class="dimension-bar-fill" style="width: ${dim.score}%; background: ${getScoreColor(dim.score)}"></div>
      </div>
      <div class="dimension-details">${escapeHtml(dim.details)}</div>
    </div>`
  ).join('\n');

  const hotFileRows = result.complexity.hotFiles.slice(0, 10).map(f =>
    `<tr>
      <td>${escapeHtml(truncatePath(f.filePath, 50))}</td>
      <td>${f.complexity}</td>
      <td>${f.changeCount}</td>
      <td><span class="hot-score" style="background: ${getScoreColor(Math.min(f.score, 100))}">${f.score}</span></td>
    </tr>`
  ).join('\n');

  const suggestionsHtml = result.complexity.refactorSuggestions.map(s =>
    `<li>${escapeHtml(s)}</li>`
  ).join('\n');

  const cycleHtml = result.architecture.cycles.length > 0
    ? result.architecture.cycles.map(c =>
        `<div class="cycle-item">${c.path.map(p => escapeHtml(truncatePath(p, 30))).join(' <span class="arrow">&rarr;</span> ')}</div>`
      ).join('\n')
    : '<p class="success-text">No circular dependencies detected.</p>';

  const collabRows = result.contributors.collaborationNetwork.slice(0, 10).map(e =>
    `<tr>
      <td>${escapeHtml(e.contributor1)}</td>
      <td>${escapeHtml(e.contributor2)}</td>
      <td>${e.sharedFiles}</td>
    </tr>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RepoLens - ${escapeHtml(result.repositoryName)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0d1117; color: #c9d1d9; line-height: 1.6;
    padding: 2rem; max-width: 1200px; margin: 0 auto;
  }
  h1 { font-size: 2rem; color: #58a6ff; margin-bottom: 0.5rem; }
  h2 { font-size: 1.4rem; color: #58a6ff; margin: 2rem 0 1rem; border-bottom: 1px solid #21262d; padding-bottom: 0.5rem; }
  h3 { font-size: 1.1rem; color: #8b949e; margin: 1rem 0 0.5rem; }
  .meta { color: #8b949e; margin-bottom: 2rem; }
  .meta span { margin-right: 1.5rem; }

  /* Score Card */
  .score-card {
    display: flex; align-items: center; gap: 2rem;
    background: #161b22; border: 1px solid #30363d; border-radius: 12px;
    padding: 2rem; margin-bottom: 2rem;
  }
  .score-circle {
    width: 120px; height: 120px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 2.5rem; font-weight: bold; border: 4px solid;
    flex-shrink: 0;
  }
  .grade-badge {
    font-size: 1.5rem; font-weight: bold; padding: 0.3rem 1rem;
    border-radius: 8px; background: #21262d;
  }

  /* Dimension Cards */
  .dimensions-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem; margin-bottom: 2rem;
  }
  .dimension-card {
    background: #161b22; border: 1px solid #30363d; border-radius: 8px;
    padding: 1rem;
  }
  .dimension-name { font-weight: bold; margin-bottom: 0.5rem; color: #c9d1d9; }
  .dimension-score { font-size: 2rem; font-weight: bold; }
  .dimension-bar {
    height: 6px; background: #21262d; border-radius: 3px; margin: 0.5rem 0;
    overflow: hidden;
  }
  .dimension-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
  .dimension-details { font-size: 0.8rem; color: #8b949e; margin-top: 0.5rem; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
  th { text-align: left; padding: 0.75rem; background: #161b22; color: #8b949e; border-bottom: 1px solid #30363d; font-size: 0.85rem; }
  td { padding: 0.75rem; border-bottom: 1px solid #21262d; font-size: 0.9rem; }
  tr:hover { background: #161b22; }
  .positive { color: #3fb950; }
  .negative { color: #f85149; }
  .role-badge {
    padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: bold;
  }
  .role-core { background: #1f6feb33; color: #58a6ff; }
  .role-regular { background: #23863633; color: #3fb950; }
  .role-occasional { background: #8b949e33; color: #8b949e; }
  .hot-score {
    padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: bold; font-size: 0.85rem;
  }

  /* Bar Chart */
  .bar-row { display: flex; align-items: center; margin-bottom: 0.5rem; }
  .bar-label { width: 250px; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0; }
  .bar-track { flex: 1; height: 16px; background: #21262d; border-radius: 4px; overflow: hidden; margin: 0 0.5rem; }
  .bar-fill { height: 100%; border-radius: 4px; min-width: 2px; }
  .bar-value { width: 40px; text-align: right; font-size: 0.85rem; font-weight: bold; }

  /* Lists */
  ul { padding-left: 1.5rem; margin-bottom: 1rem; }
  li { margin-bottom: 0.5rem; font-size: 0.9rem; }
  .success-text { color: #3fb950; font-style: italic; }
  .cycle-item { padding: 0.5rem 0; font-size: 0.9rem; }
  .arrow { color: #f85149; margin: 0 0.25rem; }

  /* Stats Grid */
  .stats-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem; margin-bottom: 1.5rem;
  }
  .stat-card {
    background: #161b22; border: 1px solid #30363d; border-radius: 8px;
    padding: 1rem; text-align: center;
  }
  .stat-value { font-size: 1.8rem; font-weight: bold; color: #58a6ff; }
  .stat-label { font-size: 0.8rem; color: #8b949e; margin-top: 0.25rem; }

  .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #21262d; color: #484f58; font-size: 0.8rem; text-align: center; }
</style>
</head>
<body>
  <h1>RepoLens Analysis Report</h1>
  <div class="meta">
    <span>Repository: <strong>${escapeHtml(result.repositoryName)}</strong></span>
    <span>Path: ${escapeHtml(result.repositoryPath)}</span>
    <span>Analyzed: ${result.analyzedAt}</span>
  </div>

  <h2>Health Score</h2>
  <div class="score-card">
    <div class="score-circle" style="color: ${gradeColor}; border-color: ${gradeColor}">
      ${result.health.totalScore}
    </div>
    <div>
      <div class="grade-badge" style="color: ${gradeColor}">Grade: ${result.health.grade}</div>
      <p style="margin-top: 0.5rem; color: #8b949e;">Weighted average across ${result.health.dimensions.length} dimensions</p>
    </div>
  </div>

  <div class="dimensions-grid">
    ${dimensionCards}
  </div>

  <h2>Code Complexity</h2>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value">${result.complexity.totalFiles}</div><div class="stat-label">Source Files</div></div>
    <div class="stat-card"><div class="stat-value">${formatNumber(result.complexity.totalLines)}</div><div class="stat-label">Total Lines</div></div>
    <div class="stat-card"><div class="stat-value">${result.complexity.averageComplexity}</div><div class="stat-label">Avg Complexity</div></div>
    <div class="stat-card"><div class="stat-value">${result.complexity.hotFiles.length}</div><div class="stat-label">Hot Files</div></div>
  </div>

  <h3>Top 10 Most Complex Files</h3>
  ${complexityBars}

  ${result.complexity.hotFiles.length > 0 ? `
  <h3>Hot Files</h3>
  <table>
    <tr><th>File</th><th>Complexity</th><th>Changes</th><th>Score</th></tr>
    ${hotFileRows}
  </table>` : ''}

  ${result.complexity.refactorSuggestions.length > 0 ? `
  <h3>Refactoring Suggestions</h3>
  <ul>${suggestionsHtml}</ul>` : ''}

  <h2>Contributors</h2>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value">${result.contributors.totalContributors}</div><div class="stat-label">Contributors</div></div>
    <div class="stat-card"><div class="stat-value">${result.contributors.coreContributors}</div><div class="stat-label">Core</div></div>
  </div>

  <table>
    <tr><th>#</th><th>Name</th><th>Commits</th><th>Added</th><th>Deleted</th><th>Role</th></tr>
    ${contributorRows}
  </table>

  ${result.contributors.collaborationNetwork.length > 0 ? `
  <h3>Top Collaboration Pairs</h3>
  <table>
    <tr><th>Contributor 1</th><th>Contributor 2</th><th>Shared Files</th></tr>
    ${collabRows}
  </table>` : ''}

  <h2>Architecture</h2>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value">${result.architecture.totalModules}</div><div class="stat-label">Modules</div></div>
    <div class="stat-card"><div class="stat-value">${result.architecture.totalDependencies}</div><div class="stat-label">Dependencies</div></div>
    <div class="stat-card"><div class="stat-value">${result.architecture.averageCoupling}</div><div class="stat-label">Avg Coupling</div></div>
    <div class="stat-card"><div class="stat-value">${result.architecture.cycles.length}</div><div class="stat-label">Cycles</div></div>
  </div>

  <h3>Circular Dependencies</h3>
  ${cycleHtml}

  <div class="footer">
    Generated by RepoLens v1.0.0
  </div>
</body>
</html>`;
}

/**
 * Generate HTML report for comparison results
 */
export function reportComparisonHTML(result: ComparisonResult): string {
  const diffRows = result.healthDiff.map(d => {
    const diffStr = d.diff > 0 ? `+${d.diff}` : `${d.diff}`;
    const color = d.diff > 0 ? '#3fb950' : d.diff < 0 ? '#f85149' : '#8b949e';
    return `<tr>
      <td>${escapeHtml(d.dimension)}</td>
      <td>${d.repo1Score}</td>
      <td>${d.repo2Score}</td>
      <td style="color: ${color}; font-weight: bold">${diffStr}</td>
    </tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RepoLens - Comparison Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; line-height: 1.6; padding: 2rem; max-width: 1000px; margin: 0 auto; }
  h1 { font-size: 2rem; color: #58a6ff; margin-bottom: 1rem; }
  h2 { font-size: 1.4rem; color: #58a6ff; margin: 2rem 0 1rem; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
  th { text-align: left; padding: 0.75rem; background: #161b22; color: #8b949e; border-bottom: 1px solid #30363d; }
  td { padding: 0.75rem; border-bottom: 1px solid #21262d; }
  tr:hover { background: #161b22; }
  .winner { background: #1f6feb22; padding: 1rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #1f6feb44; }
  .footer { margin-top: 3rem; color: #484f58; font-size: 0.8rem; text-align: center; }
</style>
</head>
<body>
  <h1>RepoLens Comparison Report</h1>
  <table>
    <tr><th>Dimension</th><th>${escapeHtml(result.repo1.repositoryName)}</th><th>${escapeHtml(result.repo2.repositoryName)}</th><th>Difference</th></tr>
    ${diffRows}
  </table>
  <div class="winner">
    <strong>Overall Winner:</strong> ${escapeHtml(result.overallWinner)}
  </div>
  <div class="footer">Generated by RepoLens v1.0.0</div>
</body>
</html>`;
}

/**
 * Generate HTML report for changelog results
 */
export function reportChangelogHTML(result: ChangelogResult): string {
  const typeLabels: Record<string, string> = {
    feat: 'Features', fix: 'Bug Fixes', perf: 'Performance',
    refactor: 'Refactoring', docs: 'Documentation', test: 'Tests',
    style: 'Style', chore: 'Chore', other: 'Other',
  };
  const typeColors: Record<string, string> = {
    feat: '#3fb950', fix: '#f85149', perf: '#a371f7',
    refactor: '#58a6ff', docs: '#8b949e', test: '#d29922',
    style: '#8b949e', chore: '#484f58', other: '#484f58',
  };

  let versionsHtml = '';

  if (result.unreleased.length > 0) {
    versionsHtml += buildVersionSection('[Unreleased]', '', result.unreleased, typeLabels, typeColors);
  }

  for (const version of result.versions) {
    versionsHtml += buildVersionSection(`[${version.version}]`, version.date, version.entries, typeLabels, typeColors);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Changelog</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; line-height: 1.6; padding: 2rem; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 2rem; color: #58a6ff; margin-bottom: 2rem; }
  .version { margin-bottom: 2.5rem; }
  .version-header { font-size: 1.3rem; color: #58a6ff; border-bottom: 1px solid #21262d; padding-bottom: 0.5rem; margin-bottom: 1rem; }
  .version-date { color: #8b949e; font-size: 0.9rem; }
  .type-section { margin-bottom: 1rem; }
  .type-header { font-size: 1rem; font-weight: bold; margin-bottom: 0.5rem; }
  .entry { padding: 0.25rem 0 0.25rem 1.5rem; font-size: 0.9rem; }
  .entry-hash { color: #8b949e; font-size: 0.8rem; }
  .footer { margin-top: 3rem; color: #484f58; font-size: 0.8rem; text-align: center; }
</style>
</head>
<body>
  <h1>Changelog</h1>
  ${versionsHtml}
  <div class="footer">Generated by RepoLens v1.0.0</div>
</body>
</html>`;
}

function buildVersionSection(
  version: string,
  date: string,
  entries: { type: string; scope?: string; description: string; hash: string; author: string }[],
  typeLabels: Record<string, string>,
  typeColors: Record<string, string>
): string {
  const typeGroups = new Map<string, typeof entries>();
  for (const entry of entries) {
    if (!typeGroups.has(entry.type)) typeGroups.set(entry.type, []);
    typeGroups.get(entry.type)!.push(entry);
  }

  const typeOrder = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'style', 'chore', 'other'];
  let html = `<div class="version">
    <div class="version-header">${escapeHtml(version)} ${date ? `<span class="version-date">- ${date}</span>` : ''}</div>`;

  for (const type of typeOrder) {
    const group = typeGroups.get(type);
    if (group && group.length > 0) {
      html += `<div class="type-section">
        <div class="type-header" style="color: ${typeColors[type] || '#8b949e'}">${typeLabels[type] || type}</div>`;
      for (const entry of group) {
        const scope = entry.scope ? `<strong>${escapeHtml(entry.scope)}</strong>: ` : '';
        html += `<div class="entry">${scope}${escapeHtml(entry.description)} <span class="entry-hash">(${entry.hash})</span></div>`;
      }
      html += '</div>';
    }
  }

  html += '</div>';
  return html;
}

// Helper functions

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncatePath(filePath: string, maxLen: number): string {
  if (filePath.length <= maxLen) return filePath;
  const parts = filePath.split('/');
  if (parts.length <= 2) return filePath.substring(filePath.length - maxLen);
  return '.../' + parts.slice(-2).join('/');
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return '#3fb950';
    case 'B': return '#58a6ff';
    case 'C': return '#d29922';
    case 'D': return '#f85149';
    default: return '#8b949e';
  }
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#3fb950';
  if (score >= 75) return '#58a6ff';
  if (score >= 60) return '#d29922';
  return '#f85149';
}
