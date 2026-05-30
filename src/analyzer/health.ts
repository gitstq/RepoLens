// Repository health score analyzer
// Evaluates repository health across 6 dimensions

import * as fs from 'fs';
import * as path from 'path';
import { HealthResult, HealthDimension } from '../types';
import { getGitLog, getGitShortlog, gitCommandSafe } from '../utils/git';
import {
  walkDirectory, isSourceFile, isTestFile, countFileLines,
  fileExists, hasGoodNaming, DOC_FILES, DEPENDENCY_FILES,
  LOCK_FILES, COMMUNITY_FILES,
} from '../utils/files';

/**
 * Analyze repository health across 6 dimensions
 */
export function analyzeHealth(repoPath: string): HealthResult {
  const dimensions: HealthDimension[] = [
    analyzeCodeQuality(repoPath),
    analyzeCommitActivity(repoPath),
    analyzeDependencySafety(repoPath),
    analyzeDocumentationCoverage(repoPath),
    analyzeTestCoverage(repoPath),
    analyzeCommunityActivity(repoPath),
  ];

  // Calculate weighted average
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
  const totalScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight
  );

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D';
  if (totalScore >= 90) grade = 'A';
  else if (totalScore >= 75) grade = 'B';
  else if (totalScore >= 60) grade = 'C';
  else grade = 'D';

  return { dimensions, totalScore, grade };
}

/**
 * Dimension 1: Code Quality
 * Based on file size distribution, code-to-comment ratio, naming conventions
 */
function analyzeCodeQuality(repoPath: string): HealthDimension {
  let score = 50; // Start at midpoint
  const details: string[] = [];

  const files = walkDirectory(repoPath);
  const sourceFiles = files.filter(isSourceFile);

  if (sourceFiles.length === 0) {
    return {
      name: 'Code Quality',
      score: 0,
      details: 'No source files found',
      weight: 0.2,
    };
  }

  // Evaluate file size distribution
  const largeFiles = sourceFiles.filter(f => {
    try { return fs.statSync(f).size > 500 * 1024; } catch { return false; }
  });
  const largeRatio = largeFiles.length / sourceFiles.length;

  if (largeRatio < 0.05) {
    score += 15;
    details.push('File sizes are well-distributed');
  } else if (largeRatio < 0.15) {
    score += 8;
    details.push(`${largeFiles.length} large files (>500KB) detected`);
  } else {
    score -= 5;
    details.push(`Warning: ${largeFiles.length} large files (>500KB) detected`);
  }

  // Evaluate code-to-comment ratio
  let totalCode = 0;
  let totalComment = 0;
  let goodNamingCount = 0;

  for (const file of sourceFiles.slice(0, 200)) { // Sample up to 200 files
    const lines = countFileLines(file);
    totalCode += lines.code;
    totalComment += lines.comment;
    if (hasGoodNaming(file)) goodNamingCount++;
  }

  const commentRatio = totalCode > 0 ? totalComment / totalCode : 0;

  if (commentRatio >= 0.05 && commentRatio <= 0.3) {
    score += 15;
    details.push(`Comment ratio is healthy (${(commentRatio * 100).toFixed(1)}%)`);
  } else if (commentRatio > 0) {
    score += 8;
    details.push(`Comment ratio: ${(commentRatio * 100).toFixed(1)}%`);
  } else {
    details.push('Very few comments found');
  }

  // Evaluate naming conventions
  const namingRatio = goodNamingCount / Math.min(sourceFiles.length, 200);
  if (namingRatio > 0.8) {
    score += 10;
    details.push('File naming follows conventions');
  } else if (namingRatio > 0.5) {
    score += 5;
    details.push('Most files follow naming conventions');
  } else {
    details.push('Many files have unconventional naming');
  }

  // Bonus for small average file size
  const avgLines = totalCode / Math.min(sourceFiles.length, 200);
  if (avgLines < 300) {
    score += 10;
    details.push('Average file size is reasonable');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Code Quality',
    score,
    details: details.join('; '),
    weight: 0.2,
  };
}

/**
 * Dimension 2: Commit Activity
 * Based on commit frequency, recency, and trend
 */
