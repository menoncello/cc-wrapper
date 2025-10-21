/**
 * Test Utilities for Infrastructure Tests
 *
 * Provides helper functions for:
 * - File system operations
 * - Command execution
 * - Configuration validation
 * - Performance measurement
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * Check if a file exists at the given path
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Check if a directory exists at the given path
 */
export function directoryExists(dirPath: string): boolean {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

/**
 * Read and parse JSON file
 */
export function readJsonFile<T = unknown>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Read package.json from project root
 */
export function readPackageJson(): {
  name: string;
  version: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  workspaces?: string[];
  [key: string]: unknown;
} {
  const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
  return readJsonFile(packageJsonPath);
}

/**
 * Execute a command and return stdout
 */
export async function runCommand(
  command: string,
  options: { cwd?: string; timeout?: number } = {}
): Promise<{ stdout: string; stderr: string; success: boolean }> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: options.cwd || PROJECT_ROOT,
      timeout: options.timeout || 30000
    });
    return { stdout, stderr, success: true };
  } catch (error) {
    return {
      stdout: (error as { stdout?: string }).stdout || '',
      stderr: (error as { stderr?: string }).stderr || '',
      success: false
    };
  }
}

/**
 * Measure execution time of a function
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; timeInSeconds: number }> {
  const startTime = Date.now();
  const result = await fn();
  const timeInSeconds = (Date.now() - startTime) / 1000;
  return { result, timeInSeconds };
}

/**
 * Check if npm script exists in package.json
 */
export function scriptExists(scriptName: string): boolean {
  const packageJson = readPackageJson();
  return packageJson.scripts?.[scriptName] !== undefined;
}

/**
 * Check if a package is installed in dependencies or devDependencies
 */
export function packageInstalled(packageName: string): boolean {
  const packageJson = readPackageJson();
  return (
    packageJson.dependencies?.[packageName] !== undefined ||
    packageJson.devDependencies?.[packageName] !== undefined
  );
}

/**
 * Get version of installed package
 */
export function getPackageVersion(packageName: string): string | null {
  const packageJson = readPackageJson();
  return (
    packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName] || null
  );
}

/**
 * List all files in a directory recursively
 */
export function listFiles(dirPath: string, extension?: string): string[] {
  if (!directoryExists(dirPath)) {
    return [];
  }

  const files: string[] = [];
  const items = fs.readdirSync(dirPath, { recursive: true });

  items.forEach(item => {
    const fullPath = path.join(dirPath, item.toString());
    if (fs.statSync(fullPath).isFile()) {
      if (!extension || fullPath.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  });

  return files;
}

/**
 * Count files matching a pattern in a directory
 */
export function countFiles(dirPath: string, pattern: RegExp): number {
  const files = listFiles(dirPath);
  return files.filter(file => pattern.test(file)).length;
}

/**
 * Check if file contains specific text
 */
export function fileContains(filePath: string, searchText: string): boolean {
  if (!fileExists(filePath)) {
    return false;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes(searchText);
}

/**
 * Verify workspace structure
 */
export function verifyWorkspaceStructure(): {
  hasPackages: boolean;
  hasServices: boolean;
  hasApps: boolean;
  hasTests: boolean;
  hasDocs: boolean;
} {
  return {
    hasPackages: directoryExists(path.join(PROJECT_ROOT, 'packages')),
    hasServices: directoryExists(path.join(PROJECT_ROOT, 'services')),
    hasApps: directoryExists(path.join(PROJECT_ROOT, 'apps')),
    hasTests: directoryExists(path.join(PROJECT_ROOT, 'tests')),
    hasDocs: directoryExists(path.join(PROJECT_ROOT, 'docs'))
  };
}

/**
 * Get list of workspace packages
 */
export function getWorkspacePackages(workspaceDir: 'packages' | 'services' | 'apps'): string[] {
  const workspacePath = path.join(PROJECT_ROOT, workspaceDir);
  if (!directoryExists(workspacePath)) {
    return [];
  }

  return fs.readdirSync(workspacePath).filter(item => {
    const itemPath = path.join(workspacePath, item);
    return fs.statSync(itemPath).isDirectory();
  });
}

/**
 * Verify configuration file exists and is valid
 */
export function verifyConfig(configFileName: string): {
  exists: boolean;
  valid: boolean;
  error?: string;
} {
  const configPath = path.join(PROJECT_ROOT, configFileName);

  if (!fileExists(configPath)) {
    return { exists: false, valid: false, error: 'File does not exist' };
  }

  try {
    if (configFileName.endsWith('.json')) {
      readJsonFile(configPath);
    } else {
      fs.readFileSync(configPath, 'utf-8');
    }
    return { exists: true, valid: true };
  } catch (error) {
    return {
      exists: true,
      valid: false,
      error: (error as Error).message
    };
  }
}

/**
 * Check if Git is configured
 */
export function isGitRepository(): boolean {
  return directoryExists(path.join(PROJECT_ROOT, '.git'));
}

/**
 * Get list of required configuration files for the project
 */
export function getRequiredConfigs(): string[] {
  return [
    'package.json',
    'tsconfig.json',
    'playwright.config.ts',
    'vite.config.ts',
    'eslint.config.js',
    'prettier.config.js',
    'stryker.config.json'
  ];
}

/**
 * Get list of required documentation files
 */
export function getRequiredDocs(): string[] {
  return [
    'README.md',
    'CONTRIBUTING.md',
    'CODE_OF_CONDUCT.md',
    'LICENSE',
    'docs/development-workflow.md',
    'docs/build-process.md',
    'docs/deployment.md',
    'docs/troubleshooting.md'
  ];
}
