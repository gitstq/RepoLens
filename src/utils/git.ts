// Git command wrapper utilities
// Encapsulates common git operations used across analyzers

import { execSync } from 'child_process';
import * as path from 'path';

/** Options for git command execution */
export interface GitCommandOptions {
  cwd: string;
  timeout?: number;
}

/**
 * Execute a git command and return trimmed stdout
 */
export function gitCommand(args: string, options: GitCommandOptions): string {
  try {
    const result = execSync(`git ${args}`, {
      cwd: options.cwd,
      encoding: 'utf-8',
      timeout: options.timeout || 30000,
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large repos
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim();
  } catch (error) {
    throw new GitError(`Git command failed: git ${args}`, error instanceof Error ? error : undefined);
  }
}

/**
 * Execute a git command that may fail (returns empty string instead of throwing)
 */
export function gitCommandSafe(args: string, options: GitCommandOptions): string {
  try {
    return gitCommand(args, options);
  } catch {
    return '';
  }
}

/**
 * Custom error class for git operations
 */
export class GitError extends Error {
  public readonly innerError?: Error;

  constructor(message: string, innerError?: Error) {
    super(message);
    this.name = 'GitError';
    this.innerError = innerError;
  }
}

/**
 * Get git log entries in a structured format
 */
export interface GitLogEntry {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  subject: string;
  body: string;
}

/**
 * Parse git log output into structured entries
 * Uses a null-byte separator for reliable parsing
 */
export function getGitLog(repoPath: string, since?: string, limit?: number): GitLogEntry[] {
  let args = 'log --pretty=format:' +
    '%H%x00%h%x00%an%x00%ae%x00%aI%x00%s%x00%b%x01';

  if (since) {
    args += ` --since="${since}"`;
  }
  if (limit) {
    args += ` -n ${limit}`;
  }

  const output = gitCommandSafe(args, { cwd: repoPath });
  if (!output) return [];

  const entries: GitLogEntry[] = [];
  const blocks = output.split('\x01');

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const parts = trimmed.split('\x00');
    if (parts.length >= 6) {
      entries.push({
        hash: parts[0],
        shortHash: parts[1],
        author: parts[2],
        email: parts[3],
        date: parts[4],
        subject: parts[5],
        body: parts[6] || '',
      });
    }
  }

  return entries;
}

/**
 * Get git shortlog summary (contributor stats)
 */
export interface ShortlogEntry {
  name: string;
  commitCount: number;
}

export function getGitShortlog(repoPath: string): ShortlogEntry[] {
  const output = gitCommandSafe(
    'shortlog -sn --all',
    { cwd: repoPath }
  );
  if (!output) return [];

  return output.split('\n').map(line => {
    const match = line.match(/^\s*(\d+)\s+(.+)$/);
    if (match) {
      return { name: match[2].trim(), commitCount: parseInt(match[1], 10) };
    }
    return { name: line.trim(), commitCount: 0 };
  }).filter(e => e.name);
}

/**
 * Get list of tags in the repository
 */
export function getGitTags(repoPath: string): string[] {
  const output = gitCommandSafe('tag --sort=-v:refname', { cwd: repoPath });
  if (!output) return [];
  return output.split('\n').filter(Boolean);
}

/**
 * Get diff stats between two refs
 */
export interface DiffFileStat {
  filePath: string;
  additions: number;
  deletions: number;
}

export function getGitDiffStat(repoPath: string, ref1?: string, ref2?: string): DiffFileStat[] {
  let args = 'diff --numstat';
  if (ref1 && ref2) {
    args += ` ${ref1}..${ref2}`;
  } else if (ref1) {
    args += ` ${ref1}`;
  }

  const output = gitCommandSafe(args, { cwd: repoPath });
  if (!output) return [];

  return output.split('\n').map(line => {
    const parts = line.split('\t');
    if (parts.length >= 3) {
      const additions = parts[0] === '-' ? 0 : parseInt(parts[0], 10);
      const deletions = parts[1] === '-' ? 0 : parseInt(parts[1], 10);
      return { filePath: parts[2], additions, deletions };
    }
    return { filePath: line, additions: 0, deletions: 0 };
  }).filter(e => e.filePath);
}

/**
 * Get per-author line statistics
 */
export interface AuthorLineStats {
  name: string;
  added: number;
  removed: number;
}

export function getAuthorLineStats(repoPath: string): AuthorLineStats[] {
  const output = gitCommandSafe(
    'log --all --format=%aN --numstat --no-merges',
    { cwd: repoPath }
  );
  if (!output) return [];

  const stats: Map<string, { added: number; removed: number }> = new Map();

  for (const line of output.split('\n')) {
    const numMatch = line.match(/^(\d+|-)\t(\d+|-)\t/);
    if (numMatch) {
      // This is a numstat line, skip (we need to track current author)
      continue;
    }
    // This is an author line
    const name = line.trim();
    if (name && !stats.has(name)) {
      stats.set(name, { added: 0, removed: 0 });
    }
  }

  // Re-parse with author tracking
  const lines = output.split('\n');
  let currentAuthor = '';

  for (const line of lines) {
    const numMatch = line.match(/^(\d+|-)\t(\d+|-)\t/);
    if (numMatch) {
      if (!currentAuthor) continue;
      const added = numMatch[1] === '-' ? 0 : parseInt(numMatch[1], 10);
      const removed = numMatch[2] === '-' ? 0 : parseInt(numMatch[2], 10);
      const stat = stats.get(currentAuthor);
      if (stat) {
        stat.added += added;
        stat.removed += removed;
      }
    } else {
      currentAuthor = line.trim();
    }
  }

  return Array.from(stats.entries()).map(([name, s]) => ({
    name,
    added: s.added,
    removed: s.removed,
  }));
}

/**
 * Get files changed per commit for a specific author
 */
export function getAuthorChangedFiles(repoPath: string, author: string): string[] {
  const output = gitCommandSafe(
    `log --all --author="${author}" --name-only --format= --no-merges`,
    { cwd: repoPath }
  );
  if (!output) return [];

  const fileSet = new Set<string>();
  for (const line of output.split('\n')) {
    const trimmed = line.trim();
    if (trimmed) fileSet.add(trimmed);
  }
  return Array.from(fileSet);
}

/**
 * Get commit timestamps for hour-of-day analysis
 */
export function getCommitTimestamps(repoPath: string): { hour: number; day: number; date: string }[] {
  const output = gitCommandSafe(
    'log --all --format=%aI',
    { cwd: repoPath }
  );
  if (!output) return [];

  return output.split('\n').filter(Boolean).map(dateStr => {
    const date = new Date(dateStr);
    return {
      hour: date.getHours(),
      day: date.getDay(), // 0=Sun, 1=Mon, ..., 6=Sat
      date: dateStr,
    };
  });
}

/**
 * Get file change frequency (how many commits touched each file)
 */
export function getFileChangeFrequency(repoPath: string): Map<string, number> {
  const output = gitCommandSafe(
    'log --all --name-only --format= --no-merges',
    { cwd: repoPath }
  );
  if (!output) return new Map();

  const freq = new Map<string, number>();
  for (const line of output.split('\n')) {
    const trimmed = line.trim();
    if (trimmed) {
      freq.set(trimmed, (freq.get(trimmed) || 0) + 1);
    }
  }
  return freq;
}

/**
 * Check if a path is a valid git repository
 */
export function isValidGitRepo(repoPath: string): boolean {
  try {
    const result = execSync('git rev-parse --is-inside-work-tree', {
      cwd: repoPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * Get the repository name from path
 */
export function getRepoName(repoPath: string): string {
  return path.basename(path.resolve(repoPath));
}

/**
 * Get the HEAD branch name
 */
export function getCurrentBranch(repoPath: string): string {
  return gitCommandSafe('rev-parse --abbrev-ref HEAD', { cwd: repoPath }) || 'unknown';
}
