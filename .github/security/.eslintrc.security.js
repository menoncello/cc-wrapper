module.exports = {
  extends: ['plugin:security/recommended'],
  plugins: ['security'],
  rules: {
    // Security best practices
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-non-literal-require': 'error',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-bidi-characters': 'warn',
    'security/detect-eval-with-expression': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-lookup-prototype-override': 'error',
    'security/detect-express-csurf': 'warn',
    'security/detect-express-ptc': 'warn',
    'security/detect-missing-temp-file-cleanup': 'warn',
    'security/detect-mongodb-no-sqli': 'error',
    'security/detect-non-literal-filename-filename': 'warn',
    'security/detect-unsafe-regex-from-string': 'error',
    'security/detect-node-cipher-cbc': 'error',
    'security/detect-node-crypto-cbc': 'error',
    'security/detect-openssl-cbc': 'error',
    'security/detect-constant-comparisons': 'warn',
    'security/detect-clustering-invariant': 'warn',
    'security/detect-insecure-randomness': 'error',
    'security/detect-timing-attacks': 'warn',
    'security/detect-thenable': 'warn',
    'security/detect-cors-misconfiguration': 'error',
    'security/detect-expose-internals': 'warn',
    'security/detect-ssrf': 'error',
    'security/detect-sql-injection': 'error',
    'security/detect-xss': 'error',
    'security/detect-insecure-url-parsing': 'error',
    'security/detect-debug-salt': 'warn',
    'security/detect-weak-crypto': 'error',
    'security/detect-weak-hash': 'error',
    'security/detect-obsolete-crypto': 'error',
    'security/detect-unsafe-data-deserialization': 'error',
    'security/detect-unsafe-path-combination': 'error',
    'security/detect-hardcoded-secrets': 'error'
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.js', '**/__tests__/**'],
      rules: {
        // Allow some security rules in test files
        'security/detect-non-literal-fs-filename': 'off',
        'security/detect-non-literal-regexp': 'off'
      }
    }
  ]
};
