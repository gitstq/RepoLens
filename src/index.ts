#!/usr/bin/env node
// RepoLens CLI Entry Point
// Lightweight Git repository multi-dimensional intelligent analysis engine

import * as fs from 'fs';
import * as path from 'path';
import { CLIOptions, OutputFormat, AnalysisResult, ComparisonResult, ChangelogResult } from './types';
import { isValidGitRepo, getRepoName } from './utils/git';
import { setColorEnabled, c, sectionHeader, step, progressBar, gradeColor, scoreBadge } from './utils/colors';
import { analyzeHealth } from './analyzer/health';
import { analyzeComplexity } from './analyzer/complexity';
import { analyzeContributors } from './analyzer/contributors';
import { analyzeArchitecture } from './analyzer/architecture';
import { generateChangelog } from './analyzer/changelog';
import { reportJSON, reportComparisonJSON, reportChangelogJSON } from './reporter/json';
import { reportMarkdown, reportComparisonMarkdown, reportChangelogMarkdown } from './reporter/markdown';
import { reportHTML, reportComparisonHTML, reportChangelogHTML } from './reporter/html';

// ============================================================
// CLI Argument Parsing
// ============================================================

const VERSION = '1.0.0';

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): CLIOptions | null {
  const command = args[2];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  if (command === 'version' || command === '--version' || command === '-v') {
    console.log(`RepoLens v${VERSION}`);
    process.exit(0);
  }

  if (!['analyze', 'compare', 'changelog'].includes(command)) {
    console.error(c.red(`Unknown command: ${command}`));
    console.error(c.dim('Run "repolens help" for usage information.'));
    process.exit(1);
  }

  // Parse options
  let format: OutputFormat = 'markdown';
  let output: string | undefined;
  let verbose = false;
  let noColor = false;
  const paths: string[] = [];

  for (let i = 3; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--format' || arg === '-f') {
      const val = args[++i];
      if (['json', 'markdown', 'html'].includes(val)) {
        format = val as OutputFormat;
      } else {
        console.error(c.red(`Invalid format: ${val}`));
        console.error(c.dim('Supported formats: json, markdown, html'));
        process.exit(1);
      }
    } else if (arg === '--output' || arg === '-o') {
      output = args[++i];
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    } else if (arg === '--no-color') {
      noColor = true;
    } else if (!arg.startsWith('-')) {
      paths.push(arg);
    }
  }

  // Validate paths
  if (command === 'analyze' || command === 'changelog') {
    if (paths.length === 0) {
      console.error(c.red('Error: Please specify a repository path.'));
      console.error(c.dim(`Usage: repolens ${command} <path>`));
      process.exit(1);
    }
  }

  if (command === 'compare') {
    if (paths.length < 2) {
      console.error(c.red('Error: Please specify two repository paths for comparison.'));
      console.error(c.dim('Usage: repolens compare <path1> <path2>'));
      process.exit(1);
    }
  }

  return {
    command: command as CLIOptions['command'],
    paths,
    format,
    output,
    verbose,
    noColor,
  };
}

/**
 * Print help information
 */
function printHelp(): void {
  console.log(`
${c.cyan(c.bold('RepoLens'))} - Git Repository Multi-dimensional Analysis Engine v${VERSION}

${c.bold('USAGE')}
  repolens <command> [options] [paths...]

${c.bold('COMMANDS')}
  ${c.green('analyze')}   <path>       Analyze a single repository
  ${c.green('compare')}   <path1> <path2>  Compare two repositories
  ${c.green('changelog')} <path>       Generate changelog from git history

${c.bold('OPTIONS')}
  ${c.yellow('-f, --format')} <format>   Output format: json, markdown, html (default: markdown)
  ${c.yellow('-o, --output')} <file>     Write output to file instead of stdout
  ${c.yellow('-v, --verbose')}          Show detailed progress information
  ${c.yellow('--no-color')}             Disable colored output

${c.bold('EXAMPLES')}
  repolens analyze ./my-project
  repolens analyze ./my-project --format html --output report.html
  repolens compare ./project-a ./project-b --format json
  repolens changelog ./my-project --format markdown

${c.bold('ANALYSIS DIMENSIONS')}
  Health Score (6 dimensions): Code Quality, Commit Activity, Dependency Safety,
    Documentation Coverage, Test Coverage, Community Activity
  Code Complexity: File metrics, hot files, refactoring suggestions
  Contributors: Rankings, roles, collaboration network
  Architecture: Module dependencies, cycle detection, coupling analysis
`);
}

// ============================================================
// Main Execution
// ============================================================

