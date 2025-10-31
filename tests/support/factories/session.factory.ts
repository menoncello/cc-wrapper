/**
 * Session Data Factories
 * Generates test data for session persistence testing using faker
 *
 * Follows data-factories.md knowledge base patterns:
 * - Uses faker for random data generation
 * - Supports overrides for specific scenarios
 * - Provides bulk creation helpers
 * - Auto-cleanup integration via fixtures
 */

import { faker } from '@faker-js/faker';

// Types for session data
export interface SessionState {
  files: Array<{
    path: string;
    content: string;
    lastModified: string;
    size: number;
  }>;
  terminal: {
    history: string[];
    currentDirectory: string;
    activeProcesses: Array<{
      pid: number;
      command: string;
      status: 'running' | 'stopped' | 'completed';
    }>;
  };
  browser: {
    openTabs: Array<{
      url: string;
      title: string;
      isActive: boolean;
    }>;
    activeTab: string;
  };
  aiConversations: {
    messages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: string;
      model?: string;
    }>;
    context: string;
    sessionId: string;
  };
}

export interface Session {
  id: string;
  userId: string;
  workspaceState: SessionState;
  encrypted: boolean;
  algorithm: string;
  createdAt: string;
  updatedAt: string;
  size: number;
  checkpointCount?: number;
}

export interface Checkpoint {
  id: string;
  sessionId: string;
  name: string;
  description?: string;
  workspaceState: SessionState;
  encrypted: boolean;
  algorithm: string;
  createdAt: string;
  size: number;
}

/**
 * Create a single file with realistic content
 */
export const createFile = (overrides = {}) => ({
  path: faker.system.filePath({ extCount: 1 }) + (faker.datatype.boolean() ? '.js' : '.ts'),
  content: faker.helpers.arrayElement([
    `function ${faker.helpers.slugify(faker.lorem.words(2))}() {\n  return ${faker.lorem.sentence()};\n}`,
    `const ${faker.helpers.slugify(faker.lorem.words(1))} = {\n  ${faker.lorem.words(3).split(' ').map(word => `${word}: "${faker.lorem.word()}"`).join(',\n  ')}\n};`,
    `export default class ${faker.helpers.capitalize(faker.lorem.word())} {\n  constructor() {\n    this.${faker.lorem.word()} = "${faker.lorem.word()}";\n  }\n}`,
    `// ${faker.lorem.sentence()}\n${faker.helpers.arrayElement(['console.log', 'console.error', 'console.warn'])}("${faker.lorem.sentence()}");`
  ]),
  lastModified: faker.date.recent().toISOString(),
  size: faker.number.int({ min: 100, max: 50000 }),
  ...overrides
});

/**
 * Create multiple files
 */
export const createFiles = (count: number, overrides = {}) =>
  Array.from({ length: count }, () => createFile(overrides));

/**
 * Create terminal state with realistic history
 */
export const createTerminalState = (overrides = {}) => ({
  history: faker.helpers.arrayElements([
    'npm install',
    'npm run dev',
    'npm test',
    'git status',
    'git add .',
    `git commit -m "${  faker.lorem.sentence()  }"`,
    'git push',
    'git pull',
    'npm run build',
    'npm run lint',
    'ls -la',
    `cd ${  faker.system.directoryPath()}`,
    `mkdir ${  faker.lorem.word()}`,
    `code ${  faker.system.fileName()}`,
    `docker build -t ${  faker.lorem.word()  } .`,
    'docker-compose up',
    'yarn install',
    'yarn start',
    `node ${  faker.system.fileName()}`,
    `python ${  faker.system.fileName()}`,
    'make',
    'cmake .'
  ], { min: 3, max: 15 }),
  currentDirectory: faker.system.directoryPath(),
  activeProcesses: faker.helpers.multiple(() => ({
    pid: faker.number.int({ min: 1000, max: 9999 }),
    command: faker.helpers.arrayElement([
      'npm run dev',
      'node server.js',
      'python app.py',
      'docker-compose up',
      'npm test',
      'webpack serve'
    ]),
    status: faker.helpers.arrayElement(['running', 'stopped', 'completed'])
  }), { count: { min: 0, max: 3 } }),
  ...overrides
});