function analyzeCommitActivity(repoPath: string): HealthDimension {
  let score = 30;
  const details: string[] = [];

  const logs = getGitLog(repoPath);
  const shortlog = getGitShortlog(repoPath);

  if (logs.length === 0) {
    return {
      name: 'Commit Activity',
      score: 0,
      details: 'No commits found',
      weight: 0.2,
    };
  }

  // Total commits
  const totalCommits = shortlog.reduce((sum, e) => sum + e.commitCount, 0);
  if (totalCommits > 100) {
    score += 20;
    details.push(`${totalCommits} total commits`);
  } else if (totalCommits > 20) {
    score += 15;
    details.push(`${totalCommits} total commits`);
  } else {
    score += 5;
    details.push(`Only ${totalCommits} total commits`);
  }

  // Recent activity (commits in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentLogs = logs.filter(l => new Date(l.date) >= thirtyDaysAgo);

  if (recentLogs.length > 20) {
    score += 20;
    details.push(`${recentLogs.length} commits in the last 30 days`);
  } else if (recentLogs.length > 5) {
    score += 15;
    details.push(`${recentLogs.length} commits in the last 30 days`);
  } else if (recentLogs.length > 0) {
    score += 8;
    details.push(`${recentLogs.length} commits in the last 30 days`);
  } else {
    details.push('No commits in the last 30 days');
  }

  // Commit trend (compare last 30 days vs previous 30 days)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const olderLogs = logs.filter(l => {
    const d = new Date(l.date);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  });

  if (recentLogs.length > 0 && olderLogs.length > 0) {
    const ratio = recentLogs.length / olderLogs.length;
    if (ratio > 1.2) {
      score += 10;
      details.push('Commit frequency is increasing');
    } else if (ratio > 0.8) {
      score += 5;
      details.push('Commit frequency is stable');
    } else {
      details.push('Commit frequency is decreasing');
    }
  }

  // Contributor diversity
  if (shortlog.length >= 5) {
    score += 10;
    details.push(`${shortlog.length} contributors`);
  } else if (shortlog.length >= 2) {
    score += 5;
    details.push(`${shortlog.length} contributors`);
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Commit Activity',
    score,
    details: details.join('; '),
    weight: 0.2,
  };
}

/**
 * Dimension 3: Dependency Safety
 * Checks for lock files and dependency configuration
 */
function analyzeDependencySafety(repoPath: string): HealthDimension {
  let score = 50;
  const details: string[] = [];

  const files = walkDirectory(repoPath, 3); // Only check top 3 levels
  const fileNames = files.map(f => path.basename(f));
  const filePaths = new Set(files.map(f => f.replace(/\\/g, '/')));

  // Check for dependency files
  const foundDepFiles: string[] = [];
  const foundLockFiles: string[] = [];

  for (const depFile of DEPENDENCY_FILES) {
    if (fileNames.includes(depFile)) {
      foundDepFiles.push(depFile);
    }
  }

  for (const lockFile of LOCK_FILES) {
    if (fileNames.includes(lockFile)) {
      foundLockFiles.push(lockFile);
    }
  }

  if (foundDepFiles.length > 0) {
    score += 15;
    details.push(`Dependency files: ${foundDepFiles.join(', ')}`);
  } else {
    score -= 10;
    details.push('No dependency manifest found');
  }

  if (foundLockFiles.length > 0) {
    score += 20;
    details.push(`Lock files present: ${foundLockFiles.join(', ')}`);
  } else if (foundDepFiles.length > 0) {
    score -= 15;
    details.push('Warning: No lock file found - dependencies are not pinned');
  }

  // Check for .npmrc, .yarnrc, etc. for additional safety
  const configFiles = ['.npmrc', '.yarnrc.yml', '.yarnrc', 'pnpm-workspace.yaml'];
  const foundConfigs = configFiles.filter(f => fileNames.includes(f));
  if (foundConfigs.length > 0) {
    score += 5;
    details.push(`Config files: ${foundConfigs.join(', ')}`);
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Dependency Safety',
    score,
    details: details.join('; '),
    weight: 0.15,
  };
}

/**
 * Dimension 4: Documentation Coverage
 * Checks for README, LICENSE, CONTRIBUTING, etc.
 */
function analyzeDocumentationCoverage(repoPath: string): HealthDimension {
  let score = 20;
  const details: string[] = [];

  const files = walkDirectory(repoPath, 3);
  const fileNames = files.map(f => path.basename(f));
  const filePaths = new Set(files.map(f => f.replace(/\\/g, '/')));

  // Check for essential docs
  const essential = ['README', 'README.md', 'README.txt', 'README.rst'];
  const hasReadme = essential.some(f => fileNames.includes(f));
  if (hasReadme) {
    score += 25;
    details.push('README found');
  } else {
    details.push('No README found');
  }

  // Check for LICENSE
  const licenseFiles = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'LICENCE.md'];
  const hasLicense = licenseFiles.some(f => fileNames.includes(f));
  if (hasLicense) {
    score += 15;
    details.push('LICENSE found');
  } else {
    details.push('No LICENSE found');
  }

  // Check for CONTRIBUTING
  const contributingFiles = ['CONTRIBUTING', 'CONTRIBUTING.md', 'CONTRIBUTING.txt'];
  const hasContributing = contributingFiles.some(f => fileNames.includes(f));
  if (hasContributing) {
    score += 15;
    details.push('CONTRIBUTING guide found');
  }

  // Check for docs directory
  const hasDocsDir = files.some(f => {
    const segments = f.replace(/\\/g, '/').split('/');
    return segments.includes('docs');
  });
  if (hasDocsDir) {
    score += 10;
    details.push('docs/ directory found');
  }

  // Check for CHANGELOG
  const changelogFiles = ['CHANGELOG', 'CHANGELOG.md', 'CHANGELOG.txt'];
  const hasChangelog = changelogFiles.some(f => fileNames.includes(f));
  if (hasChangelog) {
    score += 10;
    details.push('CHANGELOG found');
  }

  // Check for CODE_OF_CONDUCT
  const cocFiles = ['CODE_OF_CONDUCT', 'CODE_OF_CONDUCT.md'];
  const hasCoc = cocFiles.some(f => fileNames.includes(f));
  if (hasCoc) {
    score += 5;
    details.push('CODE_OF_CONDUCT found');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Documentation Coverage',
    score,
    details: details.join('; '),
    weight: 0.15,
  };
}

