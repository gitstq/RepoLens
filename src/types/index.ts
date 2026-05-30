// RepoLens type definitions

/** Supported output formats */
export type OutputFormat = 'json' | 'markdown' | 'html';

/** CLI command type */
export type CommandType = 'analyze' | 'compare' | 'changelog';

/** CLI options */
export interface CLIOptions {
  command: CommandType;
  paths: string[];
  format: OutputFormat;
  output?: string;
  verbose: boolean;
  noColor: boolean;
}

// ============================================================
// Health Analysis Types
// ============================================================

/** Single dimension score for health analysis */
export interface HealthDimension {
  name: string;
  score: number; // 0-100
  details: string;
  weight: number;
}

/** Overall health analysis result */
export interface HealthResult {
  dimensions: HealthDimension[];
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
}

// ============================================================
// Complexity Analysis Types
// ============================================================

/** Complexity metrics for a single file */
export interface FileComplexity {
  filePath: string;
  lines: number;
  codeLines: number;
  commentLines: number;
  functionCount: number;
  classCount: number;
  cyclomaticComplexity: number;
}

/** Hot file that is both complex and frequently modified */
export interface HotFile {
  filePath: string;
  complexity: number;
  changeCount: number;
  score: number;
}

/** Overall complexity analysis result */
export interface ComplexityResult {
  files: FileComplexity[];
  hotFiles: HotFile[];
  averageComplexity: number;
  totalFiles: number;
  totalLines: number;
  refactorSuggestions: string[];
}

// ============================================================
// Contributor Analysis Types
// ============================================================

/** Single contributor profile */
export interface ContributorProfile {
  name: string;
  email: string;
  commitCount: number;
  linesAdded: number;
  linesDeleted: number;
  firstCommit: string;
  lastCommit: string;
  activeHours: number[]; // 0-23 hour buckets
  activeDays: number[]; // 0-6 day buckets (Mon-Sun)
  topFiles: string[];
  role: 'core' | 'regular' | 'occasional';
}

/** Collaboration edge between two contributors */
export interface CollaborationEdge {
  contributor1: string;
  contributor2: string;
  sharedFiles: number;
  sharedFileList: string[];
}

/** Overall contributor analysis result */
export interface ContributorsResult {
  contributors: ContributorProfile[];
  collaborationNetwork: CollaborationEdge[];
  totalContributors: number;
  coreContributors: number;
}

// ============================================================
// Architecture Analysis Types
// ============================================================

/** Module dependency edge */
export interface DependencyEdge {
  from: string;
  to: string;
  count: number;
}

/** Module metrics */
export interface ModuleMetrics {
  path: string;
  incomingDeps: number;
  outgoingDeps: number;
  couplingScore: number;
}

/** Cycle detected in dependency graph */
export interface DependencyCycle {
  path: string[];
}

/** Overall architecture analysis result */
export interface ArchitectureResult {
  modules: ModuleMetrics[];
  dependencies: DependencyEdge[];
  cycles: DependencyCycle[];
  totalModules: number;
  totalDependencies: number;
  averageCoupling: number;
}

// ============================================================
// Changelog Types
// ============================================================

/** A single changelog entry */
export interface ChangelogEntry {
  hash: string;
  type: 'feat' | 'fix' | 'docs' | 'refactor' | 'test' | 'chore' | 'perf' | 'style' | 'other';
  scope?: string;
  description: string;
  author: string;
  date: string;
}

/** A version section in the changelog */
export interface ChangelogVersion {
  version: string;
  date: string;
  entries: ChangelogEntry[];
}

/** Overall changelog result */
export interface ChangelogResult {
  versions: ChangelogVersion[];
  unreleased: ChangelogEntry[];
}

// ============================================================
// Full Analysis Report
// ============================================================

/** Complete analysis result for a single repository */
export interface AnalysisResult {
  repositoryPath: string;
  repositoryName: string;
  health: HealthResult;
  complexity: ComplexityResult;
  contributors: ContributorsResult;
  architecture: ArchitectureResult;
  analyzedAt: string;
}

/** Comparison result between two repositories */
export interface ComparisonResult {
  repo1: AnalysisResult;
  repo2: AnalysisResult;
  healthDiff: {
    dimension: string;
    repo1Score: number;
    repo2Score: number;
    diff: number;
  }[];
  overallWinner: string;
}
