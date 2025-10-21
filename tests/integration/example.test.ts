/**
 * Integration Test Example
 *
 * Integration tests verify that different modules/components work together correctly.
 * They test interactions between units, database operations, API calls, etc.
 *
 * Best Practices:
 * - Test realistic workflows and scenarios
 * - Use test databases or sandboxed environments
 * - Clean up resources after each test
 * - Test error handling and edge cases
 * - Verify data persistence and retrieval
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Example: File System Integration Tests
 * Tests the interaction between file operations and the file system
 */
class FileManager {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async createFile(filename: string, content: string): Promise<void> {
    const filePath = path.join(this.basePath, filename);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async readFile(filename: string): Promise<string> {
    const filePath = path.join(this.basePath, filename);
    return await fs.readFile(filePath, 'utf-8');
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.basePath, filename);
    await fs.unlink(filePath);
  }

  async listFiles(): Promise<string[]> {
    const files = await fs.readdir(this.basePath);
    return files.filter(file => !file.startsWith('.'));
  }

  async fileExists(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.basePath, filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

describe('FileManager - Integration Tests', () => {
  const testDir = path.join(process.cwd(), 'temp-integration-test');
  let fileManager: FileManager;

  beforeAll(async () => {
    // Set up test directory
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    fileManager = new FileManager(testDir);
  });

  afterEach(async () => {
    // Clean up files created during tests
    const files = await fs.readdir(testDir);
    for (const file of files) {
      await fs.unlink(path.join(testDir, file));
    }
  });

  describe('File Creation and Reading', () => {
    test('should create and read a text file', async () => {
      // Arrange
      const filename = 'test.txt';
      const content = 'Hello, integration testing!';

      // Act
      await fileManager.createFile(filename, content);
      const readContent = await fileManager.readFile(filename);

      // Assert
      expect(readContent).toBe(content);
    });

    test('should create multiple files', async () => {
      // Arrange
      const files = [
        { name: 'file1.txt', content: 'Content 1' },
        { name: 'file2.txt', content: 'Content 2' },
        { name: 'file3.txt', content: 'Content 3' }
      ];

      // Act
      for (const file of files) {
        await fileManager.createFile(file.name, file.content);
      }

      const fileList = await fileManager.listFiles();

      // Assert
      expect(fileList.length).toBe(3);
      expect(fileList).toContain('file1.txt');
      expect(fileList).toContain('file2.txt');
      expect(fileList).toContain('file3.txt');
    });
  });

  describe('File Deletion', () => {
    test('should delete existing file', async () => {
      // Arrange
      const filename = 'to-delete.txt';
      await fileManager.createFile(filename, 'Delete me');

      // Act
      await fileManager.deleteFile(filename);
      const exists = await fileManager.fileExists(filename);

      // Assert
      expect(exists).toBe(false);
    });

    test('should throw error when deleting non-existent file', async () => {
      // Arrange
      const filename = 'non-existent.txt';

      // Act & Assert
      expect(async () => {
        await fileManager.deleteFile(filename);
      }).toThrow();
    });
  });

  describe('File Listing', () => {
    test('should list all files in directory', async () => {
      // Arrange
      await fileManager.createFile('doc1.md', '# Document 1');
      await fileManager.createFile('doc2.md', '# Document 2');
      await fileManager.createFile('data.json', '{}');

      // Act
      const files = await fileManager.listFiles();

      // Assert
      expect(files.length).toBe(3);
      expect(files).toContain('doc1.md');
      expect(files).toContain('doc2.md');
      expect(files).toContain('data.json');
    });

    test('should return empty array for empty directory', async () => {
      // Act
      const files = await fileManager.listFiles();

      // Assert
      expect(files).toEqual([]);
    });
  });

  describe('File Existence Check', () => {
    test('should return true for existing file', async () => {
      // Arrange
      await fileManager.createFile('exists.txt', 'I exist');

      // Act
      const exists = await fileManager.fileExists('exists.txt');

      // Assert
      expect(exists).toBe(true);
    });

    test('should return false for non-existent file', async () => {
      // Act
      const exists = await fileManager.fileExists('does-not-exist.txt');

      // Assert
      expect(exists).toBe(false);
    });
  });

  describe('Complex Workflows', () => {
    test('should handle create-read-update-delete workflow', async () => {
      // Arrange
      const filename = 'workflow.txt';
      const initialContent = 'Initial content';
      const updatedContent = 'Updated content';

      // Act & Assert - Create
      await fileManager.createFile(filename, initialContent);
      expect(await fileManager.fileExists(filename)).toBe(true);

      // Act & Assert - Read
      const content1 = await fileManager.readFile(filename);
      expect(content1).toBe(initialContent);

      // Act & Assert - Update
      await fileManager.createFile(filename, updatedContent);
      const content2 = await fileManager.readFile(filename);
      expect(content2).toBe(updatedContent);

      // Act & Assert - Delete
      await fileManager.deleteFile(filename);
      expect(await fileManager.fileExists(filename)).toBe(false);
    });
  });
});
