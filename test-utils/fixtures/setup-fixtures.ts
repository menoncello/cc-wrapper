/**
 * Common test fixtures for development environment setup tests
 *
 * Provides reusable test setup and teardown functionality following
 * the fixture architecture pattern for maintainable test infrastructure
 */

import { mock } from 'bun:test'
import * as fs from 'fs'
import * as path from 'path'

// Type definitions for fixture interfaces
export interface TestEnvironment {
  originalConsoleLog: typeof console.log
  originalConsoleError: typeof console.error
  originalPlatform: string
  testDir: string
  originalCwd: string
}

export interface MockConsole {
  log: () => void
  error: () => void
}

export interface FileSystemFixtures {
  createdFiles: string[]
  createdDirs: string[]
}

/**
 * Console mocking fixture - prevents test output pollution
 */
export const setupMockConsole = (): MockConsole => {
  const mockConsole = {
    log: mock(() => {}),
    error: mock(() => {})
  }

  // Store original methods
  const originalConsoleLog = console.log
  const originalConsoleError = console.error

  // Apply mocks
  console.log = mockConsole.log
  console.error = mockConsole.error

  return {
    log: mockConsole.log,
    error: mockConsole.error,
    restore: () => {
      console.log = originalConsoleLog
      console.error = originalConsoleError
    }
  } as MockConsole & { restore: () => void }
}

/**
 * Platform mocking fixture for cross-platform testing
 */
export const setupPlatformMock = (platform: string): () => void => {
  const originalPlatform = process.platform

  Object.defineProperty(process, 'platform', {
    value: platform,
    writable: true,
    configurable: true
  })

  return () => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true
    })
  }
}

/**
 * File system fixture for creating and cleaning up test files/directories
 */
export const setupFileSystemFixture = (): FileSystemFixtures & { cleanup: () => void } => {
  const fixtures: FileSystemFixtures = {
    createdFiles: [],
    createdDirs: []
  }

  const createTestFile = (filePath: string, content: string = ''): void => {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      fixtures.createdDirs.push(dir)
    }

    fs.writeFileSync(filePath, content, 'utf8')
    fixtures.createdFiles.push(filePath)
  }

  const createTestDirectory = (dirPath: string): void => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
      fixtures.createdDirs.push(dirPath)
    }
  }

  const cleanup = (): void => {
    // Clean up files first
    fixtures.createdFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch (error) {
        console.warn(`Failed to clean up file: ${filePath}`, error)
      }
    })

    // Clean up directories (reverse order)
    fixtures.createdDirs.reverse().forEach(dirPath => {
      try {
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true })
        }
      } catch (error) {
        console.warn(`Failed to clean up directory: ${dirPath}`, error)
      }
    })

    // Clear tracking arrays
    fixtures.createdFiles.length = 0
    fixtures.createdDirs.length = 0
  }

  return {
    ...fixtures,
    createTestFile,
    createTestDirectory,
    cleanup
  }
}

/**
 * Environment variables fixture for testing environment configuration
 */
export const setupEnvironmentFixture = (): {
  set: (key: string, value: string) => void
  get: (key: string) => string | undefined
  cleanup: () => void
} => {
  const originalValues: Record<string, string | undefined> = {}

  const set = (key: string, value: string): void => {
    originalValues[key] = process.env[key]
    process.env[key] = value
  }

  const get = (key: string): string | undefined => process.env[key]

  const cleanup = (): void => {
    Object.entries(originalValues).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = value
      } else {
        delete process.env[key]
      }
    })
  }

  return { set, get, cleanup }
}

/**
 * Temporary directory fixture for isolated test environments
 */
export const setupTemporaryDirectory = (baseName: string = 'temp-test'): {
  path: string
  cleanup: () => void
} => {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const dirName = `${baseName}-${timestamp}-${randomSuffix}`
  const testDir = path.join(process.cwd(), dirName)

  // Create temporary directory
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true })
  }

  const cleanup = (): void => {
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true })
      }
    } catch (error) {
      console.warn(`Failed to clean up temporary directory: ${testDir}`, error)
    }
  }

  return { path: testDir, cleanup }
}

/**
 * VS Code configuration fixture for testing editor integration
 */
export const setupVSCodeFixture = (): {
  createSettings: (settings: Record<string, unknown>) => void
  createExtensions: (extensions: string[]) => void
  cleanup: () => void
} => {
  const vscodeDir = '.vscode'
  const createdFiles: string[] = []

  const createSettings = (settings: Record<string, unknown>): void => {
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir, { recursive: true })
    }

    const settingsPath = path.join(vscodeDir, 'settings.json')
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8')
    createdFiles.push(settingsPath)
  }

  const createExtensions = (extensions: string[]): void => {
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir, { recursive: true })
    }

    const extensionsPath = path.join(vscodeDir, 'extensions.json')
    const extensionsConfig = { recommendations: extensions }
    fs.writeFileSync(extensionsPath, JSON.stringify(extensionsConfig, null, 2), 'utf8')
    createdFiles.push(extensionsPath)
  }

  const cleanup = (): void => {
    createdFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch (error) {
        console.warn(`Failed to clean up VS Code file: ${filePath}`, error)
      }
    })

    try {
      if (fs.existsSync(vscodeDir) && fs.readdirSync(vscodeDir).length === 0) {
        fs.rmdirSync(vscodeDir)
      }
    } catch (error) {
      console.warn(`Failed to clean up VS Code directory: ${vscodeDir}`, error)
    }
  }

  return { createSettings, createExtensions, cleanup }
}

/**
 * Complete test environment fixture combining all common fixtures
 */
export const setupTestEnvironment = (): TestEnvironment & {
  mockConsole: MockConsole & { restore: () => void }
  fileSystem: FileSystemFixtures & { cleanup: () => void }
  environment: ReturnType<typeof setupEnvironmentFixture>
  tempDir: ReturnType<typeof setupTemporaryDirectory>
  cleanup: () => void
} => {
  const originalConsoleLog = console.log
  const originalConsoleError = console.error
  const originalPlatform = process.platform
  const originalCwd = process.cwd()

  const mockConsole = setupMockConsole()
  const fileSystem = setupFileSystemFixture()
  const environment = setupEnvironmentFixture()
  const tempDir = setupTemporaryDirectory()

  const cleanup = (): void => {
    // Restore console
    mockConsole.restore?.()

    // Clean up file system
    fileSystem.cleanup()

    // Restore environment variables
    environment.cleanup()

    // Clean up temporary directory
    tempDir.cleanup()

    // Restore platform if changed
    if (process.platform !== originalPlatform) {
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true,
        configurable: true
      })
    }

    // Return to original directory
    if (process.cwd() !== originalCwd) {
      process.chdir(originalCwd)
    }
  }

  return {
    originalConsoleLog,
    originalConsoleError,
    originalPlatform,
    testDir: tempDir.path,
    originalCwd,
    mockConsole,
    fileSystem,
    environment,
    tempDir,
    cleanup
  }
}

/**
 * Performance measurement fixture for timing tests
 */
export const setupPerformanceTimer = (): {
  start: () => void
  end: () => number
  measure: (fn: () => Promise<unknown> | unknown) => Promise<number>
} => {
  let startTime: number

  const start = (): void => {
    startTime = Date.now()
  }

  const end = (): number => {
    return Date.now() - startTime
  }

  const measure = async (fn: () => Promise<unknown> | unknown): Promise<number> => {
    start()
    await fn()
    return end()
  }

  return { start, end, measure }
}