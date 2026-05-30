// File system utility functions
// Handles file traversal, extension identification, and line counting

import * as fs from 'fs';
import * as path from 'path';

/** Known source code file extensions */
export const SOURCE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'scala',
  'c', 'cpp', 'cc', 'cxx', 'h', 'hpp',
  'cs', 'swift', 'dart', 'lua', 'r', 'pl', 'pm',
  'php', 'vue', 'svelte',
]);

/** Test-related directory/file patterns */
export const TEST_PATTERNS = [
  '__tests__',
  '__test__',
  'tests',
  'test',
  'spec',
  'specs',
  '.test.',
  '.spec.',
  '_test.',
  '_spec.',
];

/** Documentation file names */
export const DOC_FILES = [
  'README', 'README.md', 'README.txt', 'README.rst',
  'CONTRIBUTING', 'CONTRIBUTING.md', 'CONTRIBUTING.txt',
  'CHANGELOG', 'CHANGELOG.md',
  'CODE_OF_CONDUCT', 'CODE_OF_CONDUCT.md',
  'ARCHITECTURE', 'ARCHITECTURE.md',
  'docs',
];

/** Dependency-related file names */
export const DEPENDENCY_FILES = [
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'requirements.txt',
  'Pipfile',
  'Pipfile.lock',
  'poetry.lock',
  'Gemfile',
  'Gemfile.lock',
  'Cargo.toml',
  'Cargo.lock',
  'go.mod',
  'go.sum',
  'pom.xml',
  'build.gradle',
  'composer.json',
  'composer.lock',
];

/** Lock file names */
export const LOCK_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'Pipfile.lock',
  'poetry.lock',
  'Gemfile.lock',
  'Cargo.lock',
  'go.sum',
  'composer.lock',
]);

/** PR/Issue related files */
export const COMMUNITY_FILES = [
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/PULL_REQUEST_TEMPLATE',
  '.github/ISSUE_TEMPLATE.md',
  '.github/ISSUE_TEMPLATE',
  '.github/ISSUE_TEMPLATE/bug_report.md',
  '.github/ISSUE_TEMPLATE/feature_request.md',
  'PULL_REQUEST_TEMPLATE.md',
  'ISSUE_TEMPLATE.md',
];

/**
 * Recursively walk a directory and collect file paths
 */
export function walkDirectory(dir: string, maxDepth: number = 20): string[] {
  const results: string[] = [];

  function walk(current: string, depth: number): void {
    if (depth > maxDepth) return;

    // Skip common non-source directories
    const baseName = path.basename(current);
    if (SKIP_DIRS.has(baseName)) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  }

  walk(dir, 0);
  return results;
}

/** Directories to skip during traversal */
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg',
  'vendor', 'bower_components',
  '.next', '.nuxt', 'dist', 'build', 'out',
  '.cache', '.tmp', 'tmp', 'temp',
  '__pycache__', '.pytest_cache',
  'target', 'bin', 'obj',
  '.idea', '.vscode',
  'coverage', '.nyc_output',
]);

/**
 * Get file extension from path
 */
export function getFileExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return ext.startsWith('.') ? ext.slice(1) : ext;
}

/**
 * Check if a file is a source code file
 */
export function isSourceFile(filePath: string): boolean {
  return SOURCE_EXTENSIONS.has(getFileExtension(filePath));
}

/**
 * Check if a file is a test file
 */
export function isTestFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return TEST_PATTERNS.some(pattern => normalized.includes(pattern));
}

/**
 * Check if a file path contains a test directory
 */
export function isInTestDirectory(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  const testDirs = ['__tests__', '__test__', 'tests', 'test', 'spec', 'specs'];
  return testDirs.some(dir => {
    const segments = normalized.split('/');
    return segments.includes(dir);
  });
}

/**
 * Count lines in a file, separating code and comment lines
 */
export function countFileLines(filePath: string): { total: number; code: number; comment: number; blank: number } {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let code = 0;
    let comment = 0;
    let blank = 0;
    let inBlockComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === '') {
        blank++;
        continue;
      }

      if (inBlockComment) {
        comment++;
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
        continue;
      }

      if (trimmed.startsWith('/*')) {
        comment++;
        if (!trimmed.includes('*/')) {
          inBlockComment = true;
        }
        continue;
      }

      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('--')) {
        comment++;
        continue;
      }

      code++;
    }

    return { total: lines.length, code, comment, blank };
  } catch {
    return { total: 0, code: 0, comment: 0, blank: 0 };
  }
}

