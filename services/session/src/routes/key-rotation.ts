/**
 * Key Rotation API Routes
 * Handles automated and manual key rotation operations
 */

import { Elysia, t } from 'elysia';

import {   KeyRotationPolicy,
  KeyRotationRequest,
KeyRotationService } from '../services/key-rotation.service';

const keyRotationService = new KeyRotationService();

export const keyRotationRoutes = new Elysia({ prefix: '/rotation' })
  .get(
    '/policy',
    () => {
      try {
        const policy = keyRotationService.getDefaultPolicy();
        return {
          success: true,
          data: policy
        };
      } catch (error) {
        console.error('Failed to get default policy:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get policy'
        };
      }
    }
  )
  .get(
    '/check/:userId',
    async ({ params, query }) => {
      try {
        const policy = query.policy ? JSON.parse(query.policy as string) : undefined;
        const result = await keyRotationService.checkKeysNeedingRotation(params.userId, policy);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to check keys needing rotation:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to check keys'
        };
      }
    },
    {
      params: t.Object({
        userId: t.String()
      }),
      query: t.Object({
        policy: t.Optional(t.String())
      })
    }
  )
  .post(
    '/rotate',
    async ({ body }) => {
      try {
        const result = await keyRotationService.initiateKeyRotation(body);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to initiate key rotation:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to initiate rotation'
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        keyId: t.String(),
        newKeyName: t.Optional(t.String()),
        newPassword: t.String(),
        currentPassword: t.String(),
        reason: t.Optional(t.String()),
        forceRotation: t.Optional(t.Boolean()),
        reEncryptData: t.Optional(t.Boolean()),
        preserveAccess: t.Optional(t.Boolean())
      })
    }
  )
  .get(
    '/task/:rotationId',
    async ({ params }) => {
      try {
        const task = keyRotationService.getRotationTaskStatus(params.rotationId);
        return {
          success: true,
          data: task
        };
      } catch (error) {
        console.error('Failed to get rotation task status:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get task status'
        };
      }
    },
    {
      params: t.Object({
        rotationId: t.String()
      })
    }
  )
  .get(
    '/tasks/:userId',
    async ({ params }) => {
      try {
        const tasks = keyRotationService.getUserRotationTasks(params.userId);
        return {
          success: true,
          data: tasks
        };
      } catch (error) {
        console.error('Failed to get user rotation tasks:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get tasks'
        };
      }
    },
    {
      params: t.Object({
        userId: t.String()
      })
    }
  )
  .post(
    '/task/:rotationId/cancel',
    async ({ params, body }) => {
      try {
        const success = await keyRotationService.cancelRotationTask(params.rotationId, body.userId);
        return {
          success,
          message: success ? 'Task cancelled successfully' : 'Failed to cancel task or task not found'
        };
      } catch (error) {
        console.error('Failed to cancel rotation task:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to cancel task'
        };
      }
    },
    {
      params: t.Object({
        rotationId: t.String()
      }),
      body: t.Object({
        userId: t.String()
      })
    }
  )
  .post(
    '/cleanup',
    async ({ body }) => {
      try {
        const result = await keyRotationService.cleanupExpiredKeys(
          body.userId,
          body.gracePeriodDays
        );
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to cleanup expired keys:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to cleanup keys'
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        gracePeriodDays: t.Optional(t.Integer())
      })
    }
  )
  .get(
    '/metrics/:userId',
    async ({ params }) => {
      try {
        const metrics = keyRotationService.getRotationMetrics(params.userId);
        return {
          success: true,
          data: metrics
        };
      } catch (error) {
        console.error('Failed to get rotation metrics:', error);
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
  .get(
    '/metrics',
    async () => {
      try {
        const allMetrics = keyRotationService.getAllRotationMetrics();
        return {
          success: true,
          data: Object.fromEntries(allMetrics)
        };
      } catch (error) {
        console.error('Failed to get all rotation metrics:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get all metrics'
        };
      }
    }
  )
  .post(
    '/schedule-auto/:userId',
    async ({ params, body }) => {
      try {
        await keyRotationService.scheduleAutomaticRotationCheck(params.userId, body.policy);
        return {
          success: true,
          message: 'Automatic rotation check scheduled successfully'
        };
      } catch (error) {
        console.error('Failed to schedule automatic rotation:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to schedule automatic rotation'
        };
      }
    },
    {
      params: t.Object({
        userId: t.String()
      }),
      body: t.Object({
        policy: t.Object({
          rotationIntervalDays: t.Optional(t.Integer()),
          warningDaysBefore: t.Optional(t.Integer()),
          maxKeyAgeDays: t.Optional(t.Integer()),
          gracePeriodDays: t.Optional(t.Integer()),
          autoRotateEnabled: t.Optional(t.Boolean()),
          notifyBeforeRotation: t.Optional(t.Boolean())
        })
      })
    }
  );