/**
 * Dimension 5: Test Coverage
 * Based on test directory existence and test file ratio
 */
function analyzeTestCoverage(repoPath: string): HealthDimension {
  let score = 20;
  const details: string[] = [];

  const files = walkDirectory(repoPath);
  const sourceFiles = files.filter(isSourceFile);
  const testFiles = files.filter(isTestFile);

  // Check for test directories
  const testDirs = new Set(['__tests__', '__test__', 'tests', 'test', 'spec', 'specs']);
  const hasTestDir = files.some(f => {
    const segments = f.replace(/\\/g, '/').split('/');
    return segments.some(s => testDirs.has(s));
  });

  if (hasTestDir) {
    score += 20;
    details.push('Test directory found');
  }

  // Evaluate test file ratio
  if (sourceFiles.length > 0) {
    const testRatio = testFiles.length / sourceFiles.length;
    if (testRatio > 0.3) {
      score += 30;
      details.push(`Test ratio is excellent (${(testRatio * 100).toFixed(1)}%)`);
    } else if (testRatio > 0.1) {
      score += 20;
      details.push(`Test ratio is good (${(testRatio * 100).toFixed(1)}%)`);
    } else if (testRatio > 0) {
      score += 10;
      details.push(`Test ratio is low (${(testRatio * 100).toFixed(1)}%)`);
    } else {
      details.push('No test files found');
    }
  }

  // Check for test configuration files
  const testConfigFiles = [
    'jest.config.js', 'jest.config.ts', 'jest.config.json',
    '.mocharc.yml', '.mocharc.json', 'mocharc.js',
    'vitest.config.ts', 'vitest.config.js',
    'karma.conf.js',
    'pytest.ini', 'setup.py', 'setup.cfg', 'pyproject.toml',
    'Cargo.toml',
  ];
  const fileNames = files.map(f => path.basename(f));
  const hasTestConfig = testConfigFiles.some(f => fileNames.includes(f));
  if (hasTestConfig) {
    score += 10;
    details.push('Test configuration found');
  }

  // Check for CI configuration (indicates tests are likely run)
  const ciFiles = [
    '.travis.yml', '.circleci/config.yml',
    '.github/workflows', 'azure-pipelines.yml',
    '.gitlab-ci.yml', 'Jenkinsfile',
  ];
  const hasCI = ciFiles.some(f => {
    return files.some(file => file.replace(/\\/g, '/').includes(f));
  });
  if (hasCI) {
    score += 10;
    details.push('CI configuration found');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Test Coverage',
    score,
    details: details.join('; '),
    weight: 0.15,
  };
}

/**
 * Dimension 6: Community Activity
 * Based on contributor count and PR/Issue templates
 */
function analyzeCommunityActivity(repoPath: string): HealthDimension {
  let score = 30;
  const details: string[] = [];

  const shortlog = getGitShortlog(repoPath);
  const contributorCount = shortlog.length;

  // Contributor count
  if (contributorCount >= 10) {
    score += 25;
    details.push(`${contributorCount} contributors`);
  } else if (contributorCount >= 5) {
    score += 20;
    details.push(`${contributorCount} contributors`);
  } else if (contributorCount >= 2) {
    score += 10;
    details.push(`${contributorCount} contributors`);
  } else {
    details.push(`Only ${contributorCount} contributor(s)`);
  }

  // Check for PR/Issue templates
  const files = walkDirectory(repoPath, 4);
  const hasTemplates = COMMUNITY_FILES.some(template => {
    return files.some(f => f.replace(/\\/g, '/').endsWith(template));
  });

  if (hasTemplates) {
    score += 15;
    details.push('PR/Issue templates found');
  }

  // Check for GitHub-specific community files
  const githubFiles = files.filter(f => f.replace(/\\/g, '/').includes('.github'));
  if (githubFiles.length > 0) {
    score += 10;
    details.push('GitHub configuration found');
  }

  // Check for CODEOWNERS
  const hasCodeowners = files.some(f => f.replace(/\\/g, '/').includes('CODEOWNERS'));
  if (hasCodeowners) {
    score += 10;
    details.push('CODEOWNERS file found');
  }

  // Check for SECURITY.md
  const hasSecurity = files.some(f => {
    const name = path.basename(f).toUpperCase();
    return name === 'SECURITY.MD' || name === 'SECURITY';
  });
  if (hasSecurity) {
    score += 5;
    details.push('Security policy found');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Community Activity',
    score,
    details: details.join('; '),
    weight: 0.15,
  };
}
