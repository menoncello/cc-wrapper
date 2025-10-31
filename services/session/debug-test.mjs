import { setupTestMocks, cleanupTestMocks } from './src/test-mocks/test-setup.js';
import { verifyChecksum } from './src/lib/encryption.js';
import { mockSerializer } from './src/test-mocks/services.mock.js';

setupTestMocks();

// Test the mock
console.log('Mock serializer generateChecksum:', mockSerializer.generateChecksum());
console.log('verifyChecksum function:', verifyChecksum);

const testData = '{"test": "data"}';
verifyChecksum(testData, 'test-checksum').then(result => {
  console.log('verifyChecksum result:', result);
  cleanupTestMocks();
});
