import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^[A-Z][A-Z_]*$' // Allow uppercase constant names (enums)
      }]
    }
  }
];