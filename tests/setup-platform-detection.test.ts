/**
 * Tests for Platform Detection in Development Environment Setup
 *
 * Tests cover:
 * - Platform detection logic for macOS, Linux, Windows
 * - Architecture detection
 * - Package manager detection
 * - Error handling for unsupported platforms
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { SetupEnvironment } from '../setup'
import { setupMockConsole, setupPlatformMock } from '../test-utils/fixtures/setup-fixtures'

// Type definitions for test interfaces
interface SetupEnvironmentInstance {
  detectPlatform(): {
    os: string
    arch: string
    packageManager: string
  }
}

describe('Platform Detection - P0 Critical Core Functionality', () => {
  let mockConsole: ReturnType<typeof setupMockConsole>

  beforeEach(() => {
    mockConsole = setupMockConsole()
  })

  afterEach(() => {
    mockConsole.restore?.()
  })

  describe('Supported Platforms', () => {
    test('1.1-E2E-001: should detect macOS platform correctly', () => {
      const restorePlatform = setupPlatformMock('darwin')

      try {
        const setup = new SetupEnvironment()
        const platformInfo = (setup as SetupEnvironmentInstance).detectPlatform()

        expect(platformInfo.os).toBe('macos')
        expect(['x64', 'arm64']).toContain(platformInfo.arch)
        expect(platformInfo.packageManager).toBe('bun')
      } finally {
        restorePlatform()
      }
    })

    test('1.1-E2E-002: should detect Linux platform correctly', () => {
      const restorePlatform = setupPlatformMock('linux')

      try {
        const setup = new SetupEnvironment()
        const platformInfo = (setup as SetupEnvironmentInstance).detectPlatform()

        expect(platformInfo.os).toBe('linux')
        expect(platformInfo.packageManager).toBe('bun')
      } finally {
        restorePlatform()
      }
    })

    test('1.1-E2E-003: should detect Windows platform correctly', () => {
      const restorePlatform = setupPlatformMock('win32')

      try {
        const setup = new SetupEnvironment()
        const platformInfo = (setup as SetupEnvironmentInstance).detectPlatform()

        expect(platformInfo.os).toBe('windows')
        expect(platformInfo.packageManager).toBe('bun')
      } finally {
        restorePlatform()
      }
    })
  })

  describe('Unsupported Platforms', () => {
    test('1.1-E2E-004: should throw error for unsupported platforms', () => {
      const restorePlatform = setupPlatformMock('freebsd')

      try {
        const setup = new SetupEnvironment()

        expect(() => (setup as SetupEnvironmentInstance).detectPlatform()).toThrow('Unsupported operating system')
      } finally {
        restorePlatform()
      }
    })
  })

  describe('Architecture Detection', () => {
    test('should detect common architectures correctly', () => {
      const restorePlatform = setupPlatformMock('darwin')

      try {
        const setup = new SetupEnvironment()
        const platformInfo = (setup as SetupEnvironmentInstance).detectPlatform()

        // Should detect either x64 or arm64 on macOS
        expect(['x64', 'arm64']).toContain(platformInfo.arch)
        expect(typeof platformInfo.arch).toBe('string')
      } finally {
        restorePlatform()
      }
    })

    test('should always return bun as package manager', () => {
      const platforms = ['darwin', 'linux', 'win32']

      platforms.forEach(platform => {
        const restorePlatform = setupPlatformMock(platform)

        try {
          const setup = new SetupEnvironment()
          const platformInfo = (setup as SetupEnvironmentInstance).detectPlatform()

          expect(platformInfo.packageManager).toBe('bun')
        } finally {
          restorePlatform()
        }
      })
    })
  })

  describe('Platform Detection Edge Cases', () => {
    test('should handle platform detection gracefully', () => {
      const restorePlatform = setupPlatformMock('darwin')

      try {
        const setup = new SetupEnvironment()
        const platformInfo = (setup as SetupEnvironmentInstance).detectPlatform()

        // Should return a complete platform info object
        expect(platformInfo).toHaveProperty('os')
        expect(platformInfo).toHaveProperty('arch')
        expect(platformInfo).toHaveProperty('packageManager')
        expect(typeof platformInfo.os).toBe('string')
        expect(typeof platformInfo.arch).toBe('string')
        expect(typeof platformInfo.packageManager).toBe('string')
      } finally {
        restorePlatform()
      }
    })
  })
})