function main(): void {
  const args = process.argv;
  const options = parseArgs(args);

  if (!options) return;

  // Configure color output
  setColorEnabled(!options.noColor);

  // Check for NO_COLOR environment variable
  if (process.env.NO_COLOR) {
    setColorEnabled(false);
  }

  try {
    switch (options.command) {
      case 'analyze':
        runAnalyze(options);
        break;
      case 'compare':
        runCompare(options);
        break;
      case 'changelog':
        runChangelog(options);
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(c.red(`\nError: ${message}`));
    process.exit(1);
  }
}

// ============================================================
// Analyze Command
// ============================================================

function runAnalyze(options: CLIOptions): void {
  const repoPath = path.resolve(options.paths[0]);

  // Validate repository
  if (!fs.existsSync(repoPath)) {
    console.error(c.red(`Error: Path does not exist: ${repoPath}`));
    process.exit(1);
  }

  if (!isValidGitRepo(repoPath)) {
    console.error(c.red(`Error: Not a valid Git repository: ${repoPath}`));
    process.exit(1);
  }

  const repoName = getRepoName(repoPath);

  // Print banner
  console.log('');
  console.log(c.cyan(c.bold('  ╦ ╦┌─┐┬  ┬┌─┐┌┐ ╔╗╔╔═╗╦ ╦')));
  console.log(c.cyan(c.bold('  ║║║├┤ └┐┌┘├┤ ├┴┐║║║║ ║║║║')));
  console.log(c.cyan(c.bold('  ╚╩╝└─┘ └┘ └─┘└─┘╚╝╚╚═╝╚╩╝')));
  console.log('');
  console.log(c.dim(`  Analyzing: ${repoName}`));
  console.log(c.dim(`  Path: ${repoPath}`));
  console.log('');

  const totalSteps = 4;
  let currentStep = 0;

  // Step 1: Health Analysis
  currentStep++;
  console.log(step(currentStep, totalSteps, 'Analyzing repository health...'));
  const health = analyzeHealth(repoPath);
  const gradeFn = gradeColor(health.grade);
  console.log(`  ${c.dim('Overall Score:')} ${gradeFn(c.bold(` ${health.totalScore}/100 (${health.grade}) `))}`);
  if (options.verbose) {
    for (const dim of health.dimensions) {
      console.log(`    ${c.dim(`${dim.name}:`)} ${scoreBadge(dim.score)} ${c.dim(dim.details.substring(0, 60))}`);
    }
  }

  // Step 2: Complexity Analysis
  currentStep++;
  console.log(step(currentStep, totalSteps, 'Analyzing code complexity...'));
  const complexity = analyzeComplexity(repoPath);
  console.log(`  ${c.dim('Files:')} ${complexity.totalFiles}  ${c.dim('Lines:')} ${complexity.totalLines}  ${c.dim('Avg Complexity:')} ${complexity.averageComplexity}`);
  if (options.verbose && complexity.hotFiles.length > 0) {
    console.log(`  ${c.yellow('Hot files detected:')} ${complexity.hotFiles.length}`);
  }

  // Step 3: Contributors Analysis
  currentStep++;
  console.log(step(currentStep, totalSteps, 'Analyzing contributors...'));
  const contributors = analyzeContributors(repoPath);
  console.log(`  ${c.dim('Contributors:')} ${contributors.totalContributors}  ${c.dim('Core:')} ${contributors.coreContributors}`);
  if (options.verbose && contributors.contributors.length > 0) {
    console.log(`  ${c.dim('Top contributor:')} ${c.green(contributors.contributors[0].name)} (${contributors.contributors[0].commitCount} commits)`);
  }

  // Step 4: Architecture Analysis
  currentStep++;
  console.log(step(currentStep, totalSteps, 'Analyzing architecture...'));
  const architecture = analyzeArchitecture(repoPath);
  console.log(`  ${c.dim('Modules:')} ${architecture.totalModules}  ${c.dim('Dependencies:')} ${architecture.totalDependencies}  ${c.dim('Cycles:')} ${architecture.cycles.length}`);
  if (options.verbose && architecture.cycles.length > 0) {
    console.log(`  ${c.red('Circular dependencies detected!')}`);
  }

  // Build result
  const result: AnalysisResult = {
    repositoryPath: repoPath,
    repositoryName: repoName,
    health,
    complexity,
    contributors,
    architecture,
    analyzedAt: new Date().toISOString(),
  };

  // Generate output
  console.log('');
  console.log(sectionHeader('Generating Report'));

  let output: string;
  switch (options.format) {
    case 'json':
      output = reportJSON(result);
      break;
    case 'html':
      output = reportHTML(result);
      break;
    case 'markdown':
    default:
      output = reportMarkdown(result);
      break;
  }

  // Write to file or stdout
  if (options.output) {
    const outputPath = path.resolve(options.output);
    const dir = path.dirname(outputPath);
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, output, 'utf-8');
    console.log(c.green(`\n  Report saved to: ${outputPath}\n`));
  } else {
    console.log(output);
  }
}

