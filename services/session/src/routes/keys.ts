/**
 * Key Management API Routes
 * Handles user-controlled encryption keys with PBKDF2 key derivation
 */

import { Elysia, t } from 'elysia';

import { SessionKeyManagementService } from '../services/key-management.service';
import {
  EncryptionKey,
  KeyDerivationRequest,
  KeyGenerationOptions,
  KeyListResponse,
  KeyRotationRequest,
  KeyValidationResult,
  UserEncryptionKey as UserEncryptionKeyType} from '../types/key-management';

const keyManagementService = new SessionKeyManagementService();

export const keysRoutes = new Elysia({ prefix: '/keys' })
  .get(
    '/',
    async ({ query }) => {
      try {
        const userId = query.userId;
        if (!userId) {
          throw new Error('User ID is required');
        }

        const result = await keyManagementService.listUserKeys(userId);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to list user keys:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to list keys'
        };
      }
    },
    {
      query: t.Object({
        userId: t.String(),
        activeOnly: t.Optional(t.Boolean()),
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric())
      })
    }
  )
  .post(
    '/',
    async ({ body }) => {
      try {
        const result = await keyManagementService.createUserKey(body);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to create user key:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create key'
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        keyName: t.String(),
        password: t.String(),
        description: t.Optional(t.String()),
        tags: t.Optional(t.Array(t.String())),
        expiresInDays: t.Optional(t.Numeric()),
        metadata: t.Optional(t.Object({}))
      })
    }
  )
  .post(
    '/validate',
    async ({ body }) => {
      try {
        const result = await keyManagementService.validateUserKey(
          body.userId,
          body.keyId,
          body.password
        );
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to validate user key:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to validate key'
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
    '/rotate',
    async ({ body }) => {
      try {
        const result = await keyManagementService.rotateUserKey(body);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to rotate user key:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to rotate key'
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        keyId: t.String(),
        currentPassword: t.String(),
        newKeyName: t.Optional(t.String()),
        newPassword: t.String(),
        description: t.Optional(t.String()),
        tags: t.Optional(t.Array(t.String())),
        expiresInDays: t.Optional(t.Numeric()),
        reEncryptData: t.Optional(t.Boolean())
      })
    }
  )
  .post(
    '/encrypt',
    async ({ body }) => {
      try {
        const result = await keyManagementService.encryptWithUserKey(
          body.userId,
          body.keyId,
          body.password,
          body.data
        );
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
        data: t.String()
      })
    }
  )
  .post(
    '/decrypt',
    async ({ body }) => {
      try {
        const result = await keyManagementService.decryptWithUserKey(
          body.userId,
          body.keyId,
          body.password,
          body.encryptedKey
        );
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
        encryptedKey: t.Object({
          encryptedData: t.String(),
          iv: t.String(),
          algorithm: t.String()
        })
      })
    }
  )
  .post(
    '/:keyId/deactivate',
    async ({ params, body }) => {
      try {
        const result = await keyManagementService.deactivateKey(
          params.keyId,
          body.userId,
          body.reason
        );
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to deactivate key:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to deactivate key'
        };
      }
    },
    {
      params: t.Object({
        keyId: t.String()
      }),
      body: t.Object({
        userId: t.String(),
        reason: t.String()
      })
    }
  )
  .get(
    '/:keyId',
    async ({ params, query }) => {
      try {
        const result = await keyManagementService.getKeyInfo(params.keyId, query.userId);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to get key info:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get key info'
        };
      }
    },
    {
      params: t.Object({
        keyId: t.String()
      }),
      query: t.Object({
        userId: t.String()
      })
    }
  )
  .post(
    '/audit/check',
    async ({ body }) => {
      try {
        const result = await keyManagementService.performSecurityAudit(body.userId);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to perform security audit:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to perform security audit'
        };
      }
    },
    {
      body: t.Object({
        userId: t.String()
      })
    }
  )
  .post(
    '/export',
    async ({ body }) => {
      try {
        const result = await keyManagementService.exportUserData(
          body.userId,
          body.password,
          body.includeInactive
        );
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to export user data:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to export user data'
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        password: t.String(),
        includeInactive: t.Optional(t.Boolean())
      })
    }
  )
  .delete(
    '/:keyId',
    async ({ params, query }) => {
      try {
        await keyManagementService.deleteKey(params.keyId, query.userId);
        return {
          success: true,
          message: 'Key deleted successfully'
        };
      } catch (error) {
        console.error('Failed to delete key:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete key'
        };
      }
    },
    {
      params: t.Object({
        keyId: t.String()
      }),
      query: t.Object({
        userId: t.String()
      })
    }
  );