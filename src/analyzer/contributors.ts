// Contributor behavior profile analyzer
// Analyzes contributor activity, generates rankings, and identifies collaboration patterns

import * as path from 'path';
import { ContributorsResult, ContributorProfile, CollaborationEdge } from '../types';
import {
  getGitLog, getGitShortlog, getAuthorLineStats,
  getAuthorChangedFiles, getCommitTimestamps,
} from '../utils/git';

/**
 * Analyze contributor behavior for a repository
 */
export function analyzeContributors(repoPath: string): ContributorsResult {
  const logs = getGitLog(repoPath);
  const shortlog = getGitShortlog(repoPath);
  const authorStats = getAuthorLineStats(repoPath);
  const timestamps = getCommitTimestamps(repoPath);

  // Build contributor profiles
  const contributors: ContributorProfile[] = [];

  for (const entry of shortlog) {
    const authorLogs = logs.filter(l => l.author === entry.name);
    const stat = authorStats.find(s => s.name === entry.name);
    const changedFiles = getAuthorChangedFiles(repoPath, entry.name);

    // Analyze active hours
    const authorTimestamps = timestamps.filter(t => {
      // Match timestamps to author by checking git log dates
      const logEntry = authorLogs.find(l => l.date === t.date);
      return !!logEntry;
    });

    // If we can't match precisely, use all timestamps as approximation
    const activeHours = new Array(24).fill(0);
    const activeDays = new Array(7).fill(0);

    for (const ts of (authorTimestamps.length > 0 ? authorTimestamps : timestamps.slice(0, 100))) {
      activeHours[ts.hour]++;
      activeDays[ts.day]++;
    }

    // Determine first and last commit dates
    const dates = authorLogs.map(l => l.date).sort();
    const firstCommit = dates[0] || '';
    const lastCommit = dates[dates.length - 1] || '';

    // Top files (most frequently changed)
    const topFiles = changedFiles.slice(0, 10);

    // Determine role based on commit count
    let role: 'core' | 'regular' | 'occasional';
    const totalCommits = shortlog.reduce((sum, e) => sum + e.commitCount, 0);
    const ratio = entry.commitCount / totalCommits;

    if (ratio >= 0.1 || entry.commitCount >= 50) {
      role = 'core';
    } else if (ratio >= 0.02 || entry.commitCount >= 10) {
      role = 'regular';
    } else {
      role = 'occasional';
    }

    contributors.push({
      name: entry.name,
      email: authorLogs[0]?.email || '',
      commitCount: entry.commitCount,
      linesAdded: stat?.added || 0,
      linesDeleted: stat?.removed || 0,
      firstCommit,
      lastCommit,
      activeHours,
      activeDays,
      topFiles,
      role,
    });
  }

  // Sort by commit count (descending)
  contributors.sort((a, b) => b.commitCount - a.commitCount);

  // Build collaboration network
  const collaborationNetwork = buildCollaborationNetwork(repoPath, contributors);

  const coreContributors = contributors.filter(c => c.role === 'core').length;

  return {
    contributors,
    collaborationNetwork,
    totalContributors: contributors.length,
    coreContributors,
  };
}

/**
 * Build collaboration network based on shared file modifications
 */
function buildCollaborationNetwork(
  repoPath: string,
  contributors: ContributorProfile[]
): CollaborationEdge[] {
  const edges: CollaborationEdge[] = [];
  const contributorFiles = new Map<string, Set<string>>();

  // Collect files per contributor
  for (const contributor of contributors) {
    const files = getAuthorChangedFiles(repoPath, contributor.name);
    contributorFiles.set(contributor.name, new Set(files));
  }

  // Find shared files between pairs of contributors
  const names = contributors.map(c => c.name);
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const files1 = contributorFiles.get(names[i]) || new Set();
      const files2 = contributorFiles.get(names[j]) || new Set();

      const sharedFiles: string[] = [];
      for (const file of files1) {
        if (files2.has(file)) {
          sharedFiles.push(file);
        }
      }

      if (sharedFiles.length > 0) {
        edges.push({
          contributor1: names[i],
          contributor2: names[j],
          sharedFiles: sharedFiles.length,
          sharedFileList: sharedFiles.slice(0, 10), // Limit to top 10
        });
      }
    }
  }

  // Sort by shared files count (descending)
  edges.sort((a, b) => b.sharedFiles - a.sharedFiles);

  return edges.slice(0, 50); // Top 50 collaboration edges
}