/**
 * Create browser state with realistic tabs
 */
export const createBrowserState = (overrides = {}) => {
  const tabCount = faker.number.int({ min: 1, max: 8 });
  const activeTabIndex = faker.number.int({ min: 0, max: tabCount - 1 });

  const tabs = Array.from({ length: tabCount }, (_, index) => ({
    url: faker.helpers.arrayElement([
      'http://localhost:3000',
      'http://localhost:3000/docs',
      'http://localhost:3000/dashboard',
      `https://github.com/${  faker.internet.userName()  }/${  faker.lorem.word()}`,
      `https://stackoverflow.com/questions/${  faker.number.int({ min: 1000000, max: 9999999 })}`,
      `https://developer.mozilla.org/en-US/docs/${  faker.lorem.words(3).replace(/\s+/g, '/').toLowerCase()}`,
      `https://www.npmjs.com/package/${  faker.lorem.word()}`,
      `https://codepen.io/${  faker.internet.userName()  }/pen/${  faker.random.alphaNumeric(6)}`
    ]),
    title: faker.helpers.arrayElement([
      `${faker.helpers.capitalize(faker.lorem.words(3))  } - CC Wrapper`,
      `${faker.helpers.capitalize(faker.lorem.words(2))  } - Documentation`,
      faker.lorem.words(4).split(' ').map(word => faker.helpers.capitalize(word)).join(' '),
      `GitHub - ${  faker.internet.userName()  }/${  faker.lorem.word()}`,
      `${faker.lorem.question()  } - Stack Overflow`,
      `${faker.helpers.capitalize(faker.lorem.words(2))  } | MDN`,
      `${faker.lorem.word()  } - npm`,
      `CodePen - ${  faker.lorem.words(3).split(' ').map(w => faker.helpers.capitalize(w)).join(' ')}`
    ]),
    isActive: index === activeTabIndex
  }));

  return {
    openTabs: tabs,
    activeTab: tabs[activeTabIndex].url,
    ...overrides
  };
};

/**
 * Create AI conversation state
 */
export const createAIConversationState = (overrides = {}) => ({
  messages: faker.helpers.multiple(() => ({
    role: faker.helpers.arrayElement(['user', 'assistant', 'system']),
    content: faker.helpers.arrayElement([
      faker.lorem.sentences(3),
      faker.lorem.paragraph(),
      `\`\`\`${  faker.helpers.arrayElement(['javascript', 'typescript', 'python'])  }\n${ 
      faker.helpers.arrayElement([
        `function ${faker.lorem.word()}() {\n  return ${faker.lorem.sentence()};\n}`,
        `const ${faker.lorem.word()} = {\n  ${faker.lorem.words(3).split(' ').map(word => `${word}: "${faker.lorem.word()}"`).join(',\n  ')}\n};`,
        `class ${faker.helpers.capitalize(faker.lorem.word())} {\n  constructor() {}\n}`
      ])  }\n\`\`\``,
      `Here's what I think: ${  faker.lorem.paragraph()}`,
      `Let me explain: ${  faker.lorem.sentences(2)}`,
      `The issue is: ${  faker.lorem.sentence()}`
    ]),
    timestamp: faker.date.recent().toISOString(),
    model: faker.helpers.arrayElement(['gpt-4', 'claude-3', 'gemini-pro'])
  }), { count: { min: 2, max: 8 } }),
  context: faker.helpers.arrayElement([
    'JavaScript debugging session',
    'React component development',
    'API integration discussion',
    'Code review and optimization',
    'Architecture planning',
    'Bug investigation',
    'Feature implementation guidance'
  ]),
  sessionId: faker.string.uuid(),
  ...overrides
});

/**
 * Create complete session state
 */
export const createSessionState = (overrides = {}) => ({
  files: createFiles(faker.number.int({ min: 1, max: 10 })),
  terminal: createTerminalState(),
  browser: createBrowserState(),
  aiConversations: createAIConversationState(),
  ...overrides
});

/**
 * Create a complete session object
 */
