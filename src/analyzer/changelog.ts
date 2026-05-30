// Smart changelog generator
// Generates Conventional Commits formatted changelog from git history

import { ChangelogResult, ChangelogVersion, ChangelogEntry } from '../types';
import { getGitLog, getGitTags, gitCommandSafe } from '../utils/git';

/**
 * Generate a changelog from git history
 */
export function generateChangelog(repoPath: string): ChangelogResult {
  const logs = getGitLog(repoPath);
  const tags = getGitTags(repoPath);

  if (logs.length === 0) {
    return { versions: [], unreleased: [] };
  }

  // Parse all entries
  const allEntries = logs.map(parseLogEntry).filter((e): e is ChangelogEntry => e !== null);

  if (tags.length === 0) {
    // No tags - put everything in unreleased
    return { versions: [], unreleased: allEntries };
  }

  // Group entries by version
  const versions: ChangelogVersion[] = [];
  const unreleased: ChangelogEntry[] = [];

  // Sort tags by version (descending)
  const sortedTags = [...tags].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  for (let i = 0; i < sortedTags.length; i++) {
    const currentTag = sortedTags[i];
    const nextTag = i < sortedTags.length - 1 ? sortedTags[i + 1] : null;

    // Get the date of this tag
    const tagDate = getTagDate(repoPath, currentTag);

    // Get commits between nextTag and currentTag
    let rangeLogs = logs;
    if (nextTag) {
      rangeLogs = logs.filter(l => {
        const tagIdx = tags.indexOf(nextTag);
        // Simple approach: filter by date
        return true;
      });
    }

    // Use git log with range for accuracy
    const rangeArgs = nextTag
      ? `log ${nextTag}..${currentTag} --pretty=format:%H%x00%h%x00%an%x00%ae%x00%aI%x00%s%x00%b%x01`
      : `log ${currentTag} --pretty=format:%H%x00%h%x00%an%x00%ae%x00%aI%x00%s%x00%b%x01 -n 100`;

    const rangeOutput = gitCommandSafe(rangeArgs, { cwd: repoPath });
    const rangeEntries = parseGitLogOutput(rangeOutput)
      .map(parseLogEntry)
      .filter((e): e is ChangelogEntry => e !== null);

    if (rangeEntries.length > 0 || i === 0) {
      versions.push({
        version: currentTag,
        date: tagDate || 'Unknown',
        entries: i === 0 ? rangeEntries : rangeEntries,
      });
    }
  }

  // Get unreleased entries (commits after latest tag)
  const latestTag = sortedTags[0];
  const unreleasedOutput = gitCommandSafe(
    `log ${latestTag}..HEAD --pretty=format:%H%x00%h%x00%an%x00%ae%x00%aI%x00%s%x00%b%x01`,
    { cwd: repoPath }
  );
  const unreleasedEntries = parseGitLogOutput(unreleasedOutput)
    .map(parseLogEntry)
    .filter((e): e is ChangelogEntry => e !== null);

  return {
    versions: versions.reverse(), // Oldest first
    unreleased: unreleasedEntries,
  };
}

/**
 * Parse git log output with null-byte separators
 */
interface RawLogEntry {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  subject: string;
  body: string;
}

function parseGitLogOutput(output: string): RawLogEntry[] {
  if (!output) return [];

  const entries: RawLogEntry[] = [];
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
 * Parse a raw log entry into a ChangelogEntry with type classification
 */
function parseLogEntry(entry: RawLogEntry): ChangelogEntry | null {
  if (!entry.subject) return null;

  const { type, scope, description } = parseConventionalCommit(entry.subject);

  return {
    hash: entry.shortHash,
    type,
    scope,
    description: description || entry.subject,
    author: entry.author,
    date: entry.date,
  };
}

/**
 * Parse a commit message following Conventional Commits format
 * Format: type(scope): description
 */
function parseConventionalCommit(
  message: string
): { type: ChangelogEntry['type']; scope?: string; description: string } {
  // Match conventional commit pattern
  const match = message.match(/^(\w+)(?:\(([^)]+)\))?\s*:\s*(.+)$/);

  if (match) {
    const type = match[1].toLowerCase();
    const scope = match[2] || undefined;
    const description = match[3];

    // Map to known types
    const knownTypes: Set<string> = new Set([
      'feat', 'fix', 'docs', 'refactor', 'test', 'chore', 'perf', 'style',
    ]);

    return {
      type: knownTypes.has(type) ? (type as ChangelogEntry['type']) : 'other',
      scope,
      description,
    };
  }

  // Try to infer type from common prefixes
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.startsWith('add') || lowerMessage.startsWith('implement') ||
      lowerMessage.startsWith('create') || lowerMessage.startsWith('introduce')) {
    return { type: 'feat', description: message };
  }
  if (lowerMessage.startsWith('fix') || lowerMessage.startsWith('bug') ||
      lowerMessage.startsWith('patch') || lowerMessage.startsWith('resolve')) {
    return { type: 'fix', description: message };
  }
  if (lowerMessage.startsWith('update') || lowerMessage.startsWith('bump')) {
    return { type: 'chore', description: message };
  }
  if (lowerMessage.startsWith('doc') || lowerMessage.startsWith('readme')) {
    return { type: 'docs', description: message };
  }
  if (lowerMessage.startsWith('refactor') || lowerMessage.startsWith('clean')) {
    return { type: 'refactor', description: message };
  }
  if (lowerMessage.startsWith('test')) {
    return { type: 'test', description: message };
  }

  return { type: 'other', description: message };
}

/**
 * Get the date of a git tag
 */
function getTagDate(repoPath: string, tag: string): string {
  const output = gitCommandSafe(
    `log -1 --format=%aI ${tag}`,
    { cwd: repoPath }
  );
  return output || '';
}
