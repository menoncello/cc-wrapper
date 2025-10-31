/**
 * Encryption API Routes
 * Handles data encryption/decryption operations at rest
 */

import { Elysia, t } from 'elysia';

import {   BatchDecryptionRequest,
  BatchEncryptionRequest,
  DecryptionRequest,
  EncryptionRequest,
EncryptionService } from '../services/encryption.service';

const encryptionService = new EncryptionService();

export const encryptionRoutes = new Elysia({ prefix: '/encryption' })
  .post(
    '/encrypt',
    async ({ body }) => {
      try {
        const result = await encryptionService.encryptSessionData(body);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to encrypt data:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to encrypt data'
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        keyId: t.String(),
        password: t.String(),
        data: t.String(),
        metadata: t.Optional(t.Record(t.String(), t.Any()))
      })
    }
  )
  .post(
    '/decrypt',
    async ({ body }) => {
      try {
        const result = await encryptionService.decryptSessionData(body);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to decrypt data:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to decrypt data'
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        keyId: t.String(),
        password: t.String(),
        encryptedData: t.Object({
          encryptedData: t.String(),
          iv: t.String(),
          algorithm: t.String()
        })
      })
    }
  )
  .post(
    '/encrypt/batch',
    async ({ body }) => {
      try {
        const result = await encryptionService.encryptBatch(body);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to encrypt batch:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to encrypt batch'
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        keyId: t.String(),
        password: t.String(),
        items: t.Array(t.Object({
          id: t.String(),
          data: t.String(),
          metadata: t.Optional(t.Record(t.String(), t.Any()))
        }))
      })
    }
  )
  .post(
    '/decrypt/batch',
    async ({ body }) => {
      try {
        const result = await encryptionService.decryptBatch(body);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to decrypt batch:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to decrypt batch'
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        keyId: t.String(),
        password: t.String(),
        encryptedItems: t.Array(t.Object({
          id: t.String(),
          encryptedData: t.Object({
            encryptedData: t.String(),
            iv: t.String(),
            algorithm: t.String()
          })
        }))
      })
    }
  )
  .post(
    '/rotate',
    async ({ body }) => {
      try {
        const result = await encryptionService.rotateEncryption(
          body.userId,
          body.currentKeyId,
          body.currentPassword,
          body.newKeyId,
          body.newPassword,
          body.encryptedItems
        );
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to rotate encryption:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to rotate encryption'
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        currentKeyId: t.String(),
        currentPassword: t.String(),
        newKeyId: t.String(),
        newPassword: t.String(),
        encryptedItems: t.Array(t.Object({
          id: t.String(),
          encryptedData: t.Object({
            encryptedData: t.String(),
            iv: t.String(),
            algorithm: t.String()
          })
        }))
      })
    }
  )
  .get(
    '/metrics/:userId',
    async ({ params }) => {
      try {
        const metrics = encryptionService.getEncryptionMetrics(params.userId);
        return {
          success: true,
          data: metrics
        };
      } catch (error) {
        console.error('Failed to get encryption metrics:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get metrics'
        };
      }
    },
    {
      params: t.Object({
        userId: t.String()
      })
    }
  )
  .delete(
    '/metrics/:userId',
    async ({ params }) => {
      try {
        encryptionService.resetEncryptionMetrics(params.userId);
        return {
          success: true,
          message: 'Metrics reset successfully'
        };
      } catch (error) {
        console.error('Failed to reset encryption metrics:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to reset metrics'
        };
      }
    },
    {
      params: t.Object({
        userId: t.String()
      })
    }
  )
  .get(
    '/stats',
    async () => {
      try {
        const stats = encryptionService.getEncryptionStats();
        return {
          success: true,
          data: stats
        };
      } catch (error) {
        console.error('Failed to get encryption stats:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get stats'
        };
      }
    }
  )
  .post(
    '/test',
    async ({ body }) => {
      try {
        const result = await encryptionService.testEncryption(
          body.userId,
          body.keyId,
          body.password
        );
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to test encryption:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to test encryption'
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        keyId: t.String(),
        password: t.String()
      })
    }
  )
  .post(
    '/validate',
    async ({ body }) => {
      try {
        const validation = encryptionService.validateEncryptionParameters(
          body.algorithm,
          body.keySize
        );
        return {
          success: true,
          data: validation
        };
      } catch (error) {
        console.error('Failed to validate encryption parameters:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to validate parameters'
        };
      }
    },
    {
      body: t.Object({
        algorithm: t.String(),
        keySize: t.Optional(t.Integer())
      })
    }
  );