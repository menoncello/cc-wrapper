import { CreateSessionRequestSchema } from './src/schemas/session.js';

const validWorkspaceState = {
  terminalState: [{
    id: '550e8400-e29b-41d4-a716-446655440000',
    cwd: '/home/user/project',
    command: 'npm test',
    history: ['npm install', 'npm run dev', 'npm test'],
    env: { NODE_ENV: 'development' },
    isActive: true
  }],
  browserTabs: [{
    id: '550e8400-e29b-41d4-a716-446655440001',
    url: 'https://example.com',
    title: 'Example Page',
    isActive: true,
    scrollPosition: { x: 0, y: 100 }
  }],
  aiConversations: [{
    id: '550e8400-e29b-41d4-a716-446655440002',
    sessionId: '550e8400-e29b-41d4-a716-446655440003',
    messages: [{
      id: '550e8400-e29b-41d4-a716-446655440004',
      role: 'user' as const,
      content: 'Hello, how are you?',
      timestamp: new Date()
    }],
    createdAt: new Date(),
    updatedAt: new Date()
  }],
  openFiles: [{
    id: '550e8400-e29b-41d4-a716-446655440005',
    path: '/home/user/project/src/index.ts',
    content: 'console.log("Hello World");',
    cursor: { line: 1, column: 20 },
    scrollPosition: 0,
    isDirty: true,
    language: 'typescript'
  }]
};

console.log('Testing workspace state...');
try {
  const workspaceResult = CreateSessionRequestSchema.shape.workspaceState.safeParse(validWorkspaceState);
  console.log('Workspace state result:', workspaceResult);
} catch (error) {
  console.error('Workspace state error:', error);
}

console.log('Testing full session...');
const validData = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  workspaceId: '550e8400-e29b-41d4-a716-446655440001',
  name: 'My Session',
  workspaceState: validWorkspaceState
};

try {
  const result = CreateSessionRequestSchema.safeParse(validData);
  console.log('Full session result:', result);
} catch (error) {
  console.error('Full session error:', error);
}