// ============================================================
// Compare Command
// ============================================================

function runCompare(options: CLIOptions): void {
  const repoPath1 = path.resolve(options.paths[0]);
  const repoPath2 = path.resolve(options.paths[1]);

  // Validate both repositories
  for (const [idx, repoPath] of [repoPath1, repoPath2].entries()) {
    if (!fs.existsSync(repoPath)) {
      console.error(c.red(`Error: Path does not exist: ${repoPath}`));
      process.exit(1);
    }
    if (!isValidGitRepo(repoPath)) {
      console.error(c.red(`Error: Not a valid Git repository: ${repoPath}`));
      process.exit(1);
    }
  }

  const name1 = getRepoName(repoPath1);
  const name2 = getRepoName(repoPath2);

  console.log('');
  console.log(c.cyan(c.bold('  RepoLens - Repository Comparison')));
  console.log('');
  console.log(c.dim(`  Comparing: ${name1} vs ${name2}`));
  console.log('');

  // Analyze both repos
  console.log(step(1, 2, `Analyzing ${name1}...`));
  const result1: AnalysisResult = {
    repositoryPath: repoPath1,
    repositoryName: name1,
    health: analyzeHealth(repoPath1),
    complexity: analyzeComplexity(repoPath1),
    contributors: analyzeContributors(repoPath1),
    architecture: analyzeArchitecture(repoPath1),
    analyzedAt: new Date().toISOString(),
  };

  console.log(step(2, 2, `Analyzing ${name2}...`));
  const result2: AnalysisResult = {
    repositoryPath: repoPath2,
    repositoryName: name2,
    health: analyzeHealth(repoPath2),
    complexity: analyzeComplexity(repoPath2),
    contributors: analyzeContributors(repoPath2),
    architecture: analyzeArchitecture(repoPath2),
    analyzedAt: new Date().toISOString(),
  };

  // Calculate health differences
  const healthDiff = result1.health.dimensions.map(dim1 => {
    const dim2 = result2.health.dimensions.find(d => d.name === dim1.name);
    return {
      dimension: dim1.name,
      repo1Score: dim1.score,
      repo2Score: dim2?.score || 0,
      diff: dim1.score - (dim2?.score || 0),
    };
  });

  const overallWinner = result1.health.totalScore >= result2.health.totalScore
    ? result1.repositoryName
    : result2.repositoryName;

  const comparisonResult: ComparisonResult = {
    repo1: result1,
    repo2: result2,
    healthDiff,
    overallWinner,
  };

  // Generate output
  let output: string;
  switch (options.format) {
    case 'json':
      output = reportComparisonJSON(comparisonResult);
      break;
    case 'html':
      output = reportComparisonHTML(comparisonResult);
      break;
    case 'markdown':
    default:
      output = reportComparisonMarkdown(comparisonResult);
      break;
  }

  if (options.output) {
    const outputPath = path.resolve(options.output);
    const dir = path.dirname(outputPath);
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, output, 'utf-8');
    console.log(c.green(`\n  Comparison report saved to: ${outputPath}\n`));
  } else {
    console.log(output);
  }
}

// ============================================================
// Changelog Command
// ============================================================

function runChangelog(options: CLIOptions): void {
  const repoPath = path.resolve(options.paths[0]);

  if (!fs.existsSync(repoPath)) {
    console.error(c.red(`Error: Path does not exist: ${repoPath}`));
    process.exit(1);
  }

  if (!isValidGitRepo(repoPath)) {
    console.error(c.red(`Error: Not a valid Git repository: ${repoPath}`));
    process.exit(1);
  }

  const repoName = getRepoName(repoPath);

  console.log('');
  console.log(c.cyan(c.bold('  RepoLens - Changelog Generator')));
  console.log('');
  console.log(step(1, 1, `Generating changelog for ${repoName}...`));

  const changelogResult = generateChangelog(repoPath);

  console.log(`  ${c.dim('Versions:')} ${changelogResult.versions.length}  ${c.dim('Unreleased:')} ${changelogResult.unreleased.length}`);

  // Generate output
  let output: string;
  switch (options.format) {
    case 'json':
      output = reportChangelogJSON(changelogResult);
      break;
    case 'html':
      output = reportChangelogHTML(changelogResult);
      break;
    case 'markdown':
    default:
      output = reportChangelogMarkdown(changelogResult);
      break;
  }

  if (options.output) {
    const outputPath = path.resolve(options.output);
    const dir = path.dirname(outputPath);
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, output, 'utf-8');
    console.log(c.green(`\n  Changelog saved to: ${outputPath}\n`));
  } else {
    console.log(output);
  }
}

// Run
main();