export const createSession = (overrides = {}) => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  workspaceState: createSessionState(),
  encrypted: faker.datatype.boolean(),
  algorithm: 'AES-256-GCM',
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  size: faker.number.int({ min: 1000, max: 50000000 }), // 1KB to 50MB
  checkpointCount: faker.number.int({ min: 0, max: 10 }),
  ...overrides
});

/**
 * Create multiple sessions
 */
export const createSessions = (count: number, overrides = {}) =>
  Array.from({ length: count }, (_, index) =>
    createSession({
      ...overrides,
      createdAt: faker.date.past({ years: 0.1, refDate: new Date(Date.now() - index * 24 * 60 * 60 * 1000) }).toISOString()
    })
  );

/**
 * Create a checkpoint object
 */
export const createCheckpoint = (overrides = {}) => ({
  id: faker.string.uuid(),
  sessionId: faker.string.uuid(),
  name: faker.helpers.arrayElement([
    'Initial setup',
    'Feature implementation',
    'Bug fix completed',
    'Before refactor',
    'After refactor',
    'Testing phase',
    'Deployment ready',
    faker.lorem.words(3).split(' ').map(w => faker.helpers.capitalize(w)).join(' ')
  ]),
  description: faker.datatype.boolean() ? faker.lorem.paragraph() : undefined,
  workspaceState: createSessionState(),
  encrypted: true,
  algorithm: 'AES-256-GCM',
  createdAt: faker.date.recent().toISOString(),
  size: faker.number.int({ min: 1000, max: 50000000 }),
  ...overrides
});

/**
 * Create multiple checkpoints
 */
export const createCheckpoints = (count: number, sessionId?: string, overrides = {}) =>
  Array.from({ length: count }, (_, index) =>
    createCheckpoint({
      sessionId: sessionId || faker.string.uuid(),
      createdAt: faker.date.recent({ days: 1, refDate: new Date(Date.now() - index * 60 * 60 * 1000) }).toISOString(),
      ...overrides
    })
  );

/**
 * Create corrupted session state for testing recovery scenarios
 */
export const createCorruptedSessionState = (overrides = {}) => ({
  files: faker.datatype.boolean() ? createFiles(1) : [],
  terminal: createTerminalState(),
  browser: {}, // Missing required fields - corruption
  aiConversations: null, // Null instead of object - corruption
  corrupted: true,
  partialState: true,
  ...overrides
});

/**
 * Create oversized session state for testing size limits
 */
export const createOversizedSessionState = (sizeInMB = 55) => {
  const largeContent = 'x'.repeat(sizeInMB * 1024 * 1024);

  return {
    files: [{
      path: `${faker.system.fileName()  }.log`,
      content: largeContent,
      lastModified: faker.date.recent().toISOString(),
      size: largeContent.length
    }],
    terminal: createTerminalState(),
    browser: createBrowserState(),
    aiConversations: createAIConversationState()
  };
};

/**
 * Factory for session restoration test data
 */
export const createSessionRestorationData = (overrides = {}) => ({
  sessionId: faker.string.uuid(),
  restoreOptions: {
    includeAIConversations: faker.datatype.boolean(),
    includeTerminalHistory: faker.datatype.boolean(),
    includeBrowserTabs: faker.datatype.boolean(),
    includeFiles: true // Files almost always included
  },
  ...overrides
});

/**
 * Create session with specific encryption scenarios
 */
export const createSessionWithEncryption = (algorithm: string, keyStatus: 'valid' | 'invalid' | 'expired' = 'valid', overrides = {}) =>
  createSession({
    algorithm,
    encrypted: true,
    keyStatus,
    encryptionMetadata: {
      algorithm,
      keyDerivation: 'Argon2id',
      salt: faker.string.hexadecimal({ length: 32 }),
      iv: faker.string.hexadecimal({ length: 24 }),
      ...(keyStatus === 'expired' && { expiresAt: faker.date.past().toISOString() }),
      ...(keyStatus === 'invalid' && { valid: false })
    },
    ...overrides
  });

// Export types for use in tests
export type {
  Checkpoint,
  Session,
  SessionState};