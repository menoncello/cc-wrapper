/**
 * Secure Key Derivation API Routes
 * Handles secure key derivation from user credentials
 */

import { Elysia, t } from 'elysia';

import {   DerivationOptions,
  DerivationRequest,
SecureDerivationService } from '../services/secure-derivation.service';

const secureDerivationService = new SecureDerivationService();

export const secureDerivationRoutes = new Elysia({ prefix: '/derivation' })
  .post(
    '/derive',
    async ({ body }) => {
      try {
        const result = await secureDerivationService.deriveKey(body);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to derive key:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to derive key'
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        password: t.String(),
        options: t.Object({
          algorithm: t.Union([t.Literal('PBKDF2'), t.Literal('Argon2id'), t.Literal('scrypt')]),
          keyLength: t.Integer(),
          iterations: t.Integer(),
          memorySize: t.Optional(t.Integer()),
          parallelism: t.Optional(t.Integer()),
          blockSize: t.Optional(t.Integer()),
          salt: t.Optional(t.String())
        }),
        context: t.Optional(t.Object({
          sessionId: t.Optional(t.String()),
          keyPurpose: t.Union([
            t.Literal('session_encryption'),
            t.Literal('key_wrapping'),
            t.Literal('authentication'),
            t.Literal('master_key')
          ]),
          additionalData: t.Optional(t.String())
        }))
      })
    }
  )
  .post(
    '/analyze',
    async ({ body }) => {
      try {
        const analysis = secureDerivationService.analyzePasswordStrength(body.password);
        return {
          success: true,
          data: analysis
        };
      } catch (error) {
        console.error('Failed to analyze password:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to analyze password'
        };
      }
    },
    {
      body: t.Object({
        password: t.String()
      })
    }
  )
  .post(
    '/validate',
    async ({ body }) => {
      try {
        secureDerivationService.validatePasswordPolicy(body.password);
        return {
          success: true,
          message: 'Password meets security policy requirements'
        };
      } catch (error) {
        console.error('Password validation failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Password validation failed'
        };
      }
    },
    {
      body: t.Object({
        password: t.String()
      })
    }
  )
  .post(
    '/verify-integrity',
    async ({ body }) => {
      try {
        const isValid = await secureDerivationService.verifyKeyIntegrity(
          body.derivedKey,
          body.expectedChecksum
        );
        return {
          success: true,
          data: {
            isValid,
            message: isValid ? 'Key integrity verified' : 'Key integrity check failed'
          }
        };
      } catch (error) {
        console.error('Failed to verify key integrity:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to verify key integrity'
        };
      }
    },
    {
      body: t.Object({
        derivedKey: t.String(),
        expectedChecksum: t.String()
      })
    }
  )
  .get(
    '/options/:purpose',
    async ({ params }) => {
      try {
        const options = secureDerivationService.getRecommendedOptions(params.purpose);
        return {
          success: true,
          data: options
        };
      } catch (error) {
        console.error('Failed to get recommended options:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get options'
        };
      }
    },
    {
      params: t.Object({
        purpose: t.Union([
          t.Literal('session_encryption'),
          t.Literal('key_wrapping'),
          t.Literal('authentication'),
          t.Literal('master_key')
        ])
      })
    }
  )
  .get(
    '/policy',
    () => {
      try {
        const policy = secureDerivationService.getSecurityPolicy();
        return {
          success: true,
          data: policy
        };
      } catch (error) {
        console.error('Failed to get security policy:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get policy'
        };
      }
    }
  )
  .put(
    '/policy',
    async ({ body }) => {
      try {
        secureDerivationService.updateSecurityPolicy(body);
        return {
          success: true,
          message: 'Security policy updated successfully'
        };
      } catch (error) {
        console.error('Failed to update security policy:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update policy'
        };
      }
    },
    {
      body: t.Object({
        minPasswordLength: t.Optional(t.Integer()),
        requireUppercase: t.Optional(t.Boolean()),
        requireLowercase: t.Optional(t.Boolean()),
        requireNumbers: t.Optional(t.Boolean()),
        requireSymbols: t.Optional(t.Boolean()),
        forbiddenPatterns: t.Optional(t.Array(t.String())),
        maxPasswordAge: t.Optional(t.Integer()),
        preventReuse: t.Optional(t.Integer()),
        minStrengthScore: t.Optional(t.Integer())
      })
    }
  )
  .post(
    '/needs-rehash',
    async ({ body }) => {
      try {
        const recommended = secureDerivationService.getRecommendedOptions(body.purpose);
        const needsRehash = await secureDerivationService.needsRehash(
          body.password,
          body.currentOptions,
          recommended
        );
        return {
          success: true,
          data: {
            needsRehash,
            currentOptions: body.currentOptions,
            recommendedOptions: recommended
          }
        };
      } catch (error) {
        console.error('Failed to check if rehash needed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to check rehash requirement'
        };
      }
    },
    {
      body: t.Object({
        password: t.String(),
        currentOptions: t.Object({
          algorithm: t.Union([t.Literal('PBKDF2'), t.Literal('Argon2id'), t.Literal('scrypt')]),
          keyLength: t.Integer(),
          iterations: t.Integer(),
          memorySize: t.Optional(t.Integer()),
          parallelism: t.Optional(t.Integer()),
          blockSize: t.Optional(t.Integer())
        }),
        purpose: t.Union([
          t.Literal('session_encryption'),
          t.Literal('key_wrapping'),
          t.Literal('authentication'),
          t.Literal('master_key')
        ])
      })
    }
  )
  .post(
    '/migrate',
    async ({ body }) => {
      try {
        const result = await secureDerivationService.migrateKeyDerivation(
          body.password,
          body.currentOptions,
          body.newOptions,
          body.userId
        );
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Failed to migrate key derivation:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to migrate key derivation'
        };
      }
    },
    {
      body: t.Object({
        password: t.String(),
        userId: t.String(),
        currentOptions: t.Object({
          algorithm: t.Union([t.Literal('PBKDF2'), t.Literal('Argon2id'), t.Literal('scrypt')]),
          keyLength: t.Integer(),
          iterations: t.Integer(),
          memorySize: t.Optional(t.Integer()),
          parallelism: t.Optional(t.Integer()),
          blockSize: t.Optional(t.Integer())
        }),
        newOptions: t.Object({
          algorithm: t.Union([t.Literal('PBKDF2'), t.Literal('Argon2id'), t.Literal('scrypt')]),
          keyLength: t.Integer(),
          iterations: t.Integer(),
          memorySize: t.Optional(t.Integer()),
          parallelism: t.Optional(t.Integer()),
          blockSize: t.Optional(t.Integer())
        })
      })
    }
  );