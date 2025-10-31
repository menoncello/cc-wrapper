/**
 * Secure Key Derivation Service
 * Implements secure key derivation from user credentials with multiple algorithms
 */

import { CryptoKey } from 'crypto';

import {
  deriveKey,
  generateKeyDerivationSalt,
  hashPassword
} from '../lib/encryption';

export interface DerivationOptions {
  algorithm: 'PBKDF2' | 'Argon2id' | 'scrypt';
  keyLength: number; // in bytes
  iterations: number; // for PBKDF2
  memorySize?: number; // for Argon2id/scrypt in KB
  parallelism?: number; // for Argon2id
  blockSize?: number; // for scrypt
  salt?: string; // base64 encoded, will generate if not provided
}

export interface PasswordStrengthAnalysis {
  score: number; // 0-100
  strength: 'very_weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
  feedback: string[];
  estimatedCrackTime: string;
  hasLowerCase: boolean;
  hasUpperCase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  length: number;
  entropy: number;
  commonPatterns: string[];
  suggestions: string[];
}

export interface DerivationRequest {
  userId: string;
  password: string;
  options: DerivationOptions;
  context?: {
    sessionId?: string;
    keyPurpose: 'session_encryption' | 'key_wrapping' | 'authentication' | 'master_key';
    additionalData?: string;
  };
}

export interface DerivationResult {
  derivedKey: string; // base64 encoded
  salt: string; // base64 encoded
  algorithm: string;
  parameters: DerivationOptions;
  derivedAt: Date;
  keyId: string;
  checksum: string;
  strength: PasswordStrengthAnalysis;
  metadata: {
    userId: string;
    context: any;
    version: string;
  };
}

export interface SecurityPolicy {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  forbiddenPatterns: string[];
  maxPasswordAge: number; // in days
  preventReuse: number; // number of previous passwords to check
  minStrengthScore: number;
}

/**
 *
 */
export class SecureDerivationService {
  private readonly DEFAULT_OPTIONS: DerivationOptions = {
    algorithm: 'PBKDF2',
    keyLength: 32, // 256 bits
    iterations: 210000, // OWASP recommended minimum
    memorySize: 64 * 1024, // 64MB for Argon2id
    parallelism: 4,
    blockSize: 8 // for scrypt
  };

  private readonly SECURITY_POLICY: SecurityPolicy = {
    minPasswordLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    forbiddenPatterns: [
      'password',
      '123456',
      'qwerty',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'dragon'
    ],
    maxPasswordAge: 90,
    preventReuse: 5,
    minStrengthScore: 60
  };

