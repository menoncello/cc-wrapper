/**
 * Project Fixtures for Test Suite
 *
 * Centralizes common setup and utilities for integration tests.
 * Eliminates code duplication across 90+ tests.
 *
 * Usage:
 * ```typescript
 * import { projectFixture } from '../fixtures/project-fixtures';
 *
 * test('some test', () => {
 *   const project = projectFixture();
 *   const packageJson = project.getPackageJson();
 *   expect(packageJson.name).toBeDefined();
 * });
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Project fixture providing common setup and utilities
 */
export const projectFixture = () => {
  const PROJECT_ROOT = path.resolve(import.meta.dir, '../..');

  return {
    /**
     * Get the project root directory path
     */
    projectRoot: PROJECT_ROOT,

    /**
     * Read and parse root package.json
     */
    getPackageJson: () => {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    },

    /**
     * Read and parse tsconfig.json (handles JSONC - JSON with Comments)
     */
    getTsConfig: () => {
      const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
      const content = fs.readFileSync(tsconfigPath, 'utf-8');
      // Strip comments using regex
      const cleaned = content.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\S\s]*?\*\/)/g, (m, g) =>
        g ? '' : m
      );
      return JSON.parse(cleaned);
    },

    /**
     * Check if a file exists relative to project root
     * @param relativePath - Path relative to project root (e.g., 'src/index.ts')
     */
    hasFile: (relativePath: string): boolean => {
      return fs.existsSync(path.join(PROJECT_ROOT, relativePath));
    },

    /**
     * Get full path for a relative path
     * @param relativePath - Path relative to project root
     */
    getPath: (relativePath: string): string => {
      return path.join(PROJECT_ROOT, relativePath);
    },

    /**
     * Read file content relative to project root
     * @param relativePath - Path relative to project root
     */
    readFile: (relativePath: string): string => {
      return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), 'utf-8');
    },

    /**
     * Check if a directory exists and list its contents
     * @param relativePath - Path relative to project root
     */
    listDirectory: (relativePath: string): string[] => {
      const fullPath = path.join(PROJECT_ROOT, relativePath);
      if (!fs.existsSync(fullPath)) {
        return [];
      }
      return fs.readdirSync(fullPath);
    },

    /**
     * Get all subdirectories in a directory
     * @param relativePath - Path relative to project root
     */
    getSubdirectories: (relativePath: string): string[] => {
      const fullPath = path.join(PROJECT_ROOT, relativePath);
      if (!fs.existsSync(fullPath)) {
        return [];
      }
      return fs.readdirSync(fullPath).filter(item => {
        const itemPath = path.join(fullPath, item);
        return fs.statSync(itemPath).isDirectory();
      });
    },

    /**
     * Find files matching a pattern (e.g., '*.test.ts')
     * @param relativePath - Directory path relative to project root
     * @param pattern - File pattern (e.g., '.test.ts', '.md')
     * @param recursive - Search recursively (default: false)
     */
    findFiles: (relativePath: string, pattern: string, recursive = false): string[] => {
      const fullPath = path.join(PROJECT_ROOT, relativePath);
      if (!fs.existsSync(fullPath)) {
        return [];
      }

      const files = fs.readdirSync(fullPath, { recursive });
      return files.filter(file => file.toString().endsWith(pattern)).map(file => file.toString());
    },

    /**
     * Check if package.json has a specific script
     * @param scriptName - Name of the script (e.g., 'build', 'test')
     */
    hasScript: (scriptName: string): boolean => {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return packageJson.scripts?.[scriptName] !== undefined;
    },

    /**
     * Check if package.json has a specific dependency
     * @param depName - Name of the dependency (e.g., 'vite', 'typescript')
     * @param type - Type of dependency ('dependencies' or 'devDependencies')
     */
    hasDependency: (
      depName: string,
      type: 'dependencies' | 'devDependencies' = 'devDependencies'
    ): boolean => {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return packageJson[type]?.[depName] !== undefined;
    },

    /**
     * Get dependency version from package.json
     * @param depName - Name of the dependency
     * @param type - Type of dependency ('dependencies' or 'devDependencies')
     */
    getDependencyVersion: (
      depName: string,
      type: 'dependencies' | 'devDependencies' = 'devDependencies'
    ): string | undefined => {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return packageJson[type]?.[depName];
    }
  };
};

// Re-export factories from dedicated module
export {
  expectedDependencies,
  expectedFiles,
  expectedScripts,
  expectedTsConfig,
  expectedWorkspaces,
  matchesDependencyPattern
} from '../factories/expected-config';