/**
 * Read file content safely, returns empty string on failure
 */
export function readFileSafe(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 */
export function getFileSize(filePath: string): number {
  try {
    const stat = fs.statSync(filePath);
    return stat.size;
  } catch {
    return 0;
  }
}

/**
 * Check if a file name follows common naming conventions
 * Supports: camelCase, PascalCase, kebab-case, snake_case
 */
export function hasGoodNaming(filePath: string): boolean {
  const name = path.basename(filePath, path.extname(filePath));

  // Allow index, main, app, and common entry points
  const commonNames = new Set([
    'index', 'main', 'app', 'server', 'client',
    'README', 'LICENSE', 'CHANGELOG', 'CONTRIBUTING',
  ]);
  if (commonNames.has(name)) return true;

  // Check for valid naming patterns
  // camelCase or PascalCase
  if (/^[a-z][a-zA-Z0-9]*$/.test(name)) return true;
  // PascalCase
  if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) return true;
  // kebab-case
  if (/^[a-z][a-z0-9-]*$/.test(name) && !name.startsWith('-') && !name.endsWith('-')) return true;
  // snake_case
  if (/^[a-z][a-z0-9_]*$/.test(name) && !name.startsWith('_') && !name.endsWith('_')) return true;

  return false;
}

/**
 * Estimate cyclomatic complexity from file content
 * Counts decision points: if, else if, for, while, do, case, catch, &&, ||
 */
export function estimateCyclomaticComplexity(content: string): number {
  let complexity = 1; // Base complexity

  // Match decision keywords
  const patterns = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bdo\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /&&/g,
    /\|\|/g,
    /\?\?/g,
    /\?[^?.]/g,  // ternary operator
  ];

  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }

  return complexity;
}

/**
 * Count functions and classes in source content
 */
export function countFunctionsAndClasses(content: string): { functions: number; classes: number } {
  let functions = 0;
  let classes = 0;

  // Count function declarations
  const funcPatterns = [
    /\bfunction\s+\w+/g,
    /(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
    /(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?function/g,
    /\w+\s*\([^)]*\)\s*{/g,  // method declarations (approximate)
  ];

  for (const pattern of funcPatterns) {
    const matches = content.match(pattern);
    if (matches) functions += matches.length;
  }

  // Count class declarations
  const classMatches = content.match(/\bclass\s+\w+/g);
  if (classMatches) classes = classMatches.length;

  return { functions, classes };
}

/**
 * Extract import/require dependencies from source content
 */
export function extractDependencies(content: string, currentFilePath: string): string[] {
  const deps: string[] = [];

  // ES module imports
  const importMatches = content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
  for (const match of importMatches) {
    deps.push(match[1]);
  }

  // CommonJS requires
  const requireMatches = content.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
  for (const match of requireMatches) {
    deps.push(match[1]);
  }

  // Filter out built-in modules and relative paths that are not meaningful
  return deps.filter(dep => {
    // Keep relative imports (they represent internal dependencies)
    if (dep.startsWith('.')) return true;
    // Keep non-relative imports (external packages)
    return true;
  });
}

/**
 * Resolve a relative import path to an absolute directory path
 */
export function resolveImportToDirectory(importPath: string, fromFilePath: string): string | null {
  if (!importPath.startsWith('.')) return null; // External dependency

  const dir = path.dirname(fromFilePath);
  const resolved = path.resolve(dir, importPath);

  // Try common extensions and index files
  const candidates = [
    resolved,
    resolved + '.ts',
    resolved + '.tsx',
    resolved + '.js',
    resolved + '.jsx',
    resolved + '.mjs',
    path.join(resolved, 'index.ts'),
    path.join(resolved, 'index.js'),
  ];

  for (const candidate of candidates) {
    if (fileExists(candidate)) {
      return path.dirname(candidate);
    }
  }

  return null;
}