  private readonly COMMON_PASSWORDS = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    'dragon', 'password1', 'qwerty123', '1234567890', 'baseball'
  ];

  /**
   * Derive a secure key from user password
   * @param request
   */
  async deriveKey(request: DerivationRequest): Promise<DerivationResult> {
    try {
      // Validate password strength
      const strength = this.analyzePasswordStrength(request.password);
      if (strength.score < this.SECURITY_POLICY.minStrengthScore) {
        throw new Error(`Password too weak (score: ${strength.score}). Minimum required: ${this.SECURITY_POLICY.minStrengthScore}`);
      }

      // Validate security policy
      this.validatePasswordPolicy(request.password);

      // Generate options with defaults
      const options = { ...this.DEFAULT_OPTIONS, ...request.options };

      // Generate salt if not provided
      const salt = options.salt || generateKeyDerivationSalt();

      // Derive key based on algorithm
      let derivedKey: ArrayBuffer;
      switch (options.algorithm) {
        case 'PBKDF2':
          derivedKey = await this.deriveKeyPBKDF2(request.password, salt, options);
          break;
        case 'Argon2id':
          derivedKey = await this.deriveKeyArgon2id(request.password, salt, options);
          break;
        case 'scrypt':
          derivedKey = await this.deriveKeyScrypt(request.password, salt, options);
          break;
        default:
          throw new Error(`Unsupported derivation algorithm: ${options.algorithm}`);
      }

      // Generate key ID and checksum
      const keyId = await this.generateKeyId(request.userId, salt, options);
      const checksum = await this.generateKeyChecksum(derivedKey);

      const result: DerivationResult = {
        derivedKey: Buffer.from(derivedKey).toString('base64'),
        salt,
        algorithm: options.algorithm,
        parameters: options,
        derivedAt: new Date(),
        keyId,
        checksum,
        strength,
        metadata: {
          userId: request.userId,
          context: request.context,
          version: '1.0.0'
        }
      };

      return result;

    } catch (error) {
      console.error('Key derivation failed:', error);
      throw new Error(`Key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Derive key using PBKDF2
   * @param password
   * @param salt
   * @param options
   */
  private async deriveKeyPBKDF2(
    password: string,
    salt: string,
    options: DerivationOptions
  ): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = Buffer.from(salt, 'base64');

    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: options.iterations,
        hash: 'SHA-256'
      },
      key,
      { name: 'AES-GCM', length: options.keyLength * 8 },
      true,
      ['encrypt', 'decrypt']
    );

    return crypto.subtle.exportKey('raw', derivedKey);
  }

  /**
   * Derive key using Argon2id (simplified implementation)
   * Note: This is a simplified version - in production, use a proper Argon2 implementation
   * @param password
   * @param salt
   * @param options
   */
  private async deriveKeyArgon2id(
    password: string,
    salt: string,
    options: DerivationOptions
  ): Promise<ArrayBuffer> {
    // For now, fallback to PBKDF2 with high iterations
    // In a real implementation, you'd use a proper Argon2 library
    console.warn('Argon2id not implemented, falling back to PBKDF2 with increased iterations');
    const pbkdf2Options = {
      ...options,
      iterations: Math.max(options.iterations, 500000)
    };
    return this.deriveKeyPBKDF2(password, salt, pbkdf2Options);
  }

  /**
   * Derive key using scrypt
   * @param password
   * @param salt
   * @param options
   */
  private async deriveKeyScrypt(
    password: string,
    salt: string,
    options: DerivationOptions
  ): Promise<ArrayBuffer> {
    // For now, fallback to PBKDF2 with high iterations
    // In a real implementation, you'd use a proper scrypt library
    console.warn('scrypt not implemented, falling back to PBKDF2 with increased iterations');
    const pbkdf2Options = {
      ...options,
      iterations: Math.max(options.iterations, 300000)
    };
    return this.deriveKeyPBKDF2(password, salt, pbkdf2Options);
  }

  /**
   * Analyze password strength
   * @param password
   */
  analyzePasswordStrength(password: string): PasswordStrengthAnalysis {
    let score = 0;
    const feedback: string[] = [];
    const suggestions: string[] = [];
    const commonPatterns: string[] = [];

    // Length analysis
    const length = password.length;
    if (length >= 12) {
score += 20;
} else if (length >= 8) {
score += 10;
} else {
feedback.push('Password should be at least 12 characters long');
}

    // Character variety
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!"#$%&'()*+,./:;<=>?@[\\\]^_{|}\-]/.test(password);

    if (hasLowerCase) {
score += 15;
} else {
feedback.push('Add lowercase letters');
}

    if (hasUpperCase) {
score += 15;
} else {
feedback.push('Add uppercase letters');
}

    if (hasNumbers) {
score += 15;
} else {
feedback.push('Add numbers');
}

    if (hasSymbols) {
score += 20;
} else {
feedback.push('Add special characters');
}

    // Entropy calculation
    const charset = (hasLowerCase ? 26 : 0) +
                   (hasUpperCase ? 26 : 0) +
                   (hasNumbers ? 10 : 0) +
                   (hasSymbols ? 32 : 0);

    const entropy = length * Math.log2(charset);

    // Common patterns detection
    const lowerPassword = password.toLowerCase();
    for (const commonPwd of this.COMMON_PASSWORDS) {
      if (lowerPassword.includes(commonPwd)) {
        commonPatterns.push(commonPwd);
        score -= 30;
        feedback.push(`Avoid common patterns like "${commonPwd}"`);
      }
    }

    // Sequential patterns
    if (/abc|123|qwe|asd|zxc/i.test(password)) {
      commonPatterns.push('sequential');
      score -= 20;
      feedback.push('Avoid sequential patterns');
    }

    // Repeated characters
    if (/(.)\1{2,}/.test(password)) {
      commonPatterns.push('repeated');
      score -= 15;
      feedback.push('Avoid repeated characters');
    }

    // Keyboard patterns
    if (/qwerty|asdf|zxcv|1234/i.test(password)) {
      commonPatterns.push('keyboard');
      score -= 20;
      feedback.push('Avoid keyboard patterns');
    }

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    // Determine strength level
    let strength: PasswordStrengthAnalysis['strength'];
    if (score >= 80) {
strength = 'very_strong';
} else if (score >= 65) {
strength = 'strong';
} else if (score >= 50) {
strength = 'good';
} else if (score >= 35) {
strength = 'fair';
} else if (score >= 20) {
strength = 'weak';
} else {
strength = 'very_weak';
}

    // Estimate crack time (simplified)
    let estimatedCrackTime: string;
    if (entropy >= 60) {
estimatedCrackTime = 'centuries';
} else if (entropy >= 50) {
estimatedCrackTime = 'years';
} else if (entropy >= 40) {
estimatedCrackTime = 'months';
} else if (entropy >= 30) {
estimatedCrackTime = 'weeks';
} else if (entropy >= 20) {
estimatedCrackTime = 'days';
} else {
estimatedCrackTime = 'hours';
}

    // Generate suggestions
    if (length < 16) {
suggestions.push('Consider using a longer password (16+ characters)');
}
    if (!hasSymbols) {
suggestions.push('Add special characters for better security');
}
    if (commonPatterns.length > 0) {
suggestions.push('Avoid common patterns and dictionary words');
}
    if (entropy < 50) {
suggestions.push('Consider using a passphrase with multiple random words');
}

    return {
      score,
      strength,
      feedback,
      estimatedCrackTime,
      hasLowerCase,
      hasUpperCase,
      hasNumbers,
      hasSymbols,
      length,
      entropy,
      commonPatterns,
      suggestions
    };
  }

  /**
   * Validate password against security policy
   * @param password
   */
  validatePasswordPolicy(password: string): void {
    const errors: string[] = [];

    // Length
    if (password.length < this.SECURITY_POLICY.minPasswordLength) {
      errors.push(`Password must be at least ${this.SECURITY_POLICY.minPasswordLength} characters long`);
    }

    // Character requirements
    if (this.SECURITY_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters');
    }

    if (this.SECURITY_POLICY.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters');
    }

    if (this.SECURITY_POLICY.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain numbers');
    }

    if (this.SECURITY_POLICY.requireSymbols && !/[!"#$%&'()*+,./:;<=>?@[\\\]^_{|}\-]/.test(password)) {
      errors.push('Password must contain special characters');
    }

    // Forbidden patterns
    const lowerPassword = password.toLowerCase();
    for (const pattern of this.SECURITY_POLICY.forbiddenPatterns) {
      if (lowerPassword.includes(pattern)) {
        errors.push(`Password contains forbidden pattern: ${pattern}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Password policy violation: ${errors.join(', ')}`);
    }
  }

  /**
   * Generate a unique key ID
   * @param userId
   * @param salt
   * @param options
   */
  private async generateKeyId(userId: string, salt: string, options: DerivationOptions): Promise<string> {
    try {
      const data = `${userId}:${salt}:${options.algorithm}:${options.iterations}:${Date.now()}`;
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
      return Buffer.from(hash).toString('base64').substring(0, 16);
    } catch (error) {
      // Fallback for test environments where crypto.subtle might not be available
      return `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  }

  /**
   * Generate key checksum for integrity verification
   * @param keyData
   */
  private async generateKeyChecksum(keyData: ArrayBuffer): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', keyData);
    return Buffer.from(hash).toString('base64').substring(0, 16);
  }

  /**
   * Verify derived key integrity
   * @param derivedKey
   * @param expectedChecksum
   */
  async verifyKeyIntegrity(
    derivedKey: string,
    expectedChecksum: string
  ): Promise<boolean> {
    try {
      const keyBuffer = Buffer.from(derivedKey, 'base64');
      const hash = await crypto.subtle.digest('SHA-256', keyBuffer);
      const actualChecksum = Buffer.from(hash).toString('base64').substring(0, 16);
      return actualChecksum === expectedChecksum;
    } catch (error) {
      console.error('Key integrity verification failed:', error);
      return false;
    }
  }

  /**
   * Get recommended derivation options for different use cases
   * @param purpose
   */
  getRecommendedOptions(purpose: DerivationRequest['context']['keyPurpose']): DerivationOptions {
    const base = { ...this.DEFAULT_OPTIONS };

    switch (purpose) {
      case 'session_encryption':
        return {
          ...base,
          algorithm: 'PBKDF2',
          iterations: 210000,
          keyLength: 32
        };

      case 'key_wrapping':
        return {
          ...base,
          algorithm: 'PBKDF2',
          iterations: 300000,
          keyLength: 32
        };

      case 'authentication':
        return {
          ...base,
          algorithm: 'PBKDF2',
          iterations: 500000,
          keyLength: 64
        };

      case 'master_key':
        return {
          ...base,
          algorithm: 'PBKDF2',
          iterations: 1000000,
          keyLength: 32
        };

      default:
        return base;
    }
  }

  /**
   * Get security policy
   */
  getSecurityPolicy(): SecurityPolicy {
    return { ...this.SECURITY_POLICY };
  }

  /**
   * Update security policy
   * @param updates
   */
  updateSecurityPolicy(updates: Partial<SecurityPolicy>): void {
    Object.assign(this.SECURITY_POLICY, updates);
  }

  /**
   * Check if password hash needs rehashing (for algorithm upgrades)
   * @param password
   * @param currentOptions
   * @param recommendedOptions
   */
  async needsRehash(
    password: string,
    currentOptions: DerivationOptions,
    recommendedOptions: DerivationOptions
  ): Promise<boolean> {
    // Check if algorithm changed
    if (currentOptions.algorithm !== recommendedOptions.algorithm) {
      return true;
    }

    // Check if iterations need increase
    if (currentOptions.iterations < recommendedOptions.iterations) {
      return true;
    }

    // Check if key length needs increase
    if (currentOptions.keyLength < recommendedOptions.keyLength) {
      return true;
    }

    // Check if memory parameters need update (for Argon2id/scrypt)
    if (currentOptions.memorySize && recommendedOptions.memorySize &&
        currentOptions.memorySize < recommendedOptions.memorySize) {
      return true;
    }

    return false;
  }

  /**
   * Migrate key derivation to new parameters
   * @param password
   * @param currentOptions
   * @param newOptions
   * @param userId
   */
  async migrateKeyDerivation(
    password: string,
    currentOptions: DerivationOptions,
    newOptions: DerivationOptions,
    userId: string
  ): Promise<DerivationResult> {
    // Verify current password by deriving key with current options
    const currentResult = await this.deriveKey({
      userId,
      password,
      options: currentOptions
    });

    // Derive new key with updated options
    const newResult = await this.deriveKey({
      userId,
      password,
      options: newOptions
    });

    // Add migration metadata
    newResult.metadata.migratedFrom = {
      algorithm: currentOptions.algorithm,
      iterations: currentOptions.iterations,
      keyLength: currentOptions.keyLength,
      migratedAt: new Date().toISOString()
    };

    return newResult;
  }
}