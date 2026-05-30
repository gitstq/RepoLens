// Architecture dependency analyzer
// Analyzes import/require dependencies between modules, detects cycles, and calculates coupling

import * as path from 'path';
import { ArchitectureResult, DependencyEdge, ModuleMetrics, DependencyCycle } from '../types';
import { walkDirectory, isSourceFile, extractDependencies, resolveImportToDirectory, readFileSafe } from '../utils/files';

/**
 * Analyze architecture dependencies for a repository
 */
export function analyzeArchitecture(repoPath: string): ArchitectureResult {
  const files = walkDirectory(repoPath);
  const sourceFiles = files.filter(isSourceFile);

  // Build dependency graph
  const dependencies: DependencyEdge[] = [];
  const moduleMap = new Map<string, Set<string>>();

  for (const file of sourceFiles) {
    const content = readFileSafe(file);
    const imports = extractDependencies(content, file);
    const fromDir = getModuleKey(path.relative(repoPath, file));

    if (!moduleMap.has(fromDir)) {
      moduleMap.set(fromDir, new Set());
    }

    for (const imp of imports) {
      const resolvedDir = resolveImportToDirectory(imp, file);
      if (resolvedDir) {
        const toDir = getModuleKey(path.relative(repoPath, resolvedDir));
        if (toDir !== fromDir) {
          moduleMap.get(fromDir)!.add(toDir);

          // Check if edge already exists
          const existing = dependencies.find(d => d.from === fromDir && d.to === toDir);
          if (existing) {
            existing.count++;
          } else {
            dependencies.push({ from: fromDir, to: toDir, count: 1 });
          }
        }
      }
    }
  }

  // Calculate module metrics
  const modules = calculateModuleMetrics(moduleMap, dependencies);

  // Detect cycles
  const cycles = detectCycles(moduleMap);

  // Calculate average coupling
  const averageCoupling = modules.length > 0
    ? Math.round(modules.reduce((sum, m) => sum + m.couplingScore, 0) / modules.length * 100) / 100
    : 0;

  return {
    modules,
    dependencies,
    cycles,
    totalModules: modules.length,
    totalDependencies: dependencies.length,
    averageCoupling,
  };
}

/**
 * Get a module key from a file path (parent directory)
 */
function getModuleKey(relativeFilePath: string): string {
  const dir = path.dirname(relativeFilePath);
  // Normalize to forward slashes
  return dir.replace(/\\/g, '/');
}

/**
 * Calculate metrics for each module
 */
function calculateModuleMetrics(
  moduleMap: Map<string, Set<string>>,
  dependencies: DependencyEdge[]
): ModuleMetrics[] {
  const modules: ModuleMetrics[] = [];

  for (const [modulePath, deps] of moduleMap) {
    const incomingDeps = dependencies.filter(d => d.to === modulePath).length;
    const outgoingDeps = deps.size;

    // Coupling score: normalized sum of incoming and outgoing dependencies
    const maxDeps = Math.max(moduleMap.size - 1, 1);
    const couplingScore = Math.round(
      ((incomingDeps + outgoingDeps) / (2 * maxDeps)) * 100
    );

    modules.push({
      path: modulePath,
      incomingDeps,
      outgoingDeps,
      couplingScore,
    });
  }

  // Sort by coupling score (highest first)
  modules.sort((a, b) => b.couplingScore - a.couplingScore);

  return modules;
}

/**
 * Detect circular dependencies using DFS
 */
function detectCycles(moduleMap: Map<string, Set<string>>): DependencyCycle[] {
  const cycles: DependencyCycle[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): void {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = moduleMap.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          const cyclePath = [...path.slice(cycleStart), neighbor];
          // Avoid duplicate cycles (normalize by starting from smallest element)
          const normalizedCycle = normalizeCycle(cyclePath);
          const cycleKey = normalizedCycle.join(' -> ');
          if (!cycles.some(c => c.path.join(' -> ') === cycleKey)) {
            cycles.push({ path: normalizedCycle });
          }
        }
      }
    }

    path.pop();
    recursionStack.delete(node);
  }

  for (const module of moduleMap.keys()) {
    if (!visited.has(module)) {
      dfs(module);
    }
  }

  return cycles.slice(0, 20); // Limit to 20 cycles
}

/**
 * Normalize a cycle path to start from the lexicographically smallest element
 */
function normalizeCycle(cyclePath: string[]): string[] {
  if (cyclePath.length <= 1) return cyclePath;

  // Remove the last element (it's a duplicate of the first)
  const unique = cyclePath.slice(0, -1);

  // Find the minimum element
  let minIdx = 0;
  for (let i = 1; i < unique.length; i++) {
    if (unique[i] < unique[minIdx]) {
      minIdx = i;
    }
  }

  // Rotate to start from minimum
  const rotated = [...unique.slice(minIdx), ...unique.slice(0, minIdx), unique[minIdx]];
  return rotated;
}
